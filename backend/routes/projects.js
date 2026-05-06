const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('Admin'), [
    body('title').trim().notEmpty().withMessage('Project title is required')
  ], createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('Admin'), updateProject)
  .delete(authorize('Admin'), deleteProject);

router.post('/:id/members', authorize('Admin'), addMember);
router.delete('/:id/members/:userId', authorize('Admin'), removeMember);

module.exports = router;
