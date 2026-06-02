
const prisma = require('../utils/prisma');

exports.getDashboardStats = async (req, res) => {
    try {
        const gymId = req.user.gymId;
        const gymFilter = gymId ? { gymId } : {};

        const totalMembers = await prisma.member.count({ 
            where: { status: 'ACTIVE', ...gymFilter } 
        });

        const activeMemberships = await prisma.membership.count({
            where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() },
                member: { ...gymFilter }
            }
        });

        // Revenue this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                date: { gte: firstDayOfMonth },
                status: 'COMPLETED',
                ...gymFilter
            }
        });

        // Expenses this month
        const monthlyExpenses = await prisma.cashTransaction.aggregate({
            _sum: { amount: true },
            where: {
                createdAt: { gte: firstDayOfMonth },
                type: 'EXPENSE',
                status: 'COMPLETED',
                session: { ...gymFilter }
            }
        });

        // Attendance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceToday = await prisma.attendance.count({
            where: { 
                date: { gte: today },
                member: { ...gymFilter }
            }
        });

        // Recent attendances
        const recentAttendances = await prisma.attendance.findMany({
            where: { member: { ...gymFilter } },
            include: { member: true },
            orderBy: { date: 'desc' },
            take: 5
        });

        // Product stats
        const totalProducts = await prisma.product.count({ 
            where: { active: true, ...gymFilter } 
        });
        const lowStockProducts = await prisma.product.count({
            where: {
                active: true,
                stock: { lte: 5 },
                ...gymFilter
            }
        });

        let birthdaysToday = [];
        if (gymId) {
            birthdaysToday = await prisma.$queryRaw`
                SELECT id, firstName, lastName, birthday FROM member 
                WHERE status = 'ACTIVE' 
                AND gymId = ${gymId}
                AND MONTH(birthday) = MONTH(CURDATE()) 
                AND DAY(birthday) = DAY(CURDATE())
            `;
        } else {
            birthdaysToday = await prisma.$queryRaw`
                SELECT id, firstName, lastName, birthday FROM member 
                WHERE status = 'ACTIVE' 
                AND MONTH(birthday) = MONTH(CURDATE()) 
                AND DAY(birthday) = DAY(CURDATE())
            `;
        }

        // Fetch top selling products for this gym
        const saleItemsGrouped = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                sale: {
                    ...gymFilter
                }
            },
            orderBy: {
                _sum: { quantity: 'desc' }
            },
            take: 5
        });

        const topSellingProducts = await Promise.all(
            saleItemsGrouped.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product) return null;
                return {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    stock: product.stock,
                    photoUrl: product.photoUrl,
                    totalSold: item._sum.quantity || 0,
                    totalRevenue: (item._sum.quantity || 0) * Number(product.price)
                };
            })
        ).then(products => products.filter(p => p !== null));

        // Fetch recent sales for this gym
        const recentSales = await prisma.sale.findMany({
            where: {
                ...gymFilter
            },
            include: {
                member: {
                    select: { firstName: true, lastName: true }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: 5
        });

        const formattedRecentSales = recentSales.map(sale => ({
            id: sale.id,
            total: Number(sale.total),
            date: sale.date,
            memberName: sale.member ? `${sale.member.firstName} ${sale.member.lastName}` : 'Cliente Genérico',
            items: sale.items.map(item => ({
                id: item.id,
                productName: item.product.name,
                quantity: item.quantity,
                priceAtSale: Number(item.priceAtSale)
            }))
        }));

        res.json({
            stats: {
                totalMembers,
                activeMemberships,
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                monthlyExpenses: monthlyExpenses._sum.amount || 0,
                attendanceToday,
                totalProducts,
                lowStockProducts,
                birthdaysToday: birthdaysToday.length || 0
            },
            recentAttendances,
            birthdaysToday,
            topSellingProducts,
            recentSales: formattedRecentSales
        });
    } catch (error) {
        console.error('[stats/dashboard]', error);
        res.status(500).json({ message: 'Error del servidor al obtener estadísticas' });
    }
};

exports.getDailyReport = async (req, res) => {
    try {
        const gymId = req.user.gymId;
        const gymFilter = gymId ? { gymId } : {};

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Payments today
        const payments = await prisma.payment.findMany({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                },
                ...gymFilter
            },
            include: {
                member: {
                    select: { firstName: true, lastName: true, dni: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Totals by method
        const totalsByMethod = await prisma.payment.groupBy({
            by: ['method'],
            _sum: { amount: true },
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                },
                ...gymFilter
            }
        });

        const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

        // New members today
        const newMembers = await prisma.member.count({
            where: {
                registrationDate: {
                    gte: today,
                    lt: tomorrow
                },
                ...gymFilter
            }
        });

        // Attendances today
        const attendances = await prisma.attendance.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                },
                member: { ...gymFilter }
            }
        });

        res.json({
            date: today,
            totalRevenue: Number(totalRevenue),
            totalsByMethod: totalsByMethod.map(t => ({
                method: t.method,
                _sum: { amount: Number(t._sum.amount || 0) }
            })),
            newMembers: Number(newMembers),
            attendances: Number(attendances),
            payments: payments.map(p => ({
                ...p,
                amount: Number(p.amount)
            }))
        });
    } catch (error) {
        console.error('[stats/dailyReport]', error);
        res.status(500).json({ message: 'Error del servidor al generar reporte diario' });
    }
};

