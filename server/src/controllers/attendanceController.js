
const prisma = require('../utils/prisma');

exports.registerAttendance = async (req, res) => {
    try {
        const { identifier, method, scheduleId } = req.body; // identifier can be DNI, fingerprintId or qrCode

        const member = await prisma.member.findFirst({
            where: {
                ...(req.user?.gymId ? { gymId: req.user.gymId } : {}),
                OR: [
                    { dni: identifier },
                    { fingerprintId: identifier },
                    { qrCode: identifier },
                    { firstName: { contains: identifier } },
                    { lastName: { contains: identifier } }
                ]
            },
            include: {
                memberships: {
                    where: {
                        status: 'ACTIVE',
                        endDate: { gte: new Date() }
                    }
                }
            }
        });

        if (!member) {
            return res.status(404).json({ message: 'Member not found', allowed: false });
        }

        const hasActiveMembership = member.memberships.length > 0;

        const attendance = await prisma.attendance.create({
            data: {
                memberId: member.id,
                method: method || 'MANUAL',
                accessAllowed: hasActiveMembership,
                scheduleId: scheduleId ? parseInt(scheduleId) : null
            }
        });

        res.json({
            message: hasActiveMembership ? 'Access granted' : 'Membership expired or inactive',
            allowed: hasActiveMembership,
            member: {
                name: `${member.firstName} ${member.lastName}`,
                dni: member.dni,
                status: member.status
            },
            attendance
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAttendances = async (req, res) => {
    try {
        const attendances = await prisma.attendance.findMany({
            where: req.user?.gymId ? { member: { gymId: req.user.gymId } } : {},
            include: {
                member: true,
                schedule: {
                    include: {
                        gymClass: true,
                        trainer: true
                    }
                }
            },
            orderBy: { date: 'desc' },
            take: 200
        });
        res.json(attendances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRanking = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // 'all', 'month', 'week'
        let dateFilter = {};
        
        const now = new Date();
        if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { gte: startOfMonth };
        } else if (period === 'week') {
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Lunes como inicio
            startOfWeek.setHours(0,0,0,0);
            dateFilter = { gte: startOfWeek };
        }

        const whereClause = {
            accessAllowed: true,
        };

        if (period !== 'all') {
            whereClause.date = dateFilter;
        }

        if (req.user?.gymId) {
            const gymMembers = await prisma.member.findMany({
                where: { gymId: req.user.gymId },
                select: { id: true }
            });
            whereClause.memberId = { in: gymMembers.map(m => m.id) };
        }

        const rankingGroupBy = await prisma.attendance.groupBy({
            by: ['memberId'],
            where: whereClause,
            _count: {
                memberId: true
            },
            orderBy: {
                _count: {
                    memberId: 'desc'
                }
            },
            take: 50 // top 50
        });

        const memberIds = rankingGroupBy.map(g => g.memberId);
        
        const members = await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                dni: true,
                photoUrl: true
            }
        });

        const ranking = rankingGroupBy.map((g, index) => {
            const m = members.find(member => member.id === g.memberId);
            return {
                rank: index + 1,
                memberId: g.memberId,
                name: m ? `${m.firstName} ${m.lastName}` : 'Desconocido',
                dni: m ? m.dni : '',
                photoUrl: m?.photoUrl || null,
                attendanceCount: g._count.memberId
            };
        });

        res.json(ranking);
    } catch (error) {
        console.error('Error fetching attendance ranking:', error);
        res.status(500).json({ message: 'Server error getting ranking', error: error.message });
    }
};

exports.getAttendanceByClass = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        let dateFilter = {};
        
        const now = new Date();
        if (period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { gte: startOfMonth };
        } else if (period === 'week') {
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            startOfWeek.setHours(0,0,0,0);
            dateFilter = { gte: startOfWeek };
        }

        const whereClause = {
            accessAllowed: true,
            scheduleId: { not: null }
        };

        if (period !== 'all') {
            whereClause.date = dateFilter;
        }

        if (req.user?.gymId) {
            whereClause.member = { gymId: req.user.gymId };
        }

        const attendances = await prisma.attendance.findMany({
            where: whereClause,
            select: {
                schedule: {
                    select: {
                        gymClass: {
                            select: {
                                id: true,
                                name: true,
                                color: true
                            }
                        }
                    }
                }
            }
        });

        // Group by class name
        const classStats = {};
        attendances.forEach(att => {
            if (!att.schedule || !att.schedule.gymClass) return;
            const className = att.schedule.gymClass.name;
            const classId = att.schedule.gymClass.id;
            const classColor = att.schedule.gymClass.color;
            if (!classStats[classId]) {
                classStats[classId] = {
                    id: classId,
                    name: className,
                    color: classColor,
                    count: 0
                };
            }
            classStats[classId].count++;
        });

        const result = Object.values(classStats).sort((a, b) => b.count - a.count);

        res.json(result);
    } catch (error) {
        console.error('Error fetching attendance by class:', error);
        res.status(500).json({ message: 'Server error getting stats', error: error.message });
    }
};

