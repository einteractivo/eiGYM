const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all schedules
exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await prisma.schedule.findMany({
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
                }
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
