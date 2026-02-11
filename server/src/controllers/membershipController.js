const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createMembership = async (req, res) => {
    try {
        const { memberId, planId, startDate } = req.body;

        const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        const start = new Date(startDate || new Date());
        const end = new Date(start);
        end.setDate(start.getDate() + plan.durationDays);

        const membership = await prisma.membership.create({
            data: {
                memberId: parseInt(memberId),
                planId: parseInt(planId),
                startDate: start,
                endDate: end,
                price: plan.price,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(membership);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMembershipById = async (req, res) => {
    try {
        const membership = await prisma.membership.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { member: true, plan: true, payments: true }
        });
        if (!membership) return res.status(404).json({ message: 'Membership not found' });
        res.json(membership);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.cancelMembership = async (req, res) => {
    try {
        await prisma.membership.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'CANCELLED' }
        });
        res.json({ message: 'Membership cancelled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
