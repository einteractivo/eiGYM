
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const { getGymId } = require('../utils/tenantContext');

exports.getAllUsers = async (req, res) => {
    try {
        const where = {};
        
        // If not SUPERADMIN, filter by gymId and exclude SUPERADMINs
        if (req.user.role !== 'SUPERADMIN') {
            const gymId = req.user.gymId || getGymId();
            if (gymId) where.gymId = gymId;
            where.role = { not: 'SUPERADMIN' };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                gymId: true
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, notes } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Prevent non-SUPERADMINs from creating SUPERADMIN users
        if (req.user.role !== 'SUPERADMIN' && role === 'SUPERADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para crear un SuperAdministrador' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Assign gymId: from body > tenant context > requester's gym > null
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                notes,
                gymId: req.body.gymId || getGymId() || (req.user.role !== 'SUPERADMIN' ? req.user.gymId : null)
            }
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            notes: user.notes,
            gymId: user.gymId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ message: 'No puedes eliminarte a ti mismo' });
        }

        const userToDelete = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Security check: only SUPERADMIN or admin of the same gym
        if (req.user.role !== 'SUPERADMIN' && userToDelete.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este usuario' });
        }

        await prisma.user.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, notes } = req.body;

        const userToUpdate = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!userToUpdate) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Security check
        if (req.user.role !== 'SUPERADMIN' && userToUpdate.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este usuario' });
        }

        // Prevent non-SUPERADMINs from promoting to SUPERADMIN
        if (req.user.role !== 'SUPERADMIN' && role === 'SUPERADMIN') {
            return res.status(403).json({ message: 'No tienes permiso para asignar el rol SuperAdministrador' });
        }

        const updateData = { name, email, role, notes };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            notes: user.notes,
            gymId: user.gymId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

