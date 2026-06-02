
const prisma = require('../utils/prisma');

// Get all gym classes
exports.getAllClasses = async (req, res) => {
    try {
        const classes = await prisma.gymClass.findMany({
            where: req.user.gymId ? { gymId: req.user.gymId } : {},
            include: {
                schedules: true
            }
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new gym class
exports.createClass = async (req, res) => {
    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        
        const { name, description, color, active } = req.body;
        const newClass = await prisma.gymClass.create({
            data: { 
                name, 
                description, 
                color,
                active: active !== undefined ? active : true,
                gymId: req.user.gymId 
            }
        });
        res.status(201).json(newClass);
    } catch (error) {
        console.error("Error creating gym class:", error);
        res.status(500).json({ error: error.message });
    }
};


// Update a gym class
exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.gymClass.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ error: 'Clase no encontrada' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) return res.status(403).json({ error: 'No autorizado' });

        const { name, description, active, color } = req.body;
        const updatedClass = await prisma.gymClass.update({
            where: { id: parseInt(id) },
            data: { name, description, active, color }
        });
        res.json(updatedClass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a gym class
exports.deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.gymClass.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ error: 'Clase no encontrada' });
        if (req.user.gymId && existing.gymId !== req.user.gymId) return res.status(403).json({ error: 'No autorizado' });

        await prisma.gymClass.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

