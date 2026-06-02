
const prisma = require('../utils/prisma');

exports.getAllSpecialClasses = async (req, res) => {
    try {
        const classes = await prisma.specialClass.findMany({
            where: req.user.gymId ? { gymId: req.user.gymId } : {},
            include: {
                registrations: {
                    include: {
                        member: true
                    }
                }
            }
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSpecialClass = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { name, description, price, schedule, capacity, dayOfWeek, startTime, endTime, color } = req.body;
        const newClass = await prisma.specialClass.create({
            data: { 
                name, 
                description, 
                price: parseFloat(price), 
                schedule, 
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
                startTime,
                endTime,
                capacity: capacity ? parseInt(capacity) : null,
                color,
                gymId: req.user.gymId
            }
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSpecialClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, schedule, capacity, active, dayOfWeek, startTime, endTime, color } = req.body;
        const updatedClass = await prisma.specialClass.update({
            where: { id: parseInt(id) },
            data: { 
                name, 
                description, 
                price: parseFloat(price), 
                schedule, 
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
                startTime,
                endTime,
                capacity: capacity ? parseInt(capacity) : null,
                active,
                color
            }
        });
        res.json(updatedClass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSpecialClass = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.specialClass.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.enrollMember = async (req, res) => {
    try {
        const { id } = req.params; // specialClassId
        const { memberId, paymentMethod, amount, type, cashSessionId } = req.body;

        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }

        // Start transaction for registration + payment
        const result = await prisma.$transaction(async (tx) => {
            const registration = await tx.specialClassRegistration.create({
                data: {
                    specialClassId: parseInt(id),
                    memberId: parseInt(memberId),
                    status: 'ACTIVE'
                }
            });

            let finalCashSessionId = cashSessionId ? parseInt(cashSessionId) : null;

            // If no cashSessionId is provided, try to find an open one
            if (!finalCashSessionId) {
                const openSession = await tx.cashSession.findFirst({
                    where: { status: 'OPEN', gymId: req.user.gymId }
                });
                if (openSession) {
                    finalCashSessionId = openSession.id;
                }
            }

            const payment = await tx.payment.create({
                data: {
                    memberId: parseInt(memberId),
                    specialClassRegistrationId: registration.id,
                    amount: parseFloat(amount),
                    method: paymentMethod,
                    type: type || 'SPECIAL_CLASS',
                    cashSessionId: finalCashSessionId,
                    gymId: req.user.gymId,
                    status: 'COMPLETED'
                }
            });

            return { registration, payment };
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cancelEnrollment = async (req, res) => {
    try {
        const { id, registrationId } = req.params;
        const registration = await prisma.specialClassRegistration.findUnique({
            where: { id: parseInt(registrationId) },
            include: { specialClass: { select: { gymId: true } } }
        });
        if (!registration) return res.status(404).json({ error: 'Inscripción no encontrada' });
        if (req.user.gymId && registration.specialClass.gymId !== req.user.gymId) {
            return res.status(403).json({ error: 'No autorizado' });
        }
        const updated = await prisma.specialClassRegistration.update({
            where: { id: parseInt(registrationId) },
            data: { status: 'CANCELLED' }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

