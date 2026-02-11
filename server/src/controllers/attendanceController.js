const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.registerAttendance = async (req, res) => {
    try {
        const { identifier, method } = req.body; // identifier can be DNI, fingerprintId or qrCode

        const member = await prisma.member.findFirst({
            where: {
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
                accessAllowed: hasActiveMembership
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
            include: { member: true },
            orderBy: { date: 'desc' },
            take: 100
        });
        res.json(attendances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
