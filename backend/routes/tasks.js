const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getTasks, createTask, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('Admin'), [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('project').notEmpty().withMessage('Project ID is required')
  ], createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(authorize('Admin'), deleteTask);

module.exports = router;
