
const prisma = require('../utils/prisma');

exports.createPayment = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { memberId, membershipId, amount, method, type, notes } = req.body;

        // Check if there is an open cash session to link this payment
        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN', gymId: req.user.gymId }
        });

        const payment = await prisma.payment.create({
            data: {
                memberId: memberId ? parseInt(memberId) : null,
                membershipId: membershipId ? parseInt(membershipId) : null,
                amount,
                method,
                type,
                notes,
                cashSessionId: openSession ? openSession.id : null,
                gymId: req.user.gymId
            }
        });

        res.status(201).json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            where: req.user.gymId ? { gymId: req.user.gymId } : {},
            include: { member: true, membership: { include: { plan: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.voidPayment = async (req, res) => {
    try {
        const { notes } = req.body;
        const paymentId = parseInt(req.params.id);

        const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existing) return res.status(404).json({ message: 'Pago no encontrado' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'VOIDED',
                notes: notes ? `${notes} (ANULADO)` : 'Pago anulado manualmente'
            }
        });

        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al anular el pago' });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const paymentId = parseInt(req.params.id);

        const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existing) return res.status(404).json({ message: 'Pago no encontrado' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        await prisma.payment.delete({
            where: { id: paymentId }
        });

        res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el pago' });
    }
};

