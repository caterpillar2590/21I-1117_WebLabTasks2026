const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation rules
const registerValidation = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
        .isLength({ max: 30 }).withMessage('Username cannot exceed 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    body('role')
        .optional()
        .isIn(['coach', 'trainee', 'admin']).withMessage('Role must be coach, trainee, or admin')
];

const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email'),
    
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, authController.registerUser);
router.post('/login', loginValidation, authController.loginUser);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
