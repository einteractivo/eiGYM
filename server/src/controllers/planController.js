
const prisma = require('../utils/prisma');

exports.getAllPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { 
                active: true,
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
            include: {
                _count: {
                    select: { memberships: true }
                }
            }
        });
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlanById = async (req, res) => {
    try {
        const plan = await prisma.plan.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
            include: {
                _count: {
                    select: { memberships: true }
                }
            }
        });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createPlan = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { name, durationDays, price, description } = req.body;
        const plan = await prisma.plan.create({
            data: { 
                name, 
                durationDays: parseInt(durationDays), 
                price, 
                description,
                gymId: req.user.gymId
            }
        });
        res.status(201).json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePlan = async (req, res) => {
    try {
        const { name, durationDays, price, description, active } = req.body;
        const plan = await prisma.plan.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                durationDays: durationDays !== undefined ? parseInt(durationDays) : undefined,
                price,
                description,
                active
            }
        });
        res.json(plan);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deletePlan = async (req, res) => {
    try {
        const planId = parseInt(req.params.id);
        const existing = await prisma.plan.findUnique({ where: { id: planId } });
        if (!existing) return res.status(404).json({ message: 'Plan no encontrado' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Soft delete
        await prisma.plan.update({
            where: { id: planId },
            data: { active: false }
        });
        res.json({ message: 'Plan desactivado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

