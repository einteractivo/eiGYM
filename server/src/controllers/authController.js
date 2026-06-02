const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const secret = process.env.JWT_SECRET || 'your_super_secret_key';
const isProd = process.env.NODE_ENV === 'production';

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, gymId } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Nombre, correo y contraseña son requeridos' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo ya está en uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'RECEPTION',
                gymId: gymId ? parseInt(gymId) : null
            }
        });

        res.status(201).json({ message: 'Usuario creado correctamente', userId: user.id });
    } catch (error) {
        console.error('[auth/register]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { gym: true }
        });

        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, gymId: user.gymId },
            secret,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                gymId: user.gymId,
                gym: user.gym
            }
        });
    } catch (error) {
        console.error('[auth/login]', error);
        // Never expose stack traces in production
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { gym: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('[auth/me]', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

exports.registerGym = async (req, res) => {
    try {
        const { gymName, contactName, email, phone, address, notes, password } = req.body;

        if (!gymName || !email || !password) {
            return res.status(400).json({ message: 'Nombre del gimnasio, correo y contraseña son requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.gymRegistration.create({
            data: {
                gymName,
                contactName,
                email,
                phone: phone || '',
                address: address || null,
                notes: notes || null,
                password: hashedPassword,
                status: 'PENDING'
            }
        });

        res.status(201).json({
            message: 'Solicitud de registro enviada con éxito. Nos pondremos en contacto contigo pronto.'
        });
    } catch (error) {
        console.error('[auth/register-gym]', error);
        res.status(500).json({ message: 'Error al procesar el registro' });
    }
};
