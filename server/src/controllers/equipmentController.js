const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllEquipment = async (req, res) => {
    try {
        const { search, status } = req.query;
        const equipment = await prisma.equipment.findMany({
            where: {
                AND: [
                    search ? {
                        OR: [
                            { name: { contains: search } },
                            { description: { contains: search } },
                            { location: { contains: search } }
                        ]
                    } : {},
                    status ? { status } : {}
                ]
            },
            orderBy: { name: 'asc' }
        });
        res.json(equipment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el equipamiento' });
    }
};

exports.getEquipmentById = async (req, res) => {
    try {
        const item = await prisma.equipment.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!item) return res.status(404).json({ message: 'Equipo no encontrado' });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el equipo' });
    }
};

exports.createEquipment = async (req, res) => {
    try {
        const { name, description, status, location, purchaseDate, lastMaintenance, notes } = req.body;
        const item = await prisma.equipment.create({
            data: {
                name,
                description,
                status: status || 'OPERATIONAL',
                location,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
                notes
            }
        });
        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el equipo' });
    }
};

exports.updateEquipment = async (req, res) => {
    try {
        const { name, description, status, location, purchaseDate, lastMaintenance, notes } = req.body;
        const item = await prisma.equipment.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                description,
                status,
                location,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : undefined,
                notes
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el equipo' });
    }
};

exports.deleteEquipment = async (req, res) => {
    try {
        await prisma.equipment.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Equipo eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el equipo' });
    }
};
