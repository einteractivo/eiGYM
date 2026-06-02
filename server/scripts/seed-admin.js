// Cargar variables de entorno (DATABASE_URL)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('--- eiGYM: Inicialización de Sistema ---');

    const adminEmail = 'admin@eigym.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 1. Crear o actualizar SuperAdmin
    const superAdmin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            role: 'SUPERADMIN',
            name: 'Super Admin',
            gymId: null // SuperAdmins don't belong to a specific gym
        },
        create: {
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'SUPERADMIN',
            gymId: null
        }
    });
    console.log(`✅ SuperAdmin listo: ${adminEmail} / ${adminPassword}`);

    // 2. Crear Gimnasio por defecto si no hay ninguno
    const gymCount = await prisma.gym.count();
    if (gymCount === 0) {
        console.log('Creando gimnasio por defecto...');
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 año de suscripción

        const defaultGym = await prisma.gym.create({
            data: {
                name: 'Gimnasio Demo',
                slug: 'demo-gym',
                email: 'demo@eigym.com',
                active: true,
                subscriptionPlan: 'ANNUAL',
                subscriptionExpiresAt: expiresAt,
                subscriptionAmount: "0",
                subscriptionDescription: "Gimnasio de demostración inicial"
            }
        });

        // Vincular al SuperAdmin al gimnasio demo para que tenga algo que ver al loguear
        // Aunque los SuperAdmins pueden ver todo, a veces el frontend espera un gymId inicial
        await prisma.user.update({
            where: { id: superAdmin.id },
            data: { gymId: defaultGym.id }
        });

        // Crear settings básicas para el gym demo
        await prisma.setting.createMany({
            data: [
                { gymId: defaultGym.id, key: 'gym_name', value: 'Gimnasio Demo' },
                { gymId: defaultGym.id, key: 'currency', value: 'S/' }
            ]
        });

        console.log('✅ Gimnasio "demo-gym" creado con éxito.');
    }

    console.log('--- Inicialización completa ---');
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
