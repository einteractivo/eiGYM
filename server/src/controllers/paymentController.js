const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createPayment = async (req, res) => {
    try {
        const { memberId, membershipId, amount, method, type, notes } = req.body;

        // Check if there is an open cash session to link this payment
        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN' }
        });

        const payment = await prisma.payment.create({
            data: {
                memberId: memberId ? parseInt(memberId) : null,
                membershipId: membershipId ? parseInt(membershipId) : null,
                amount,
                method,
                type,
                notes,
                cashSessionId: openSession ? openSession.id : null
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

        await prisma.payment.delete({
            where: { id: paymentId }
        });

        res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el pago' });
    }
};
