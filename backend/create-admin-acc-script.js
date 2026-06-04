import dotenv from 'dotenv';
import { randomBytes, scryptSync } from 'crypto';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || '';
const prisma = new PrismaClient();

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function createAdminAccount() {
    try {
        if (!DATABASE_URL) {
            console.error('❌ DATABASE_URL not found in .env file');
            process.exit(1);
        }

        console.log('🔗 Connecting to PostgreSQL...');
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL');

        const adminEmail = 'admin';
        const adminPassword = 'password123';
        const firstName = 'test.';
        const lastName = 'user';

        // Check if admin already exists
        const existingAdmin = await prisma.administrator.findFirst({ where: { email: adminEmail } });
        if (existingAdmin) {
            console.log(`⚠️  Admin account with email "${adminEmail}" already exists`);
            await prisma.$disconnect();
            process.exit(0);
        }

        // Create new admin account
        const passwordHash = hashPassword(adminPassword);
        const newAdmin = await prisma.administrator.create({
            data: {
                firstName,
                lastName,
                email: adminEmail,
                passwordHash
            }
        });

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔐 Password:', adminPassword);
        console.log('👤 Name:', `${firstName} ${lastName}`);
        console.log('\n⚠️  Please change this password after your first login.');

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error instanceof Error ? error.message : error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

createAdminAccount();
