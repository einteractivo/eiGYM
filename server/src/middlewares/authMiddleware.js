const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const secret = process.env.JWT_SECRET || 'your_super_secret_key';

// Auth middleware: verifies token and refreshes gymId from DB on every request
const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        
        // Always fetch fresh user data so gymId is never stale from an old token
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, gymId: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            ...decoded,
            gymId: user.gymId,  // Always use fresh gymId from DB
            role: user.role     // Always use fresh role from DB
        };
        
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorize = (roles = []) => {
    const allowedRoles = typeof roles === 'string' ? [roles] : roles;

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // SUPERADMIN has access to everything
        if (req.user.role === 'SUPERADMIN') {
            return next();
        }

        if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

module.exports = { auth, authorize };
