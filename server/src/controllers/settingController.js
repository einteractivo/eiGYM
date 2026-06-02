const prisma = require('../utils/prisma');
const { getGymId } = require('../utils/tenantContext');
const fs = require('fs');
const path = require('path');

exports.getSettings = async (req, res) => {
    try {
        const gymId = req.user?.gymId || getGymId();
        const settings = await prisma.setting.findMany({
            where: gymId ? { gymId } : {}
        });
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('[settings/get]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.getPublicSettings = async (req, res) => {
    try {
        const gymId = getGymId();
        const keys = [
            'gym_name', 'gym_logo_url', 'gym_phone', 'gym_address',
            'saas_logo_url', 'saas_footer_text', 'saas_footer_logo_url',
            'saas_footer_brand', 'saas_footer_url'
        ];
        const settings = await prisma.setting.findMany({
            where: {
                key: { in: keys },
                OR: [
                    { gymId: gymId || -1 },
                    { gymId: null }
                ]
            }
        });
        const settingsMap = settings.reduce((acc, curr) => {
            // Gym-specific settings take priority over global
            if (curr.gymId !== null || !acc[curr.key]) {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('[settings/public]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const gymId = getGymId() || req.user?.gymId;

        const updates = Object.entries(settings).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { gymId_key: { gymId, key } },
                update: { value: String(value) },
                create: { key, value: String(value), gymId }
            });
        });

        await prisma.$transaction(updates);
        res.json({ message: 'Configuración actualizada correctamente' });
    } catch (error) {
        console.error('[settings/update]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.getLicenseStatus = async (req, res) => {
    try {
        const gymId = getGymId();

        // SuperAdmin has unlimited access
        if (!gymId) {
            return res.json({
                daysRemaining: 999,
                expirationDate: new Date(2099, 0, 1).toISOString(),
                isExpired: false,
                status: 'active',
                plan: 'SUPERADMIN'
            });
        }

        const gym = await prisma.gym.findUnique({ where: { id: gymId } });

        if (!gym) {
            return res.status(404).json({ message: 'Gimnasio no encontrado' });
        }

        const expirationDate = gym.subscriptionExpiresAt ? new Date(gym.subscriptionExpiresAt) : null;
        const now = new Date();
        let daysRemaining = 0;
        let isExpired = false;

        if (expirationDate) {
            const diffTime = expirationDate.getTime() - now.getTime();
            daysRemaining = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
            isExpired = now > expirationDate;
        }

        res.json({
            daysRemaining,
            expirationDate: expirationDate ? expirationDate.toISOString() : null,
            isExpired,
            status: gym.active ? 'active' : 'inactive',
            plan: gym.subscriptionPlan,
            subscriptionAmount: gym.subscriptionAmount,
            subscriptionDescription: gym.subscriptionDescription
        });
    } catch (error) {
        console.error('[settings/license]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.uploadLogo = async (req, res) => {
    try {
        const { image, extension } = req.body;
        if (!image) return res.status(400).json({ message: 'No se envió ninguna imagen' });

        try {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            const fileName = `logo_${Date.now()}.${extension || 'png'}`;
            const uploadsDir = path.join(__dirname, '../../uploads');

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filePath = path.join(uploadsDir, fileName);
            fs.writeFileSync(filePath, base64Data, 'base64');

            res.json({ logoUrl: `/uploads/${fileName}` });
        } catch (diskError) {
            console.warn('[settings/upload-logo] Failed to write file to disk. Falling back to inline Base64 storage:', diskError.message);
            // Fallback: return the Base64 image itself. Since settings.value is @db.LongText, this works perfectly!
            res.json({ logoUrl: image });
        }
    } catch (error) {
        console.error('[settings/upload-logo]', error);
        res.status(500).json({ message: 'Error al subir el logo' });
    }
};
