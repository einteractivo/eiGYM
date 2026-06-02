
const prisma = require('../utils/prisma');

exports.getDetailedReport = async (req, res) => {
    try {
        const { date, month, year, type } = req.query;
        let startDate, endDate;

        if (type === 'daily') {
            if (!date) return res.status(400).json({ message: 'Parámetro "date" requerido para reporte diario' });
            const parts = date.split('-');
            if (parts.length !== 3) return res.status(400).json({ message: 'Formato de fecha inválido. Use YYYY-MM-DD' });
            const [y, m, d] = parts.map(Number);
            if (isNaN(y) || isNaN(m) || isNaN(d)) return res.status(400).json({ message: 'Fecha inválida' });
            startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
            endDate = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
            // Monthly
            const m = month !== undefined ? parseInt(month) : (new Date().getMonth() + 1);
            const yr = year !== undefined ? parseInt(year) : new Date().getFullYear();
            if (isNaN(m) || isNaN(yr)) return res.status(400).json({ message: 'Parámetros "month" o "year" inválidos' });
            startDate = new Date(yr, m - 1, 1, 0, 0, 0, 0);
            endDate = new Date(yr, m, 0, 23, 59, 59, 999);
        }

        // 1. Fetch all completed payments (Income)
        const payments = await prisma.payment.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                status: 'COMPLETED',
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
            include: {
                member: { select: { firstName: true, lastName: true } }
            },
            orderBy: { date: 'asc' }
        });

        // 2. Fetch all manual income transactions
        const manualIncome = await prisma.cashTransaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                type: 'INCOME',
                status: 'COMPLETED',
                ...(req.user.gymId ? { session: { gymId: req.user.gymId } } : {})
            },
            orderBy: { createdAt: 'asc' }
        });

        // 3. Fetch all expenses
        const expenses = await prisma.cashTransaction.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                type: 'EXPENSE',
                status: 'COMPLETED',
                ...(req.user.gymId ? { session: { gymId: req.user.gymId } } : {})
            },
            orderBy: { createdAt: 'asc' }
        });

        // Format data for the report
        const formattedIncome = [
            ...payments.map(p => ({
                id: `p-${p.id}`,
                date: p.date,
                category: p.type === 'PRODUCT' ? (p.notes?.startsWith('Venta:') ? p.notes.split(' - ')[0] : 'PRODUCTO') : p.type,
                description: `Pago de ${p.member?.firstName || ''} ${p.member?.lastName || ''} (${p.notes || ''})`,
                amount: Number(p.amount),
                method: p.method,
                type: 'INCOME'
            })),
            ...manualIncome.map(t => ({
                id: `t-${t.id}`,
                date: t.createdAt,
                category: (t.category === 'COMPRAS' || t.category === 'VENTA PRODUCTO') && t.description?.includes('producto:') 
                    ? (t.description.split(': ')[1]?.split(' (')[0] || t.category)
                    : t.category,
                description: t.description,
                amount: Number(t.amount),
                method: t.method,
                type: 'INCOME'
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        const formattedExpenses = expenses.map(e => ({
            id: `e-${e.id}`,
            date: e.createdAt,
            category: e.category,
            description: e.description,
            amount: Number(e.amount),
            method: e.method,
            type: 'EXPENSE'
        }));

        const totalIncome = formattedIncome.reduce((acc, item) => acc + item.amount, 0);
        const totalExpenses = formattedExpenses.reduce((acc, item) => acc + item.amount, 0);

        // Group by category for charts/summaries
        const incomeByCategory = formattedIncome.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});

        const expensesByCategory = formattedExpenses.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});

        // Group by method
        const incomeByMethod = formattedIncome.reduce((acc, item) => {
            acc[item.method] = (acc[item.method] || 0) + item.amount;
            return acc;
        }, {});

        res.json({
            period: { startDate, endDate, type },
            summary: {
                totalIncome,
                totalExpenses,
                balance: totalIncome - totalExpenses
            },
            details: {
                income: formattedIncome,
                expenses: formattedExpenses
            },
            groups: {
                incomeByCategory,
                expensesByCategory,
                incomeByMethod
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el reporte' });
    }
};
