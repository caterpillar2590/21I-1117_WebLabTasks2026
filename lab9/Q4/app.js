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

// ==================== DATABASE SCHEMAS ====================

// User Schema (from previous tasks)
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
        enum: ['admin', 'librarian', 'member'],
        default: 'member'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
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

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = Date.now();
    await this.save();
};

userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 3600000;
    return resetToken;
};

userSchema.methods.resetPassword = async function(newPassword) {
    this.password = newPassword;
    this.resetPasswordToken = undefined;
    this.resetPasswordExpire = undefined;
    await this.save();
};

const User = mongoose.model('User', userSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters'],
        maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
        trim: true,
        uppercase: true,
        enum: ['Shelf A', 'Shelf B', 'Shelf C', 'Shelf D', 'Shelf E', 'Reference', 'Periodical'],
        default: 'Shelf A'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate for books in this category
categorySchema.virtual('books', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'categoryId'
});

categorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Category = mongoose.model('Category', categorySchema);

// Book Schema
const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true,
        minlength: [1, 'Title must be at least 1 character'],
        maxlength: [200, 'Title cannot exceed 200 characters'],
        index: true
    },
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true,
        minlength: [2, 'Author name must be at least 2 characters'],
        maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    isbn: {
        type: String,
        required: [true, 'ISBN is required'],
        unique: true,
        trim: true,
        match: [/^(?:\d{10}|\d{13})$/, 'ISBN must be 10 or 13 digits'],
        index: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category ID is required']
    },
    publisher: {
        type: String,
        trim: true,
        maxlength: [100, 'Publisher name cannot exceed 100 characters']
    },
    publicationYear: {
        type: Number,
        min: [1000, 'Year must be at least 1000'],
        max: [new Date().getFullYear(), `Year cannot be greater than ${new Date().getFullYear()}`]
    },
    edition: {
        type: String,
        trim: true
    },
    totalCopies: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Total copies must be at least 1']
    },
    availableCopies: {
        type: Number,
        required: true,
        default: 1,
        min: [0, 'Available copies cannot be negative']
    },
    pages: {
        type: Number,
        min: [1, 'Pages must be at least 1'],
        max: [5000, 'Pages cannot exceed 5000']
    },
    language: {
        type: String,
        trim: true,
        default: 'English'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['available', 'borrowed', 'damaged', 'lost', 'under_repair'],
        default: 'available'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for search functionality
bookSchema.index({ title: 'text', author: 'text', description: 'text' });

bookSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to check if book is available
bookSchema.methods.isAvailable = function() {
    return this.availableCopies > 0 && this.status === 'available';
};

// Method to borrow a book
bookSchema.methods.borrowBook = async function() {
    if (!this.isAvailable()) {
        throw new Error('Book is not available for borrowing');
    }
    this.availableCopies -= 1;
    if (this.availableCopies === 0) {
        this.status = 'borrowed';
    }
    await this.save();
};

// Method to return a book
bookSchema.methods.returnBook = async function() {
    this.availableCopies += 1;
    if (this.availableCopies > 0) {
        this.status = 'available';
    }
    await this.save();
};

const Book = mongoose.model('Book', bookSchema);

// ==================== JWT HELPER FUNCTIONS ====================
const generateToken = (userId, username, role) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    return jwt.sign(
        { userId, username, role },
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

// Role-based middleware
const librarianOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
        return res.status(403).json({ message: 'Access forbidden: Librarians or admins only' });
    }
    
    next();
};

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access forbidden: Admins only' });
    }
    
    next();
};

// ==================== VALIDATION RULES ====================

// Category validation
const categoryValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Category name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z0-9\s\-&]+$/).withMessage('Category name can only contain letters, numbers, spaces, hyphens, and ampersands'),
    
    body('section')
        .optional()
        .isIn(['Shelf A', 'Shelf B', 'Shelf C', 'Shelf D', 'Shelf E', 'Reference', 'Periodical'])
        .withMessage('Invalid section'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
];

// Book validation
const bookValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Book title is required')
        .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    
    body('author')
        .trim()
        .notEmpty().withMessage('Author name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Author name must be between 2 and 100 characters'),
    
    body('isbn')
        .trim()
        .notEmpty().withMessage('ISBN is required')
        .matches(/^(?:\d{10}|\d{13})$/).withMessage('ISBN must be 10 or 13 digits'),
    
    body('categoryId')
        .notEmpty().withMessage('Category ID is required')
        .isMongoId().withMessage('Invalid category ID format'),
    
    body('publisher')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Publisher name cannot exceed 100 characters'),
    
    body('publicationYear')
        .optional()
        .isInt({ min: 1000, max: new Date().getFullYear() }).withMessage(`Year must be between 1000 and ${new Date().getFullYear()}`),
    
    body('totalCopies')
        .optional()
        .isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
    
    body('pages')
        .optional()
        .isInt({ min: 1, max: 5000 }).withMessage('Pages must be between 1 and 5000'),
    
    body('language')
        .optional()
        .trim(),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
];

// Update book validation (partial updates)
const bookUpdateValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    
    body('author')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Author name must be between 2 and 100 characters'),
    
    body('isbn')
        .optional()
        .trim()
        .matches(/^(?:\d{10}|\d{13})$/).withMessage('ISBN must be 10 or 13 digits'),
    
    body('categoryId')
        .optional()
        .isMongoId().withMessage('Invalid category ID format'),
    
    body('totalCopies')
        .optional()
        .isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
    
    body('availableCopies')
        .optional()
        .isInt({ min: 0 }).withMessage('Available copies cannot be negative')
];

// ==================== CATEGORY CONTROLLERS ====================

// Create Category
const createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, section, description } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const category = new Category({
            name,
            section: section || 'Shelf A',
            description
        });

        await category.save();

        res.status(201).json({
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: 'Server error while creating category' });
    }
};

// Get All Categories
const getAllCategories = async (req, res) => {
    try {
        const { includeBooks } = req.query;
        
        let query = Category.find();
        
        if (includeBooks === 'true') {
            query = query.populate('books');
        }
        
        const categories = await query.sort({ name: 1 });
        
        // Get book count for each category
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const bookCount = await Book.countDocuments({ categoryId: category._id });
            return {
                ...category.toObject(),
                bookCount
            };
        }));
        
        res.json({
            count: categories.length,
            categories: categoriesWithCount
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error while fetching categories' });
    }
};

// Get Category by ID
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id).populate('books');
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const bookCount = await Book.countDocuments({ categoryId: category._id });
        
        res.json({
            category: {
                ...category.toObject(),
                bookCount
            }
        });
    } catch (error) {
        console.error('Get category error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }
        res.status(500).json({ message: 'Server error while fetching category' });
    }
};

// Update Category
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Check for duplicate name if updating name
        if (updates.name && updates.name !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: { $regex: new RegExp(`^${updates.name}$`, 'i') },
                _id: { $ne: id }
            });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }
        
        // Update fields
        const allowedUpdates = ['name', 'section', 'description'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                category[field] = updates[field];
            }
        });
        
        category.updatedAt = Date.now();
        await category.save();
        
        res.json({
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Update category error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }
        res.status(500).json({ message: 'Server error while updating category' });
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await Category.findById(id);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        // Check if category has books
        const bookCount = await Book.countDocuments({ categoryId: id });
        
        if (bookCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category with ${bookCount} books. Please reassign or delete the books first.`,
                bookCount
            });
        }
        
        await category.deleteOne();
        
        res.json({
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid category ID format' });
        }
        res.status(500).json({ message: 'Server error while deleting category' });
    }
};

// ==================== BOOK CONTROLLERS ====================

// Create Book
const createBook = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            title, author, isbn, categoryId, publisher, publicationYear, 
            edition, totalCopies, pages, language, description 
        } = req.body;

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if ISBN already exists
        const existingBook = await Book.findOne({ isbn });
        if (existingBook) {
            return res.status(400).json({ message: 'Book with this ISBN already exists' });
        }

        const book = new Book({
            title,
            author,
            isbn,
            categoryId,
            publisher,
            publicationYear,
            edition,
            totalCopies: totalCopies || 1,
            availableCopies: totalCopies || 1,
            pages,
            language,
            description
        });

        await book.save();

        // Populate category info for response
        await book.populate('categoryId');

        res.status(201).json({
            message: 'Book created successfully',
            book
        });
    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({ message: 'Server error while creating book' });
    }
};

// Get All Books with Category Info
const getAllBooks = async (req, res) => {
    try {
        const { 
            category, author, status, language, search, 
            page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc' 
        } = req.query;
        
        let query = {};
        
        // Filters
        if (category) {
            query.categoryId = category;
        }
        
        if (author) {
            query.author = { $regex: author, $options: 'i' };
        }
        
        if (status) {
            query.status = status;
        }
        
        if (language) {
            query.language = language;
        }
        
        if (search) {
            query.$text = { $search: search };
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Sorting
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const books = await Book.find(query)
            .populate('categoryId', 'name section')
            .sort(sort)
            .skip(skip)
            .limit(limitNum);
        
        const total = await Book.countDocuments(query);
        
        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            books
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ message: 'Server error while fetching books' });
    }
};

// Get Book by ID
const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const book = await Book.findById(id).populate('categoryId', 'name section description');
        
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        res.json(book);
    } catch (error) {
        console.error('Get book error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid book ID format' });
        }
        res.status(500).json({ message: 'Server error while fetching book' });
    }
};

// Update Book
const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const book = await Book.findById(id);
        
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        // Check if new category exists if updating categoryId
        if (updates.categoryId && updates.categoryId !== book.categoryId.toString()) {
            const category = await Category.findById(updates.categoryId);
            if (!category) {
                return res.status(404).json({ message: 'New category not found' });
            }
        }
        
        // Check if ISBN is unique if updating
        if (updates.isbn && updates.isbn !== book.isbn) {
            const existingBook = await Book.findOne({ isbn: updates.isbn, _id: { $ne: id } });
            if (existingBook) {
                return res.status(400).json({ message: 'Book with this ISBN already exists' });
            }
        }
        
        // Update fields
        const allowedUpdates = [
            'title', 'author', 'isbn', 'categoryId', 'publisher', 'publicationYear',
            'edition', 'totalCopies', 'availableCopies', 'pages', 'language', 
            'description', 'status'
        ];
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                // Validate that availableCopies doesn't exceed totalCopies
                if (field === 'availableCopies' && updates[field] > (updates.totalCopies || book.totalCopies)) {
                    throw new Error('Available copies cannot exceed total copies');
                }
                book[field] = updates[field];
            }
        });
        
        book.updatedAt = Date.now();
        await book.save();
        
        await book.populate('categoryId');
        
        res.json({
            message: 'Book updated successfully',
            book
        });
    } catch (error) {
        console.error('Update book error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid book ID format' });
        }
        if (error.message === 'Available copies cannot exceed total copies') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while updating book' });
    }
};

// Delete Book
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        
        const book = await Book.findById(id);
        
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        
        await book.deleteOne();
        
        res.json({
            message: 'Book deleted successfully'
        });
    } catch (error) {
        console.error('Delete book error:', error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid book ID format' });
        }
        res.status(500).json({ message: 'Server error while deleting book' });
    }
};

// Get Books by Category
const getBooksByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const books = await Book.find({ categoryId }).populate('categoryId', 'name section');
        
        res.json({
            category: category.name,
            section: category.section,
            count: books.length,
            books
        });
    } catch (error) {
        console.error('Get books by category error:', error);
        res.status(500).json({ message: 'Server error while fetching books by category' });
    }
};

// ==================== AUTH CONTROLLERS ====================

// Register User
const registerUser = async (req, res) => {
    try {
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
            role: role || 'member'
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        await user.updateLastLogin();

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

// ==================== ROUTES ====================

// Auth routes (Public)
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// Category routes (Protected - Librarian/Admin only for write operations)
app.post('/api/categories', authMiddleware, librarianOrAdmin, categoryValidation, createCategory);
app.get('/api/categories', authMiddleware, getAllCategories);
app.get('/api/categories/:id', authMiddleware, getCategoryById);
app.put('/api/categories/:id', authMiddleware, librarianOrAdmin, categoryValidation, updateCategory);
app.delete('/api/categories/:id', authMiddleware, adminOnly, deleteCategory);

// Book routes (Protected)
app.post('/api/books', authMiddleware, librarianOrAdmin, bookValidation, createBook);
app.get('/api/books', authMiddleware, getAllBooks);
app.get('/api/books/:id', authMiddleware, getBookById);
app.put('/api/books/:id', authMiddleware, librarianOrAdmin, bookUpdateValidation, updateBook);
app.delete('/api/books/:id', authMiddleware, adminOnly, deleteBook);
app.get('/api/books/category/:categoryId', authMiddleware, getBooksByCategory);

// Root route with documentation
app.get('/', (req, res) => {
    res.json({
        name: 'Library Management System API',
        version: '4.0.0',
        description: 'Complete library management system with categories and books',
        endpoints: {
            authentication: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            },
            categories: {
                create: 'POST /api/categories (Librarian/Admin)',
                list: 'GET /api/categories',
                getById: 'GET /api/categories/:id',
                update: 'PUT /api/categories/:id (Librarian/Admin)',
                delete: 'DELETE /api/categories/:id (Admin only)'
            },
            books: {
                create: 'POST /api/books (Librarian/Admin)',
                list: 'GET /api/books (with pagination & filters)',
                getById: 'GET /api/books/:id',
                update: 'PUT /api/books/:id (Librarian/Admin)',
                delete: 'DELETE /api/books/:id (Admin only)',
                byCategory: 'GET /api/books/category/:categoryId'
            }
        },
        filters: {
            books: '?category=ID&author=name&status=available&language=English&search=keyword&page=1&limit=10&sortBy=title&sortOrder=asc'
        },
        roles: {
            admin: 'Full access including deleting categories and books',
            librarian: 'Can create, read, update categories and books (cannot delete)',
            member: 'Can only view categories and books'
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_management';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
        console.log(`🚀 Library Management System running on http://localhost:${PORT}`);
        console.log(`\n📋 Available endpoints:`);
        console.log(`\n🔐 Authentication:`);
        console.log(`   POST   /api/auth/register     - Register new user`);
        console.log(`   POST   /api/auth/login        - Login user`);
        console.log(`\n📚 Categories:`);
        console.log(`   POST   /api/categories        - Create category (Librarian/Admin)`);
        console.log(`   GET    /api/categories        - List all categories`);
        console.log(`   GET    /api/categories/:id    - Get category by ID`);
        console.log(`   PUT    /api/categories/:id    - Update category (Librarian/Admin)`);
        console.log(`   DELETE /api/categories/:id    - Delete category (Admin only)`);
        console.log(`\n📖 Books:`);
        console.log(`   POST   /api/books             - Create book (Librarian/Admin)`);
        console.log(`   GET    /api/books             - List books (with filters)`);
        console.log(`   GET    /api/books/:id         - Get book by ID`);
        console.log(`   PUT    /api/books/:id         - Update book (Librarian/Admin)`);
        console.log(`   DELETE /api/books/:id         - Delete book (Admin only)`);
        console.log(`   GET    /api/books/category/:categoryId - Get books by category`);
        console.log(`\n💡 Test with Postman or ThunderClient`);
    });
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

module.exports = app;
