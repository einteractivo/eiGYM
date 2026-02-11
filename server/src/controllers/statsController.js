const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
    try {
        const totalMembers = await prisma.member.count({ where: { status: 'ACTIVE' } });

        const activeMemberships = await prisma.membership.count({
            where: {
                status: 'ACTIVE',
                endDate: { gte: new Date() }
            }
        });

        // Revenue this month
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: { date: { gte: firstDayOfMonth } }
        });

        // Attendance today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendanceToday = await prisma.attendance.count({
            where: { date: { gte: today } }
        });

        // Recent attendances
        const recentAttendances = await prisma.attendance.findMany({
            include: { member: true },
            orderBy: { date: 'desc' },
            take: 5
        });

        // Product stats
        const totalProducts = await prisma.product.count({ where: { active: true } });
        const lowStockProducts = await prisma.product.count({
            where: {
                active: true,
                stock: { lte: 5 }
            }
        });

        res.json({
            stats: {
                totalMembers,
                activeMemberships,
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                attendanceToday,
                totalProducts,
                lowStockProducts
            },
            recentAttendances
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDailyReport = async (req, res) => {
    try {
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
                }
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
                }
            }
        });

        const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);

        // New members today
        const newMembers = await prisma.member.count({
            where: {
                registrationDate: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Attendances today
        const attendances = await prisma.attendance.count({
            where: {
                date: {
                    gte: today,
                    lt: tomorrow
                }
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
