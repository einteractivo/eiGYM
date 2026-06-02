
const prisma = require('../utils/prisma');

exports.openSession = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { userId, initialAmount, notes } = req.body;

        // Check if there is already an open session for THIS gym
        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN', gymId: req.user.gymId }
        });

        if (openSession) {
            return res.status(400).json({ message: 'Ya existe una caja abierta' });
        }

        const session = await prisma.cashSession.create({
            data: {
                userId: parseInt(userId),
                initialAmount: parseFloat(initialAmount),
                notes,
                status: 'OPEN',
                gymId: req.user.gymId
            }
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('[cashFlow/openSession]', error);
        res.status(500).json({ message: 'Error al abrir la caja' });
    }
};

exports.getCurrentSession = async (req, res) => {
    try {
        const session = await prisma.cashSession.findFirst({
            where: { 
                status: 'OPEN',
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
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
        console.error('[cashFlow/getCurrentSession]', error);
        res.status(500).json({ message: 'Error al obtener la caja actual' });
    }
};

exports.closeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalAmount, notes } = req.body;

        const session = await prisma.cashSession.findFirst({
            where: { 
                id: parseInt(id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
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
        console.error('[cashFlow/closeSession]', error);
        res.status(500).json({ message: 'Error al cerrar la caja' });
    }
};

exports.addTransaction = async (req, res) => {
    try {
        const { sessionId, amount, type, category, description, method } = req.body;

        const session = await prisma.cashSession.findFirst({
            where: { 
                id: parseInt(sessionId),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            }
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
                description,
                method: method || 'CASH',
                status: 'COMPLETED'
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
            where: req.user.gymId ? { gymId: req.user.gymId } : {},
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
        const session = await prisma.cashSession.findFirst({
            where: { 
                id: parseInt(id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
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
        const gymId = req.user.gymId;
        const gymFilter = gymId ? { gymId } : {};
        
        // 1. Fetch manual transactions
        const transactionWhere = {};
        if (type) {
            transactionWhere.type = type;
        }
        if (gymId) {
            transactionWhere.session = { gymId };
        }

        const transactions = await prisma.cashTransaction.findMany({
            where: transactionWhere,
            include: {
                session: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map transactions to a common format
        const formattedTransactions = transactions.map(t => ({
            ...t,
            createdAt: t.createdAt, // Ensure it's explicitly named for frontend
            source: 'MANUAL',
            responsible: t.session?.user?.name || 'N/A'
        }));

        // 2. Fetch automatic payments (only as INCOME)
        if (!type || type === 'INCOME') {
            const payments = await prisma.payment.findMany({
                where: { status: 'COMPLETED', ...gymFilter },
                include: {
                    member: true,
                    cashSession: {
                        include: { user: { select: { name: true } } }
                    }
                },
                orderBy: { date: 'desc' }
            });

            const formattedPayments = payments.map(p => ({
                id: p.id + 1000000, // Offset ID to avoid collision with manual transactions
                rawId: p.id,
                sessionId: p.cashSessionId,
                amount: p.amount,
                type: 'INCOME',
                category: p.type === 'PRODUCT' ? (p.notes?.startsWith('Venta:') ? p.notes.split(' - ')[0] : 'PRODUCTO') : p.type,
                description: `Pago: ${p.member?.firstName || ''} ${p.member?.lastName || ''} - ${p.notes || ''}`,
                status: p.status,
                createdAt: p.date,
                source: 'AUTOMATIC',
                method: p.method,
                responsible: p.cashSession?.user?.name || 'Sistema'
            }));

            // Merge and sort by createdAt descending
            const allMovements = [...formattedTransactions, ...formattedPayments].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            return res.json(allMovements);
        }

        res.json(formattedTransactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
};
exports.voidTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const gymId = req.user.gymId;

        // Verify transaction belongs to this gym
        const transactionExists = await prisma.cashTransaction.findFirst({
            where: {
                id: parseInt(id),
                session: gymId ? { gymId } : {}
            }
        });

        if (!transactionExists) {
            return res.status(404).json({ message: 'Transacción no encontrada o no pertenece a su gimnasio' });
        }

        const transaction = await prisma.cashTransaction.update({
            where: { id: parseInt(id) },
            data: { status: 'VOIDED' }
        });
        res.json(transaction);
    } catch (error) {
        console.error('[cashFlow/voidTransaction]', error);
        res.status(500).json({ message: 'Error al anular transacción' });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const gymId = req.user.gymId;

        // Verify transaction belongs to this gym
        const transactionExists = await prisma.cashTransaction.findFirst({
            where: {
                id: parseInt(id),
                session: gymId ? { gymId } : {}
            }
        });

        if (!transactionExists) {
            return res.status(404).json({ message: 'Transacción no encontrada o no pertenece a su gimnasio' });
        }

        await prisma.cashTransaction.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Transacción eliminada' });
    } catch (error) {
        console.error('[cashFlow/deleteTransaction]', error);
        res.status(500).json({ message: 'Error al eliminar transacción' });
    }
};

exports.resetCashFlow = async (req, res) => {
    try {
        const gymId = req.user.gymId;
        if (!gymId) {
            return res.status(400).json({ error: 'Operación no permitida: no se detectó el gimnasio.' });
        }

        // Usamos una transacción para asegurar que todo se borre o nada se borre, SOLO DEL GYM
        await prisma.$transaction(async (tx) => {
            // First we must get all cash sessions for this gym to delete their transactions
            const sessions = await tx.cashSession.findMany({ where: { gymId }, select: { id: true } });
            const sessionIds = sessions.map(s => s.id);
            
            if (sessionIds.length > 0) {
                await tx.cashTransaction.deleteMany({
                    where: { sessionId: { in: sessionIds } }
                });
            }

            await tx.payment.deleteMany({ where: { gymId } });
            
            // For sale items, we must get sales of this gym
            const sales = await tx.sale.findMany({ where: { gymId }, select: { id: true } });
            const saleIds = sales.map(s => s.id);
            
            if (saleIds.length > 0) {
                await tx.saleItem.deleteMany({
                    where: { saleId: { in: saleIds } }
                });
            }

            await tx.sale.deleteMany({ where: { gymId } });
            await tx.cashSession.deleteMany({ where: { gymId } });
        });

        res.json({ message: 'Sistema financiero reseteado a cero correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al resetear el sistema financiero' });
    }
};

