
const prisma = require('../utils/prisma');

exports.getAllProducts = async (req, res) => {
    try {
        const { search, activeOnly } = req.query;
        const products = await prisma.product.findMany({
            where: {
                AND: [
                    req.user.gymId ? { gymId: req.user.gymId } : {},
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
        const product = await prisma.product.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            }
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
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }
        const { name, description, costPrice, price, stock, photoUrl, active } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                description,
                costPrice: parseFloat(costPrice) || 0,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                photoUrl: photoUrl || null,
                active: active !== undefined ? active : true,
                gymId: req.user.gymId
            }
        });

        // Automatización: Si el stock inicial es > 0, registrar un egreso en caja usando el PRECIO DE COMPRA
        if (parseInt(stock) > 0) {
            const openSession = await prisma.cashSession.findFirst({
                where: { status: 'OPEN', gymId: req.user.gymId }
            });

            if (openSession) {
                const unitCost = costPrice !== undefined && costPrice !== null && costPrice !== ''
                    ? parseFloat(costPrice)
                    : (price !== undefined ? parseFloat(price) : 0);
                await prisma.cashTransaction.create({
                    data: {
                        sessionId: openSession.id,
                        amount: unitCost * parseInt(stock),
                        type: 'EXPENSE',
                        category: 'COMPRAS',
                        description: `Stock inicial producto: ${name} (${stock} uds)`
                    }
                });
            }
        }

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, costPrice, price, stock, photoUrl, active } = req.body;
        const product = await prisma.product.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                description,
                costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
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
        const id = parseInt(req.params.id);

        // Verificar si tiene dependencias (ventas)
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { saleItems: true }
                }
            }
        });

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (product._count.saleItems > 0) {
            // Tiene historial, solo desactivamos para no romper la integridad de datos
            await prisma.product.update({
                where: { id },
                data: { active: false }
            });
            res.json({
                message: 'El producto tiene ventas registradas. Se ha desactivado para preservar el historial.',
                status: 'DEACTIVATED'
            });
        } else {
            // No tiene historial, eliminación física permitida
            await prisma.product.delete({
                where: { id }
            });
            res.json({
                message: 'Producto eliminado definitivamente.',
                status: 'DELETED'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la eliminación del producto' });
    }
};

