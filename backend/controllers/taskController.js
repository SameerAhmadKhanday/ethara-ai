const Task = require('../models/Task');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Helper: check if user has access to project
const hasProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { access: false, project: null };
  if (userRole === 'Admin') return { access: true, project };
  const isMember = project.members.some(m => m.toString() === userId.toString());
  const isOwner = project.owner.toString() === userId.toString();
  return { access: isMember || isOwner, project };
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    let query = {};

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    if (req.user.role !== 'Admin') {
      query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
    }

    const tasks = await Task.find(query)
      .populate('project', 'title color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { title, description, project, assignedTo, priority, dueDate, status, tags } = req.body;

    const { access } = await hasProjectAccess(project, req.user._id, req.user.role);
    if (!access) return res.status(403).json({ success: false, message: 'No access to this project' });

    const task = await Task.create({
      title, description, project, assignedTo, priority, dueDate, status, tags,
      createdBy: req.user._id
    });

    await task.populate('project', 'title color');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update task (Members can update status only)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'Member') {
      // Members can only update status
      if (req.body.status) task.status = req.body.status;
    } else {
      // Admin can update everything
      const { title, description, assignedTo, priority, dueDate, status, tags } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (status) task.status = status;
      if (tags) task.tags = tags;
    }

    await task.save();
    await task.populate('project', 'title color');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask };
