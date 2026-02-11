const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'admin@eigym.com';
    const password = 'admin123';

    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing) {
        await prisma.user.update({
            where: { email },
            data: { role: 'SUPERADMIN' }
        });
        console.log('Existing admin updated to SUPERADMIN');
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            name: 'Admin',
            email,
            password: hashedPassword,
            role: 'SUPERADMIN'
        }
    });

    console.log('Admin user created successfully');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
