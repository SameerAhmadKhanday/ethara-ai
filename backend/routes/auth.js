const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['Admin', 'Member']).withMessage('Role must be Admin or Member')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Admin'), getAllUsers);

module.exports = router;
