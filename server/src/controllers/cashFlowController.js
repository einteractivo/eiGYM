const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.openSession = async (req, res) => {
    try {
        const { userId, initialAmount, notes } = req.body;

        // Check if there is already an open session
        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN' }
        });

        if (openSession) {
            return res.status(400).json({ message: 'Ya existe una caja abierta' });
        }

        const session = await prisma.cashSession.create({
            data: {
                userId: parseInt(userId),
                initialAmount: parseFloat(initialAmount),
                notes,
                status: 'OPEN'
            }
        });

        res.status(201).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al abrir la caja' });
    }
};

exports.getCurrentSession = async (req, res) => {
    try {
        const session = await prisma.cashSession.findFirst({
            where: { status: 'OPEN' },
            include: {
                user: { select: { name: true } },
                transactions: true,
                payments: {
                    where: { status: 'COMPLETED' },
                    include: { member: true }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ message: 'No hay caja abierta' });
        }

        // Calculate expected balance
        const totalPayments = session.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const totalManualIncome = session.transactions
            .filter(t => t.type === 'INCOME' && t.status !== 'VOIDED')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const totalManualExpense = session.transactions
            .filter(t => t.type === 'EXPENSE' && t.status !== 'VOIDED')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);

        const expectedAmount = parseFloat(session.initialAmount) + totalPayments + totalManualIncome - totalManualExpense;

        res.json({
            ...session,
            summary: {
                totalPayments,
                totalManualIncome,
                totalManualExpense,
                expectedAmount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la caja actual' });
    }
};

exports.closeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalAmount, notes } = req.body;

        const session = await prisma.cashSession.findUnique({
            where: { id: parseInt(id) },
            include: {
                transactions: true,
                payments: { where: { status: 'COMPLETED' } }
            }
        });

        if (!session || session.status === 'CLOSED') {
            return res.status(400).json({ message: 'La caja no existe o ya está cerrada' });
        }

        // Recalculate expected amount one last time
        const totalPayments = session.payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const totalManualIncome = session.transactions
            .filter(t => t.type === 'INCOME' && t.status !== 'VOIDED')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);
        const totalManualExpense = session.transactions
            .filter(t => t.type === 'EXPENSE' && t.status !== 'VOIDED')
            .reduce((acc, t) => acc + parseFloat(t.amount), 0);

        const expectedAmount = parseFloat(session.initialAmount) + totalPayments + totalManualIncome - totalManualExpense;

        const updatedSession = await prisma.cashSession.update({
            where: { id: parseInt(id) },
            data: {
                finalAmount: parseFloat(finalAmount),
                expectedAmount,
                status: 'CLOSED',
                closedAt: new Date(),
                notes: notes || session.notes
            }
        });

        res.json(updatedSession);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cerrar la caja' });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const { sessionId, amount, type, category, description } = req.body;

        const session = await prisma.cashSession.findUnique({
            where: { id: parseInt(sessionId) }
        });

        if (!session || session.status === 'CLOSED') {
            return res.status(400).json({ message: 'La caja está cerrada o no existe' });
        }

        const transaction = await prisma.cashTransaction.create({
            data: {
                sessionId: parseInt(sessionId),
                amount: parseFloat(amount),
                type,
                category,
                description
            }
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar la transacción' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await prisma.cashSession.findMany({
            include: {
                user: { select: { name: true } }
            },
            orderBy: { openedAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el historial' });
    }
};

exports.getSessionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.cashSession.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { name: true } },
                transactions: true,
                payments: {
                    include: { member: true }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ message: 'Caja no encontrada' });
        }

        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener detalles de la caja' });
    }
};
exports.getAllTransactions = async (req, res) => {
    try {
        const { type } = req.query;
        const where = {};
        if (type) {
            where.type = type;
        }

        const transactions = await prisma.cashTransaction.findMany({
            where,
            include: {
                session: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
};
exports.voidTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.cashTransaction.update({
            where: { id: parseInt(id) },
            data: { status: 'VOIDED' }
        });
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al anular transacción' });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.cashTransaction.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Transacción eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar transacción' });
    }
};
