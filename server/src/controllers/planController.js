const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllPlans = async (req, res) => {
    try {
        const plans = await prisma.plan.findMany({
            where: { active: true }
        });
        res.json(plans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPlanById = async (req, res) => {
    try {
        const plan = await prisma.plan.findUnique({
            where: { id: parseInt(req.params.id) }
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
        const { name, durationDays, price, description } = req.body;
        const plan = await prisma.plan.create({
            data: { name, durationDays: parseInt(durationDays), price, description }
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
                durationDays: durationDays ? parseInt(durationDays) : undefined,
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
        // Soft delete
        await prisma.plan.update({
            where: { id: parseInt(req.params.id) },
            data: { active: false }
        });
        res.json({ message: 'Plan deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
