const prisma = require('../utils/prisma');
const { getGymId } = require('../utils/tenantContext');

const BYPASS_PATHS = [
    '/api/auth/login',
    '/api/auth/register-gym',
    '/api/auth/me',
    '/api/settings/public',
];

const licenseCheck = async (req, res, next) => {
    try {
        // Skip check for public and auth routes
        const isPublic = BYPASS_PATHS.some(p => req.path.startsWith(p));
        const isSaas = req.path.startsWith('/api/saas');
        const isRoot = req.path === '/';

        if (isPublic || isSaas || isRoot) {
            return next();
        }

        const gymId = getGymId();

        // SuperAdmin (no gymId) has unlimited access
        if (!gymId) {
            return next();
        }

        const gym = await prisma.gym.findUnique({ where: { id: gymId } });

        if (!gym) {
            return res.status(404).json({ message: 'Gimnasio no encontrado' });
        }

        // Check if gym is active
        if (!gym.active) {
            return res.status(403).json({
                error: 'GYM_INACTIVE',
                message: 'Este gimnasio se encuentra inactivo. Contacte al administrador.'
            });
        }

        // Check subscription expiration
        if (gym.subscriptionExpiresAt) {
            const expirationDate = new Date(gym.subscriptionExpiresAt);
            const now = new Date();

            if (now > expirationDate) {
                // Read-only mode: allow GET requests even if expired
                if (req.method === 'GET') {
                    res.setHeader('X-License-Status', 'EXPIRED');
                    return next();
                }

                return res.status(402).json({
                    error: 'LICENSE_EXPIRED',
                    message: 'La suscripción ha caducado. El sistema está en modo lectura.',
                    expirationDate: gym.subscriptionExpiresAt
                });
            }

            // Warning when 3 days or fewer remain
            const diffDays = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3 && diffDays > 0) {
                res.setHeader('X-License-Warning', `Vence en ${diffDays} día(s)`);
            }
        }

        next();
    } catch (error) {
        console.error('[licenseCheck]', error);
        // Don't block the request on license check errors
        next();
    }
};

module.exports = licenseCheck;
