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
        enum: ['admin', 'content_creator', 'viewer'],
        default: 'viewer'
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
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
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

// ==================== CONTENT SCHEMA (for demo purposes) ====================
const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creatorName: String,
    category: {
        type: String,
        enum: ['movie', 'series', 'documentary', 'music', 'sports'],
        default: 'movie'
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    publishedAt: Date
});

const Content = mongoose.model('Content', contentSchema);

// ==================== JWT HELPER FUNCTIONS ====================
const generateToken = (userId, username, role) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    return jwt.sign(
        { userId, username, role }, // Include role in JWT payload
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

// ==================== ROLE-BASED ACCESS CONTROL MIDDLEWARE ====================

// Check if user has admin role
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access forbidden: Admins only' });
    }
    
    next();
};

// Check if user has content_creator or admin role
const creatorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'content_creator') {
        return res.status(403).json({ message: 'Access forbidden: Content creators or admins only' });
    }
    
    next();
};

// Check if user has specific role(s)
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access forbidden: Required roles: ${roles.join(', ')}` 
            });
        }
        
        next();
    };
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
        .isIn(['admin', 'content_creator', 'viewer']).withMessage('Role must be admin, content_creator, or viewer')
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

const contentValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    
    body('description')
        .optional()
        .trim(),
    
    body('category')
        .optional()
        .isIn(['movie', 'series', 'documentary', 'music', 'sports']).withMessage('Invalid category'),
    
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
];

// ==================== CONTROLLERS ====================

// Register User
const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already registered' });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already taken' });
            }
        }

        const user = new User({
            username,
            email,
            password,
            role: role || 'viewer'
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
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

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        await user.updateLastLogin();

        // Generate JWT token with role included
        const token = generateToken(user._id, user.username, user.role);

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

// Forgot Password
const forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ 
                message: 'If an account with that email exists, a password reset token has been generated' 
            });
        }

        const resetToken = user.generatePasswordResetToken();
        await user.save();

        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        res.status(200).json({
            message: 'Reset token generated',
            resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token } = req.params;
        const { newPassword } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token' 
            });
        }

        await user.resetPassword(newPassword);

        res.status(200).json({
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

// ==================== CONTENT MANAGEMENT CONTROLLERS ====================

// Create Content (Content Creators & Admins)
const createContent = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, category, status } = req.body;
        
        // Get full user details
        const user = await User.findById(req.user.userId);
        
        const content = new Content({
            title,
            description,
            creator: req.user.userId,
            creatorName: user.username,
            category: category || 'movie',
            status: status || 'draft',
            publishedAt: status === 'published' ? Date.now() : undefined
        });

        await content.save();

        res.status(201).json({
            message: 'Content created successfully',
            content
        });
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({ message: 'Server error while creating content' });
    }
};

// Get All Content (Viewers can view published only, Creators/Admins can view all)
const getAllContent = async (req, res) => {
    try {
        let query = {};
        
        // Viewers can only see published content
        if (req.user.role === 'viewer') {
            query.status = 'published';
        }
        
        const content = await Content.find(query)
            .sort({ createdAt: -1 })
            .populate('creator', 'username email');
        
        res.json({
            count: content.length,
            content
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ message: 'Server error while fetching content' });
    }
};

// Get Content by ID (Role-based access)
const getContentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const content = await Content.findById(id).populate('creator', 'username email');
        
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        // Check access rights
        if (req.user.role === 'viewer' && content.status !== 'published') {
            return res.status(403).json({ message: 'Access forbidden: Content not published' });
        }
        
        // Increment views if content is published
        if (content.status === 'published') {
            content.views += 1;
            await content.save();
        }
        
        res.json(content);
    } catch (error) {
        console.error('Get content by ID error:', error);
        res.status(500).json({ message: 'Server error while fetching content' });
    }
};

// Update Content (Only creator or admin)
const updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const content = await Content.findById(id);
        
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        // Check if user is creator or admin
        if (content.creator.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access forbidden: You can only edit your own content' });
        }
        
        // Update fields
        Object.keys(updates).forEach(key => {
            if (['title', 'description', 'category', 'status'].includes(key)) {
                content[key] = updates[key];
            }
        });
        
        // Update publishedAt if status changed to published
        if (updates.status === 'published' && content.status !== 'published') {
            content.publishedAt = Date.now();
        }
        
        await content.save();
        
        res.json({
            message: 'Content updated successfully',
            content
        });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ message: 'Server error while updating content' });
    }
};

// Delete Content (Admin only)
const deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        
        const content = await Content.findById(id);
        
        if (!content) {
            return res.status(404).json({ message: 'Content not found' });
        }
        
        await content.deleteOne();
        
        res.json({
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({ message: 'Server error while deleting content' });
    }
};

// Admin Dashboard
const adminDashboard = async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            totalContent: await Content.countDocuments(),
            publishedContent: await Content.countDocuments({ status: 'published' }),
            totalViews: await Content.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
            usersByRole: await User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } }
            ]),
            contentByCategory: await Content.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ])
        };
        
        res.json({
            message: 'Welcome to the admin dashboard!',
            stats
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Panel (Specific endpoint for testing)
const adminPanel = (req, res) => {
    res.json({
        message: "Welcome to the content management panel!"
    });
};

// ==================== ROUTES ====================

// Authentication routes (Public)
app.post('/api/auth/register', registerValidation, registerUser);
app.post('/api/auth/login', loginValidation, loginUser);
app.post('/api/auth/forgot-password', forgotPasswordValidation, forgotPassword);
app.post('/api/auth/reset-password/:token', resetPasswordValidation, resetPassword);

// User profile route (Protected)
app.get('/api/auth/me', authMiddleware, getCurrentUser);

// Content management routes with RBAC
app.post('/api/content', authMiddleware, creatorOrAdmin, contentValidation, createContent);
app.get('/api/content', authMiddleware, getAllContent);
app.get('/api/content/:id', authMiddleware, getContentById);
app.put('/api/content/:id', authMiddleware, creatorOrAdmin, updateContent);
app.delete('/api/content/:id', authMiddleware, adminOnly, deleteContent);

// Admin-specific routes
app.get('/api/content/admin', authMiddleware, adminOnly, adminPanel);
app.get('/api/admin/dashboard', authMiddleware, adminOnly, adminDashboard);

// Creator-specific routes
app.get('/api/creator/my-content', authMiddleware, creatorOrAdmin, async (req, res) => {
    try {
        const content = await Content.find({ creator: req.user.userId });
        res.json({
            count: content.length,
            content
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Root route with documentation
app.get('/', (req, res) => {
    res.json({
        message: 'Video Streaming Platform API',
        version: '2.0.0',
        endpoints: {
            authentication: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password/:token',
                profile: 'GET /api/auth/me'
            },
            content: {
                create: 'POST /api/content (Content Creator/Admin)',
                list: 'GET /api/content (All authenticated users)',
                getById: 'GET /api/content/:id (All authenticated users)',
                update: 'PUT /api/content/:id (Creator/Admin)',
                delete: 'DELETE /api/content/:id (Admin only)'
            },
            admin: {
                adminPanel: 'GET /api/content/admin (Admin only)',
                dashboard: 'GET /api/admin/dashboard (Admin only)'
            },
            creator: {
                myContent: 'GET /api/creator/my-content (Creator/Admin)'
            }
        },
        roles: {
            admin: 'Full access to all features',
            content_creator: 'Can create and manage their own content',
            viewer: 'Can only view published content'
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streaming_platform';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log(' MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(` Server running on http://localhost:${PORT}`);
        console.log(`\n Available endpoints:`);
        console.log(`\n Authentication:`);
        console.log(`   POST   /api/auth/register           - Register new user`);
        console.log(`   POST   /api/auth/login              - Login user`);
        console.log(`   POST   /api/auth/forgot-password    - Request password reset`);
        console.log(`   POST   /api/auth/reset-password/:token - Reset password`);
        console.log(`   GET    /api/auth/me                 - Get user profile`);
        console.log(`\n Content Management:`);
        console.log(`   POST   /api/content                 - Create content (Creator/Admin)`);
        console.log(`   GET    /api/content                 - List content (Role-based)`);
        console.log(`   GET    /api/content/:id             - Get content by ID`);
        console.log(`   PUT    /api/content/:id             - Update content (Creator/Admin)`);
        console.log(`   DELETE /api/content/:id             - Delete content (Admin only)`);
        console.log(`\n Admin Routes:`);
        console.log(`   GET    /api/content/admin           - Admin panel (Admin only)`);
        console.log(`   GET    /api/admin/dashboard         - Admin dashboard with stats`);
        console.log(`\n Creator Routes:`);
        console.log(`   GET    /api/creator/my-content      - Get creator's content`);
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
