
const prisma = require('../utils/prisma');

exports.createMembership = async (req, res) => {
    try {
        const { memberId, planId, startDate } = req.body;
        const gymId = req.user?.gymId;

        if (!gymId) {
            return res.status(400).json({ error: 'Operación no permitida. Gimnasio no detectado.' });
        }

        const plan = await prisma.plan.findFirst({ 
            where: { id: parseInt(planId), gymId } 
        });
        if (!plan) return res.status(404).json({ message: 'Plan no encontrado o no pertenece a tu gimnasio' });

        const member = await prisma.member.findFirst({
            where: { id: parseInt(memberId), gymId }
        });
        if (!member) return res.status(404).json({ message: 'Miembro no encontrado o no pertenece a tu gimnasio' });

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
        const membership = await prisma.membership.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user?.gymId ? { member: { gymId: req.user.gymId } } : {})
            },
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
        const membership = await prisma.membership.findFirst({
            where: {
                id: parseInt(req.params.id),
                ...(req.user?.gymId ? { member: { gymId: req.user.gymId } } : {})
            }
        });

        if (!membership) {
            return res.status(404).json({ message: 'Membresía no encontrada o no tienes permiso' });
        }

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

