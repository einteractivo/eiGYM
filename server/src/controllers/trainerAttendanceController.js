
const prisma = require('../utils/prisma');

exports.registerTrainerAttendance = async (req, res) => {
    try {
        const { trainerId, action, notes } = req.body; // action: 'CHECK_IN' or 'CHECK_OUT'
        const gymId = req.user.gymId;

        if (!trainerId) {
            return res.status(400).json({ message: 'Trainer ID is required' });
        }

        if (action === 'CHECK_IN') {
            // Check if already checked in
            const activeSession = await prisma.trainerAttendance.findFirst({
                where: { trainerId: parseInt(trainerId), gymId, checkOut: null }
            });

            if (activeSession) {
                return res.status(400).json({ message: 'Trainer already checked in' });
            }

            // Find current schedule
            const now = new Date();
            const dayOfWeek = now.getDay();

            // Find schedules for this trainer today
            const schedules = await prisma.schedule.findMany({
                where: { 
                    trainerId: parseInt(trainerId), 
                    gymClass: { gymId: gymId },
                    dayOfWeek, 
                    active: true 
                }
            });

            let matchedSchedule = null;
            let status = 'PRESENT';

            for (const s of schedules) {
                const [startH, startM] = s.startTime.split(':').map(Number);
                const [endH, endM] = s.endTime.split(':').map(Number);
                
                const startTimeDate = new Date(now);
                startTimeDate.setHours(startH, startM, 0, 0);
                
                const endTimeDate = new Date(now);
                endTimeDate.setHours(endH, endM, 0, 0);

                // If check-in is more than 15 mins after start, it's LATE
                const lateLimit = new Date(startTimeDate);
                lateLimit.setMinutes(lateLimit.getMinutes() + 15);

                // Buffer of 60 mins before start to allow early check-in
                const earlyLimit = new Date(startTimeDate);
                earlyLimit.setMinutes(earlyLimit.getMinutes() - 60);

                if (now >= earlyLimit && now <= endTimeDate) {
                    matchedSchedule = s;
                    if (now > lateLimit) {
                        status = 'LATE';
                    }
                    break;
                }
            }

            const attendance = await prisma.trainerAttendance.create({
                data: {
                    trainerId: parseInt(trainerId),
                    gymId,
                    scheduleId: matchedSchedule?.id,
                    status,
                    notes
                }
            });

            return res.json({ 
                message: matchedSchedule ? `Check-in successful for ${matchedSchedule.startTime} class` : 'Check-in successful (No matching schedule found)', 
                attendance 
            });

        } else if (action === 'CHECK_OUT') {
            const activeSession = await prisma.trainerAttendance.findFirst({
                where: { trainerId: parseInt(trainerId), gymId, checkOut: null },
                orderBy: { checkIn: 'desc' }
            });

            if (!activeSession) {
                return res.status(404).json({ message: 'No active session found for this trainer' });
            }

            const attendance = await prisma.trainerAttendance.update({
                where: { id: activeSession.id },
                data: {
                    checkOut: new Date(),
                    notes: notes || activeSession.notes
                }
            });

            return res.json({ message: 'Check-out successful', attendance });
        }

        res.status(400).json({ message: 'Invalid action' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTrainerAttendances = async (req, res) => {
    try {
        const { trainerId, startDate, endDate } = req.query;
        const gymId = req.user.gymId;

        const attendances = await prisma.trainerAttendance.findMany({
            where: {
                gymId,
                ...(trainerId ? { trainerId: parseInt(trainerId) } : {}),
                checkIn: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {})
                }
            },
            include: {
                trainer: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                schedule: {
                    include: {
                        gymClass: true
                    }
                }
            },
            orderBy: { checkIn: 'desc' }
        });

        res.json(attendances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getTrainerStats = async (req, res) => {
    try {
        const gymId = req.user.gymId;
        const { trainerId, month, year } = req.query;

        const now = new Date();
        const targetMonth = month ? parseInt(month) : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const attendances = await prisma.trainerAttendance.findMany({
            where: {
                gymId,
                ...(trainerId ? { trainerId: parseInt(trainerId) } : {}),
                checkIn: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const stats = {
            totalDays: new Set(attendances.map(a => a.checkIn.toDateString())).size,
            present: attendances.filter(a => a.status === 'PRESENT').length,
            late: attendances.filter(a => a.status === 'LATE').length,
            absent: 0 // This would require cross-referencing with all assigned schedules
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
