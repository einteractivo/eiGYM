
const prisma = require('../utils/prisma');

exports.createSale = async (req, res) => {
    const { memberId, items, paymentMethod, total, notes } = req.body;

    try {
        if (!req.user.gymId) {
            return res.status(400).json({ error: 'Usuario no pertenece a un gimnasio válido.' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'La venta debe incluir al menos un producto (items)' });
        }

        // Use a transaction to ensure everything succeeds or fails together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Sale
            const sale = await tx.sale.create({
                data: {
                    memberId: memberId ? parseInt(memberId) : null,
                    total: parseFloat(total),
                    gymId: req.user.gymId,
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtSale: parseFloat(item.price)
                        }))
                    }
                },
                include: {
                    items: { include: { product: true } },
                    member: true
                }
            });

            // 2. Create the Payment
            const openSession = await tx.cashSession.findFirst({
                where: { status: 'OPEN', gymId: req.user.gymId }
            });

            // Construct detail string for products
            const productDetails = sale.items.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

            await tx.payment.create({
                data: {
                    memberId: memberId ? parseInt(memberId) : null,
                    saleId: sale.id,
                    amount: parseFloat(total),
                    method: paymentMethod,
                    type: 'PRODUCT',
                    notes: notes || `Venta: ${productDetails} - Ticket #${sale.id}`,
                    cashSessionId: openSession ? openSession.id : null,
                    gymId: req.user.gymId
                }
            });

            // 3. Update Product Stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return sale;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la venta. Verifique el stock.' });
    }
};

exports.getSaleById = async (req, res) => {
    try {
        const sale = await prisma.sale.findFirst({
            where: { 
                id: parseInt(req.params.id),
                ...(req.user.gymId ? { gymId: req.user.gymId } : {})
            },
            include: {
                member: true,
                items: { include: { product: true } },
                payments: true
            }
        });
        if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener venta' });
    }
};

exports.getAllSales = async (req, res) => {
    try {
        const sales = await prisma.sale.findMany({
            where: req.user.gymId ? { gymId: req.user.gymId } : {},
            include: {
                member: true,
                items: { include: { product: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener histórico de ventas' });
    }
};

