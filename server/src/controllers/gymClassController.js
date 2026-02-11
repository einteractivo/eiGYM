const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all gym classes
exports.getAllClasses = async (req, res) => {
    try {
        const classes = await prisma.gymClass.findMany({
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
        const { name, description } = req.body;
        const newClass = await prisma.gymClass.create({
            data: { name, description }
        });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a gym class
exports.updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, active } = req.body;
        const updatedClass = await prisma.gymClass.update({
            where: { id: parseInt(id) },
            data: { name, description, active }
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
        await prisma.gymClass.delete({
            where: { id: parseInt(id) }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
