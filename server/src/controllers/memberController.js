
const prisma = require('../utils/prisma');

exports.getAllMembers = async (req, res) => {
    try {
        const { search } = req.query;
        let where = req.user.gymId ? { gymId: req.user.gymId } : {};

        if (search) {
            where.AND = [
                {
                    OR: [
                        { firstName: { contains: search } },
                        { lastName: { contains: search } },
                        { dni: { contains: search } }
                    ]
                }
            ];
        }

        const members = await prisma.member.findMany({
            where,
            include: {
                memberships: {
                    include: {
                        plan: true,
                        payments: {
                            orderBy: { date: 'desc' },
                            take: 1
                        }
                    },
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
        const member = await prisma.member.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
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
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { firstName, lastName, dni, phone, email, address, fingerprintId, photoUrl, qrCode, birthday, planId, paymentMethod, notes } = req.body;

        const existingMember = await prisma.member.findFirst({ where: { dni, gymId: req.user.gymId } });
        if (existingMember) return res.status(400).json({ message: 'DNI ya registrado' });

        if (fingerprintId) {
            const existingFingerprint = await prisma.member.findFirst({ where: { fingerprintId, gymId: req.user.gymId } });
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
            birthday: birthday ? new Date(birthday) : null,
            notes: notes || null,
            gymId: req.user.gymId
        };

        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN', gymId: req.user.gymId }
        });

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.member.create({
                data: memberData
            });

            if (planId) {
                const plan = await tx.plan.findFirst({
                    where: { id: parseInt(planId), gymId: req.user.gymId }
                });
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
                            notes: `Pago inicial membresía: ${plan.name}`,
                            cashSessionId: openSession ? openSession.id : null,
                            gymId: req.user.gymId
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
        const { firstName, lastName, dni, phone, email, address, fingerprintId, photoUrl, qrCode, birthday, planId, paymentMethod, notes } = req.body;

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
            birthday: birthday ? new Date(birthday) : (birthday === '' ? null : undefined),
            notes: notes || null
        };

        // Remove undefined keys to avoid overriding with undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const openSession = await prisma.cashSession.findFirst({
            where: { status: 'OPEN', gymId: req.user.gymId }
        });

        const result = await prisma.$transaction(async (tx) => {
            const member = await tx.member.update({
                where: { id: parseInt(req.params.id) },
                data
            });

            if (planId) {
                const plan = await tx.plan.findFirst({
                    where: { id: parseInt(planId), gymId: req.user.gymId }
                });
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
                            notes: `Renovación/Asignación membresía: ${plan.name}`,
                            cashSessionId: openSession ? openSession.id : null,
                            gymId: req.user.gymId
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
        const memberId = parseInt(req.params.id);
        const existing = await prisma.member.findUnique({ where: { id: memberId } });
        if (!existing) return res.status(404).json({ message: 'Miembro no encontrado' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        await prisma.member.delete({
            where: { id: memberId }
        });
        res.json({ message: 'Miembro eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getChurnRiskMembers = async (req, res) => {
    try {
        const gymId = req.user?.gymId;
        if (!gymId) {
            return res.status(400).json({ message: 'Usuario no pertenece a un gimnasio válido.' });
        }

        // Fetch all members of this gym with their memberships, including their plans and latest attendance
        const members = await prisma.member.findMany({
            where: { gymId },
            include: {
                memberships: {
                    orderBy: { endDate: 'desc' },
                    take: 1,
                    include: {
                        plan: true
                    }
                },
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        });

        const today = new Date();
        const churnRiskList = [];

        for (const member of members) {
            const latestMembership = member.memberships[0]; // Ordered by endDate desc
            const latestAttendance = member.attendances[0]; // Ordered by date desc

            let lastAttendanceDate = latestAttendance ? new Date(latestAttendance.date) : null;
            let daysSinceLastAttendance = null;

            if (lastAttendanceDate) {
                const diffTime = today.getTime() - lastAttendanceDate.getTime();
                daysSinceLastAttendance = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            } else {
                // If they never checked in, compute days since registration
                const regDate = new Date(member.registrationDate);
                const diffTime = today.getTime() - regDate.getTime();
                daysSinceLastAttendance = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            let daysToExpiration = null;
            let membershipEndDate = null;
            let planName = 'Sin plan';

            if (latestMembership) {
                membershipEndDate = new Date(latestMembership.endDate);
                const diffTime = membershipEndDate.getTime() - today.getTime();
                daysToExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (latestMembership.plan) {
                    planName = latestMembership.plan.name;
                }
            }

            // Determine Churn Risk
            let riskLevel = 'LOW';
            let riskReason = '';
            let riskScore = 0; // 0 to 100

            // 1. Evaluate Attendance (Heavier weight on lack of attendance)
            if (daysSinceLastAttendance !== null) {
                if (daysSinceLastAttendance > 30) {
                    riskScore += 50;
                    riskReason = `Sin asistencia por más de 30 días (${daysSinceLastAttendance} días)`;
                } else if (daysSinceLastAttendance > 14) {
                    riskScore += 30;
                    riskReason = `Sin asistencia por más de 14 días (${daysSinceLastAttendance} días)`;
                } else if (daysSinceLastAttendance > 7) {
                    riskScore += 15;
                    riskReason = `Sin asistencia por ${daysSinceLastAttendance} días`;
                }
            }

            // 2. Evaluate Membership Expiry
            if (daysToExpiration !== null) {
                if (daysToExpiration < 0) {
                    // Expired
                    const daysExpired = Math.abs(daysToExpiration);
                    riskScore += 40;
                    riskReason = riskReason 
                        ? `${riskReason} + Membresía vencida hace ${daysExpired} días`
                        : `Membresía vencida hace ${daysExpired} días`;
                } else if (daysToExpiration <= 3) {
                    // Expiring very soon
                    riskScore += 25;
                    riskReason = riskReason 
                        ? `${riskReason} + Membresía vence en ${daysToExpiration} días`
                        : `Membresía vence en ${daysToExpiration} días`;
                } else if (daysToExpiration <= 7) {
                    // Expiring soon
                    riskScore += 10;
                    riskReason = riskReason 
                        ? `${riskReason} + Membresía vence en ${daysToExpiration} días`
                        : `Membresía vence en ${daysToExpiration} días`;
                }
            } else {
                // No membership at all!
                riskScore += 60;
                riskReason = 'No cuenta con ninguna membresía activa o registrada';
            }

            // Cap risk score at 100
            riskScore = Math.min(riskScore, 100);

            // Classify risk level
            if (riskScore >= 50) {
                riskLevel = 'HIGH';
            } else if (riskScore >= 20) {
                riskLevel = 'MEDIUM';
            } else {
                riskLevel = 'LOW';
            }

            // We are interested in members with Medium or High Churn Risk
            if (riskLevel !== 'LOW') {
                churnRiskList.push({
                    id: member.id,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    dni: member.dni,
                    phone: member.phone,
                    email: member.email,
                    photoUrl: member.photoUrl,
                    status: member.status,
                    lastAttendanceDate,
                    daysSinceLastAttendance,
                    membershipEndDate,
                    daysToExpiration,
                    planName,
                    riskLevel,
                    riskReason,
                    riskScore
                });
            }
        }

        // Sort by riskScore descending
        churnRiskList.sort((a, b) => b.riskScore - a.riskScore);

        res.json(churnRiskList);
    } catch (error) {
        console.error('[members/churn-risk]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.importMembers = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }

        const { members } = req.body;
        
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ message: 'No se enviaron miembros para importar' });
        }

        const gymId = req.user.gymId;

        const dataToInsert = members.map(m => ({
            firstName: m.firstName || 'Sin Nombre',
            lastName: m.lastName || '',
            dni: String(m.dni).trim(),
            email: m.email || null,
            phone: m.phone ? String(m.phone).trim() : null,
            birthday: m.birthday ? new Date(m.birthday) : null,
            gymId: gymId
        })).filter(m => m.dni); // Only import rows that have a DNI

        if (dataToInsert.length === 0) {
             return res.status(400).json({ message: 'El archivo no contiene registros válidos con DNI' });
        }

        const result = await prisma.member.createMany({
            data: dataToInsert,
            skipDuplicates: true
        });

        res.status(200).json({ 
            message: 'Importación completada', 
            count: result.count,
            totalProcessed: dataToInsert.length
        });
    } catch (error) {
        console.error('[members/import]', error);
        res.status(500).json({ message: 'Error al importar miembros' });
    }
};
