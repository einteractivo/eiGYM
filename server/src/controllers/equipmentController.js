
const prisma = require('../utils/prisma');

exports.getAllEquipment = async (req, res) => {
    try {
        const { search, status } = req.query;
        const equipment = await prisma.equipment.findMany({
            where: {
                AND: [
                    req.user.gymId ? { gymId: req.user.gymId } : {},
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
        const item = await prisma.equipment.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            }
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
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { name, description, status, location, purchaseDate, lastMaintenance, notes, photoUrl } = req.body;
        const item = await prisma.equipment.create({
            data: {
                name,
                description,
                status: status || 'OPERATIONAL',
                location,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
                notes,
                photoUrl: photoUrl || null,
                gymId: req.user.gymId
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
        const { name, description, status, location, purchaseDate, lastMaintenance, notes, photoUrl } = req.body;
        const data = {
            name,
            description,
            status,
            location,
            purchaseDate: purchaseDate !== undefined && purchaseDate !== ''
                ? new Date(purchaseDate)
                : (purchaseDate === '' || purchaseDate === null ? null : undefined),
            lastMaintenance: lastMaintenance !== undefined && lastMaintenance !== ''
                ? new Date(lastMaintenance)
                : (lastMaintenance === '' || lastMaintenance === null ? null : undefined),
            notes,
            photoUrl: photoUrl !== undefined ? photoUrl : undefined
        };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        const item = await prisma.equipment.update({
            where: { id: parseInt(req.params.id) },
            data
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

