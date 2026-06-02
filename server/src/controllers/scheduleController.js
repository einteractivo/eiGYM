
const prisma = require('../utils/prisma');

// Get all schedules
exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await prisma.schedule.findMany({
            where: req.user.gymId ? {
                gymClass: {
                    gymId: req.user.gymId
                }
            } : {},
            include: {
                gymClass: true,
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
    try {
        const { classId, trainerId, dayOfWeek, startTime, endTime, capacity } = req.body;

        // Verify the class belongs to the user's gym
        if (req.user.gymId && classId) {
            const gymClass = await prisma.gymClass.findUnique({ where: { id: parseInt(classId) } });
            if (!gymClass || gymClass.gymId !== req.user.gymId) {
                return res.status(403).json({ error: 'No autorizado' });
            }
        }

        const newSchedule = await prisma.schedule.create({
            data: {
                classId: parseInt(classId),
                trainerId: parseInt(trainerId),
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                capacity: parseInt(capacity)
            },
            include: {
                gymClass: true,
                trainer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership via the related gymClass
        const existing = await prisma.schedule.findUnique({
            where: { id: parseInt(id) },
            include: { gymClass: { select: { gymId: true } } }
        });
        if (!existing) return res.status(404).json({ error: 'Horario no encontrado' });
        if (req.user.gymId && existing.gymClass.gymId !== req.user.gymId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { classId, trainerId, dayOfWeek, startTime, endTime, capacity, active } = req.body;
        const updatedSchedule = await prisma.schedule.update({
            where: { id: parseInt(id) },
            data: {
                classId: classId ? parseInt(classId) : undefined,
                trainerId: trainerId ? parseInt(trainerId) : undefined,
                dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : undefined,
                startTime,
                endTime,
                capacity: capacity ? parseInt(capacity) : undefined,
                active
            }
        });
        res.json(updatedSchedule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership via the related gymClass
        const existing = await prisma.schedule.findUnique({
            where: { id: parseInt(id) },
            include: { gymClass: { select: { gymId: true } } }
        });
        if (!existing) return res.status(404).json({ error: 'Horario no encontrado' });
        if (req.user.gymId && existing.gymClass.gymId !== req.user.gymId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        await prisma.schedule.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all trainers (Users with role TRAINER or SUPERADMIN/ADMIN if they also train)
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await prisma.user.findMany({
            where: {
                role: {
                    in: ['TRAINER', 'ADMIN', 'SUPERADMIN'] // Including ADMIN/SUPERADMIN just in case
                },
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        res.json(trainers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

