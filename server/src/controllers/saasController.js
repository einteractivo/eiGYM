const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

// ─── GYMS ────────────────────────────────────────────────────────────────────

exports.getGyms = async (req, res) => {
    try {
        const gyms = await prisma.gym.findMany({
            include: {
                users: {
                    where: { role: { not: 'SUPERADMIN' } },
                    select: { id: true, name: true, email: true, role: true, createdAt: true }
                },
                _count: { select: { users: true, members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(gyms);
    } catch (error) {
        console.error('[saas/getGyms]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.createGym = async (req, res) => {
    try {
        const {
            name, slug, email, phone, address,
            subscriptionPlan, subscriptionAmount, subscriptionDescription,
            adminPassword, registrationId
        } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Nombre y slug son requeridos' });
        }

        const existing = await prisma.gym.findUnique({ where: { slug } });
        if (existing) return res.status(400).json({ message: 'El slug ya está en uso' });

        const planDays = { TRIAL: 7, MONTHLY: 30, ANNUAL: 365 };
        const days = planDays[subscriptionPlan] || 7;
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);
        expiresAt.setDate(expiresAt.getDate() + days);

        const gym = await prisma.gym.create({
            data: {
                name, slug, email, phone, address,
                subscriptionPlan: subscriptionPlan || 'TRIAL',
                subscriptionExpiresAt: expiresAt,
                subscriptionAmount,
                subscriptionDescription
            }
        });

        // Default settings
        await prisma.setting.createMany({
            data: [
                { gymId: gym.id, key: 'GYM_NAME', value: name },
                { gymId: gym.id, key: 'CURRENCY', value: 'S/' }
            ]
        });

        // Create admin user
        let hashedPassword = null;
        let finalEmail = email;
        let finalName = name;

        if (adminPassword) {
            hashedPassword = await bcrypt.hash(adminPassword, 10);
        } else if (registrationId) {
            const reg = await prisma.gymRegistration.findUnique({
                where: { id: parseInt(registrationId) }
            });
            if (reg) {
                hashedPassword = reg.password;
                finalEmail = reg.email;
                finalName = reg.contactName;
            }
        }

        if (hashedPassword) {
            await prisma.user.create({
                data: {
                    name: finalName,
                    email: finalEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                    gymId: gym.id
                }
            });
        }

        res.status(201).json(gym);
    } catch (error) {
        console.error('[saas/createGym]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateGym = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, active, logoUrl, address, phone, email,
            subscriptionPlan, subscriptionExpiresAt,
            subscriptionAmount, subscriptionDescription
        } = req.body;

        const currentGym = await prisma.gym.findUnique({ where: { id: parseInt(id) } });
        if (!currentGym) return res.status(404).json({ message: 'Gimnasio no encontrado' });

        const data = { name, active, logoUrl, address, phone, email, subscriptionAmount, subscriptionDescription };

        if (subscriptionPlan && subscriptionPlan !== currentGym.subscriptionPlan) {
            data.subscriptionPlan = subscriptionPlan;
            const planDays = { TRIAL: 7, MONTHLY: 30, ANNUAL: 365 };
            const days = planDays[subscriptionPlan] || 7;
            const expiresAt = new Date();
            expiresAt.setHours(23, 59, 59, 999);
            expiresAt.setDate(expiresAt.getDate() + days);
            data.subscriptionExpiresAt = expiresAt;
        } else if (subscriptionExpiresAt) {
            data.subscriptionExpiresAt = new Date(subscriptionExpiresAt);
        }

        // Remove undefined keys
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        const gym = await prisma.gym.update({ where: { id: parseInt(id) }, data });
        res.json(gym);
    } catch (error) {
        console.error('[saas/updateGym]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.deleteGym = async (req, res) => {
    try {
        const gymId = parseInt(req.params.id);

        // Must delete in dependency order inside a transaction
        await prisma.$transaction(async (tx) => {
            // Get session IDs for this gym
            const sessions = await tx.cashSession.findMany({ where: { gymId }, select: { id: true } });
            const sessionIds = sessions.map(s => s.id);

            // Get sale IDs for this gym
            const sales = await tx.sale.findMany({ where: { gymId }, select: { id: true } });
            const saleIds = sales.map(s => s.id);

            // Get member IDs for this gym
            const members = await tx.member.findMany({ where: { gymId }, select: { id: true } });
            const memberIds = members.map(m => m.id);

            // Get special class IDs
            const specialClasses = await tx.specialClass.findMany({ where: { gymId }, select: { id: true } });
            const scIds = specialClasses.map(s => s.id);

            if (sessionIds.length > 0) {
                await tx.cashTransaction.deleteMany({ where: { sessionId: { in: sessionIds } } });
            }
            if (saleIds.length > 0) {
                await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } });
            }
            if (scIds.length > 0) {
                await tx.specialClassRegistration.deleteMany({ where: { specialClassId: { in: scIds } } });
            }
            if (memberIds.length > 0) {
                await tx.attendance.deleteMany({ where: { memberId: { in: memberIds } } });
                await tx.membership.deleteMany({ where: { memberId: { in: memberIds } } });
            }

            await tx.trainerAttendance.deleteMany({ where: { gymId } });
            await tx.payment.deleteMany({ where: { gymId } });
            await tx.sale.deleteMany({ where: { gymId } });
            await tx.cashSession.deleteMany({ where: { gymId } });
            await tx.specialClass.deleteMany({ where: { gymId } });
            await tx.schedule.deleteMany({ where: { gymClass: { gymId } } });
            await tx.gymClass.deleteMany({ where: { gymId } });
            await tx.member.deleteMany({ where: { gymId } });
            await tx.plan.deleteMany({ where: { gymId } });
            await tx.equipment.deleteMany({ where: { gymId } });
            await tx.product.deleteMany({ where: { gymId } });
            await tx.setting.deleteMany({ where: { gymId } });
            await tx.user.deleteMany({ where: { gymId, role: { not: 'SUPERADMIN' } } });
            await tx.gym.delete({ where: { id: gymId } });
        });

        res.json({ message: 'Gimnasio y todos sus datos eliminados correctamente' });
    } catch (error) {
        console.error('[saas/deleteGym]', error);
        res.status(500).json({ message: 'Error al eliminar el gimnasio' });
    }
};

// ─── GYM USERS ───────────────────────────────────────────────────────────────

exports.createGymUser = async (req, res) => {
    try {
        const { gymId, name, email, password, role } = req.body;

        if (!gymId || !email || !password) {
            return res.status(400).json({ message: 'GymId, email y contraseña son requeridos' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'El correo ya está en uso' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: role || 'ADMIN', gymId: parseInt(gymId) }
        });

        res.status(201).json({ message: 'Usuario creado con éxito', userId: user.id });
    } catch (error) {
        console.error('[saas/createGymUser]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateGymUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, password, role } = req.body;

        console.log(`[saas/updateGymUser] userId: ${userId}, raw: '${req.params.id}', body keys: ${Object.keys(req.body).join(', ')}`);

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'ID de usuario inválido' });
        }

        const existingUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            console.log(`[saas/updateGymUser] User with id ${userId} NOT found in database`);
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (email && email !== existingUser.email) {
            const emailInUse = await prisma.user.findUnique({ where: { email } });
            if (emailInUse) return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        const data = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (role !== undefined) data.role = role;
        if (password && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10);
        }

        console.log(`[saas/updateGymUser] Updating user ${userId} with fields: ${Object.keys(data).join(', ')}`);

        const user = await prisma.user.update({ where: { id: userId }, data });
        res.json({ message: 'Usuario actualizado correctamente', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('[saas/updateGymUser]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.deleteGymUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        await prisma.user.delete({ where: { id: userId } });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('[saas/deleteGymUser]', error);
        res.status(500).json({ message: 'Error al eliminar usuario. Puede tener registros asociados.' });
    }
};

// ─── REGISTRATIONS ───────────────────────────────────────────────────────────

exports.getRegistrations = async (req, res) => {
    try {
        const registrations = await prisma.gymRegistration.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(registrations);
    } catch (error) {
        console.error('[saas/getRegistrations]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateRegistrationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const registration = await prisma.gymRegistration.update({
            where: { id: parseInt(req.params.id) },
            data: { status }
        });
        res.json(registration);
    } catch (error) {
        console.error('[saas/updateRegistration]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.deleteRegistration = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const existing = await prisma.gymRegistration.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }
        await prisma.gymRegistration.delete({ where: { id } });
        res.json({ message: 'Solicitud eliminada correctamente' });
    } catch (error) {
        console.error('[saas/deleteRegistration]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ─── SAAS USERS (SuperAdmins) ─────────────────────────────────────────────────

exports.getSaasUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'SUPERADMIN' },
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        console.error('[saas/getSaasUsers]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.createSaasUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nombre, correo y contraseña son requeridos' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'El correo ya está en uso' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: 'SUPERADMIN', gymId: null }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('[saas/createSaasUser]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateSaasUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, password } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ message: 'ID de usuario inválido' });
        }

        const existingUser = await prisma.user.findUnique({ where: { id: userId, role: 'SUPERADMIN' } });
        if (!existingUser) {
            return res.status(404).json({ message: 'Usuario SaaS no encontrado' });
        }

        if (email && email !== existingUser.email) {
            const emailInUse = await prisma.user.findUnique({ where: { email } });
            if (emailInUse) return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        const data = {};
        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (password && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({ where: { id: userId }, data });
        res.json({ message: 'Usuario SaaS actualizado correctamente', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('[saas/updateSaasUser]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// ─── SAAS SETTINGS ────────────────────────────────────────────────────────────

exports.getSaasSettings = async (req, res) => {
    try {
        const settings = await prisma.setting.findMany({
            where: { gymId: null }
        });
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('[saas/getSaasSettings]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.updateSaasSettings = async (req, res) => {
    try {
        const settings = req.body;

        const updates = Object.entries(settings).map(([key, value]) =>
            prisma.setting.upsert({
                where: { gymId_key: { gymId: null, key } },
                update: { value: String(value) },
                create: { key, value: String(value), gymId: null }
            })
        );

        await prisma.$transaction(updates);
        res.json({ message: 'Ajustes SaaS actualizados' });
    } catch (error) {
        console.error('[saas/updateSaasSettings]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};
