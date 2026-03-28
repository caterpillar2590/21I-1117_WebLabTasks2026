const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE SCHEMA ====================
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['coach', 'trainee', 'admin'],
        default: 'trainee'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    // Password reset fields
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpire: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = Date.now();
    await this.save();
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token and store in database
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expiry to 1 hour from now
    this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    
    return resetToken;
};

// Method to reset password
userSchema.methods.resetPassword = async function(newPassword) {
    this.password = newPassword;
    this.resetPasswordToken = undefined;
    this.resetPasswordExpire = undefined;
    await this.save();
};

const User = mongoose.model('User', userSchema);

// ==================== JWT HELPER FUNCTIONS ====================
const generateToken = (userId, username) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// ==================== AUTH MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// ==================== VALIDATION RULES ====================
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

const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// ==================== CONTROLLERS ====================

// Register User
const registerUser = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            role: role || 'trainee'
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate JWT token
        const token = generateToken(user._id, user.username);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get Current User Profile
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -resetPasswordToken -resetPasswordExpire');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Forgot Password - Generate Reset Token
const forgotPassword = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            // For security, don't reveal that email doesn't exist
            return res.status(200).json({ 
                message: 'If an account with that email exists, a password reset token has been generated' 
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // In a real application, you would send this token via email
        // For testing purposes, we're returning it in the response
        // The token would normally be sent in a password reset email
        
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        res.status(200).json({
            message: 'Reset token generated',
            // Only include token in response for testing purposes
            // In production, this should NOT be returned
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// Reset Password - Use Token to Set New Password
const resetPassword = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.params;
        const { newPassword } = req.body;

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        // Reset password
        await user.resetPassword(newPassword);

        res.status(200).json({
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

// ==================== ROUTES ====================

// Public routes
app.post('/api/auth/register', registerValidation, registerUser);
app.post('/api/auth/login', loginValidation, loginUser);
app.post('/api/auth/forgot-password', forgotPasswordValidation, forgotPassword);
app.post('/api/auth/reset-password/:token', resetPasswordValidation, resetPassword);

// Protected routes
app.get('/api/auth/me', authMiddleware, getCurrentUser);

// Root route with documentation
app.get('/', (req, res) => {
    res.json({
        message: 'Fitness App Authentication API',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            forgotPassword: 'POST /api/auth/forgot-password',
            resetPassword: 'POST /api/auth/reset-password/:token',
            profile: 'GET /api/auth/me (requires token)'
        },
        exampleRequests: {
            register: {
                method: 'POST',
                url: '/api/auth/register',
                body: {
                    username: 'fit_user',
                    email: 'fituser@example.com',
                    password: 'password123',
                    role: 'trainee'
                }
            },
            login: {
                method: 'POST',
                url: '/api/auth/login',
                body: {
                    email: 'fituser@example.com',
                    password: 'password123'
                }
            },
            forgotPassword: {
                method: 'POST',
                url: '/api/auth/forgot-password',
                body: {
                    email: 'fituser@example.com'
                }
            },
            resetPassword: {
                method: 'POST',
                url: '/api/auth/reset-password/:token',
                body: {
                    newPassword: 'newPassword123'
                }
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// ==================== DATABASE CONNECTION & SERVER START ====================
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness_app';

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log(' MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(` Server running on http://localhost:${PORT}`);
        console.log(`\n Available endpoints:`);
        console.log(`   POST   /api/auth/register           - Register new user`);
        console.log(`   POST   /api/auth/login              - Login user`);
        console.log(`   POST   /api/auth/forgot-password    - Request password reset`);
        console.log(`   POST   /api/auth/reset-password/:token - Reset password with token`);
        console.log(`   GET    /api/auth/me                 - Get user profile (protected)`);
        console.log(`\n🔧 Testing password reset flow:`);
        console.log(`   1. POST /api/auth/forgot-password with email`);
        console.log(`   2. Get reset token from response (development mode)`);
        console.log(`   3. POST /api/auth/reset-password/{token} with new password`);
    });
})
.catch((error) => {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('\n MongoDB connection closed');
    process.exit(0);
});

module.exports = app;
