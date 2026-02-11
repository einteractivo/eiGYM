const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllMembers = async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};

        if (search) {
            where = {
                OR: [
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                    { dni: { contains: search } }
                ]
            };
        }

        const members = await prisma.member.findMany({
            where,
            include: {
                memberships: {
                    include: { plan: true },
                    orderBy: { endDate: 'desc' },
                    take: 1
                }
            }
        });
        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMemberById = async (req, res) => {
    try {
        const member = await prisma.member.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                memberships: {
                    include: { plan: true },
                    orderBy: { startDate: 'desc' }
                },
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 10
                },
                payments: {
                    orderBy: { date: 'desc' }
                }
            }
        });
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createMember = async (req, res) => {
    try {
        const { firstName, lastName, dni, phone, email, address, fingerprintId, photoUrl, qrCode, birthday, planId, paymentMethod } = req.body;

        const existingMember = await prisma.member.findUnique({ where: { dni } });
        if (existingMember) return res.status(400).json({ message: 'DNI ya registrado' });

        if (fingerprintId) {
            const existingFingerprint = await prisma.member.findUnique({ where: { fingerprintId } });
            if (existingFingerprint) return res.status(400).json({ message: 'Huella digital ya registrada en otro miembro' });
        }

        const memberData = {
            firstName,
            lastName,
            dni,
            phone: phone || null,
            email: email || null,
            address: address || null,
            fingerprintId: fingerprintId || null,
            photoUrl: photoUrl || null,
            qrCode: qrCode || null,
            birthday: birthday ? new Date(birthday) : null
        };

        const result = await prisma.$transaction(async (prisma) => {
            const member = await prisma.member.create({
                data: memberData
            });

            if (planId) {
                const plan = await prisma.plan.findUnique({ where: { id: parseInt(planId) } });
                if (plan) {
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + plan.durationDays);

                    const membership = await prisma.membership.create({
                        data: {
                            memberId: member.id,
                            planId: plan.id,
                            startDate,
                            endDate,
                            price: plan.price,
                            status: 'ACTIVE'
                        }
                    });

                    // Automatically create payment record
                    await prisma.payment.create({
                        data: {
                            memberId: member.id,
                            membershipId: membership.id,
                            amount: plan.price,
                            method: paymentMethod || 'CASH',
                            type: 'MEMBERSHIP',
                            notes: `Pago inicial membresía: ${plan.name}`
                        }
                    });
                }
            }
            return member;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateMember = async (req, res) => {
    try {
        const { firstName, lastName, dni, phone, email, address, fingerprintId, photoUrl, qrCode, birthday, planId, paymentMethod } = req.body;

        const data = {
            firstName,
            lastName,
            dni,
            phone: phone || null,
            email: email || null,
            address: address || null,
            fingerprintId: fingerprintId || null,
            photoUrl: photoUrl || null,
            qrCode: qrCode || null,
            birthday: birthday ? new Date(birthday) : (birthday === '' ? null : undefined)
        };

        // Remove undefined keys to avoid overriding with undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.member.update({
                where: { id: parseInt(req.params.id) },
                data
            });

            if (planId) {
                const plan = await tx.plan.findUnique({ where: { id: parseInt(planId) } });
                if (plan) {
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + plan.durationDays);

                    const membership = await tx.membership.create({
                        data: {
                            memberId: member.id,
                            planId: plan.id,
                            startDate,
                            endDate,
                            price: plan.price,
                            status: 'ACTIVE'
                        }
                    });

                    // Automatically create payment record
                    await tx.payment.create({
                        data: {
                            memberId: member.id,
                            membershipId: membership.id,
                            amount: plan.price,
                            method: paymentMethod || 'CASH',
                            type: 'MEMBERSHIP',
                            notes: `Renovación/Asignación membresía: ${plan.name}`
                        }
                    });
                }
            }
            return member;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteMember = async (req, res) => {
    try {
        await prisma.member.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
