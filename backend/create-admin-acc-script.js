import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { randomBytes, scryptSync } from 'crypto';
import Administrator from './models/Administrator.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function createAdminAccount() {
    try {
        if (!MONGO_URI) {
            console.error('❌ MONGO_URI not found in .env file');
            process.exit(1);
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const adminEmail = 'admin';
        const adminPassword = 'password123';
        const firstName = 'test.';
        const lastName = 'user';

        // Check if admin already exists
        const existingAdmin = await Administrator.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log(`⚠️  Admin account with email "${adminEmail}" already exists`);
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create new admin account
        const passwordHash = hashPassword(adminPassword);
        const newAdmin = await Administrator.create({
            firstName,
            lastName,
            email: adminEmail,
            passwordHash
        });

        console.log('✅ Admin account created successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔐 Password:', adminPassword);
        console.log('👤 Name:', `${firstName} ${lastName}`);
        console.log('\n⚠️  Please change this password after your first login.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin account:', error instanceof Error ? error.message : error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createAdminAccount();
