const { PrismaClient } = require('@prisma/client');
const { getGymId } = require('./tenantContext');

let prismaInstance = null;

function getPrisma() {
    if (!prismaInstance) {
        // Inicialización estándar de Prisma (Usa engineType = "library")
        prismaInstance = new PrismaClient().$extends({
            query: {
                $allModels: {
                    async $allOperations({ model, operation, args, query }) {
                        
                        const gymId = getGymId();
                        const tenantModels = [
                            'User', 'CashSession', 'GymClass', 'Plan', 'Member', 
                            'Payment', 'Product', 'Sale', 'Equipment', 'Setting', 'SpecialClass'
                        ];

                        if (gymId && tenantModels.includes(model)) {
                            // Inyectar gymId en lecturas y actualizaciones
                            if (['findFirst', 'findMany', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                                args.where = args.where || {};
                                if (args.where.gymId === undefined) {
                                    args.where.gymId = gymId;
                                }
                            }
                            // Inyectar gymId en creaciones
                            if (['create', 'createMany'].includes(operation)) {
                                if (Array.isArray(args.data)) {
                                    args.data.forEach(item => {
                                        if (item.gymId === undefined) item.gymId = gymId;
                                    });
                                } else {
                                    if (args.data.gymId === undefined) {
                                        args.data.gymId = gymId;
                                    }
                                }
                            }
                        }
                        return query(args);
                    }
                }
            }
        });
        console.log("[Prisma] Inicializado en modo estándar (Prisma 6 Library Engine)");
    }
    return prismaInstance;
}

const prismaProxy = new Proxy({}, {
    get(target, prop) {
        const client = getPrisma();
        if (typeof client[prop] === 'function') {
            return client[prop].bind(client);
        }
        return client[prop];
    }
});

module.exports = prismaProxy;
