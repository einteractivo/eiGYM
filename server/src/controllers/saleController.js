const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createSale = async (req, res) => {
    const { memberId, items, paymentMethod, total, notes } = req.body;

    try {
        // Use a transaction to ensure everything succeeds or fails together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Sale
            const sale = await tx.sale.create({
                data: {
                    memberId: memberId ? parseInt(memberId) : null,
                    total: parseFloat(total),
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
                where: { status: 'OPEN' }
            });

            await tx.payment.create({
                data: {
                    memberId: memberId ? parseInt(memberId) : null,
                    saleId: sale.id,
                    amount: parseFloat(total),
                    method: paymentMethod,
                    type: 'PRODUCT',
                    notes: notes || `Venta de productos - Ticket #${sale.id}`,
                    cashSessionId: openSession ? openSession.id : null
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
        const sale = await prisma.sale.findUnique({
            where: { id: parseInt(req.params.id) },
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
