const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res) => {
    try {
        const { search, activeOnly } = req.query;
        const products = await prisma.product.findMany({
            where: {
                AND: [
                    search ? {
                        OR: [
                            { name: { contains: search } },
                            { description: { contains: search } }
                        ]
                    } : {},
                    activeOnly === 'true' ? { active: true } : {}
                ]
            },
            orderBy: { name: 'asc' }
        });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener producto' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, photoUrl, active } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                photoUrl: photoUrl || null,
                active: active !== undefined ? active : true
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, photoUrl, active } = req.body;
        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                description,
                price: price !== undefined ? parseFloat(price) : undefined,
                stock: stock !== undefined ? parseInt(stock) : undefined,
                photoUrl: photoUrl !== undefined ? photoUrl : undefined,
                active: active !== undefined ? active : undefined
            }
        });
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        // We can either delete or just deactivate
        await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: { active: false }
        });
        res.json({ message: 'Producto desactivado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al desactivar producto' });
    }
};
