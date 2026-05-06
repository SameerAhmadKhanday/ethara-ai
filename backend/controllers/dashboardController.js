const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    let taskQuery = {};
    let projectQuery = {};

    if (req.user.role !== 'Admin') {
      taskQuery.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
      projectQuery.$or = [{ owner: req.user._id }, { members: req.user._id }];
    }

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      doneTasks,
      overdueTasks,
      totalProjects,
      activeProjects,
      recentTasks
    ] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'Todo' }),
      Task.countDocuments({ ...taskQuery, status: 'In Progress' }),
      Task.countDocuments({ ...taskQuery, status: 'In Review' }),
      Task.countDocuments({ ...taskQuery, status: 'Done' }),
      Task.countDocuments({ ...taskQuery, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
      Project.countDocuments(projectQuery),
      Project.countDocuments({ ...projectQuery, status: 'Active' }),
      Task.find(taskQuery)
        .populate('project', 'title color')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(8)
    ]);

    const overdueTasksList = await Task.find({
      ...taskQuery,
      status: { $ne: 'Done' },
      dueDate: { $lt: now }
    })
      .populate('project', 'title color')
      .populate('assignedTo', 'name email')
      .sort({ dueDate: 1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueTasks,
        totalProjects,
        activeProjects
      },
      recentTasks,
      overdueTasksList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard };
