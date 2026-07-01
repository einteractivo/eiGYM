const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const licenseCheck = require('./middlewares/licenseCheck');
const { runWithGymId } = require('./utils/tenantContext');
const jwt = require('jsonwebtoken');

const app = express();
const secret = process.env.JWT_SECRET || 'your_super_secret_key';

// Dynamic CORS: support production domain + localhost for dev
const allowedOrigins = [
    'https://eigym.eistreaming.net',
    'http://eigym.eistreaming.net',
    'http://localhost:5173',
    'http://localhost:3000'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Disable caching for all API responses
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Only use morgan in development
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Tenant Context Middleware
app.use((req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
        try {
            const decoded = jwt.verify(token, secret);
            // SUPERADMIN works across all gyms, don't scope their queries
            if (decoded.gymId && decoded.role !== 'SUPERADMIN') {
                return runWithGymId(decoded.gymId, next);
            }
        } catch (err) { }
    }
    next();
});

// Serve uploaded files (before licenseCheck so images load without auth)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// License / Subscription check
app.use(licenseCheck);

// Routes
const authRoutes = require('./routes/authRoutes');
const planRoutes = require('./routes/planRoutes');
const memberRoutes = require('./routes/memberRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');
const gymClassRoutes = require('./routes/gymClassRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const cashFlowRoutes = require('./routes/cashFlowRoutes');
const settingRoutes = require('./routes/settingRoutes');
const specialClassRoutes = require('./routes/specialClassRoutes');
const saasRoutes = require('./routes/saasRoutes');
const reportRoutes = require('./routes/reportRoutes');
const trainerAttendanceRoutes = require('./routes/trainerAttendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', gymClassRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/special-classes', specialClassRoutes);
app.use('/api/trainer-attendance', trainerAttendanceRoutes);
app.use('/api/reports', reportRoutes);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve React SPA static files
app.use(express.static(path.join(__dirname, '../../client/dist')));

// SPA fallback: all non-API routes serve index.html
app.get(/^(?!\/api).*/, (req, res) => {
    const indexPath = path.join(__dirname, '../../client/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ message: 'Frontend not built. Run: npm run build in /client' });
    }
});

module.exports = app;
