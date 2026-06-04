import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
const prisma = new PrismaClient();

async function migrate() {
    if (!MONGO_URI) {
        console.error('❌ MONGO_URI not found in .env');
        process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🔗 Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('❌ MongoDB database not available');
        process.exit(1);
    }

    // 1. Migrate administrators
    console.log('\n📋 Migrating administrators...');
    const adminDocs = await db.collection('administrators').find({}).toArray();
    for (const doc of adminDocs) {
        await prisma.administrator.upsert({
            where: { email: doc.email },
            update: {
                firstName: doc.firstName,
                lastName: doc.lastName,
                passwordHash: doc.passwordHash,
            },
            create: {
                id: doc._id?.toString() ?? undefined,
                firstName: doc.firstName,
                lastName: doc.lastName,
                email: doc.email,
                passwordHash: doc.passwordHash,
            }
        });
    }
    console.log(`   ✅ ${adminDocs.length} administrators migrated`);

    // 2. Migrate teachers
    console.log('\n📋 Migrating teachers...');
    const teacherDocs = await db.collection('teachers').find({}).toArray();
    for (const doc of teacherDocs) {
        await prisma.teacher.upsert({
            where: { email: doc.email },
            update: {
                firstName: doc.firstName,
                lastName: doc.lastName,
                passwordHash: doc.passwordHash,
                subject: doc.subject ?? '',
                className: doc.className ?? '',
                averageScore: doc.averageScore ?? 0,
                passRate: doc.passRate ?? 0,
            },
            create: {
                id: doc._id?.toString() ?? undefined,
                firstName: doc.firstName,
                lastName: doc.lastName,
                email: doc.email,
                passwordHash: doc.passwordHash,
                subject: doc.subject ?? '',
                className: doc.className ?? '',
                averageScore: doc.averageScore ?? 0,
                passRate: doc.passRate ?? 0,
            }
        });
    }
    console.log(`   ✅ ${teacherDocs.length} teachers migrated`);

    // 3. Migrate class_sections
    console.log('\n📋 Migrating class sections...');
    const classDocs = await db.collection('class_sections').find({}).toArray();
    for (const doc of classDocs) {
        await prisma.classSection.create({
            data: {
                id: doc._id?.toString() ?? undefined,
                className: doc.className,
                gradeLevel: doc.gradeLevel,
                section: doc.section,
                subject: doc.subject,
                teacherName: doc.teacherName,
                studentCount: doc.studentCount ?? 0,
            }
        });
    }
    console.log(`   ✅ ${classDocs.length} class sections migrated`);

    // 4. Migrate students
    console.log('\n📋 Migrating students...');
    const studentDocs = await db.collection('students').find({}).toArray();
    for (const doc of studentDocs) {
        await prisma.student.create({
            data: {
                id: doc._id?.toString() ?? undefined,
                classId: doc.classId,
                teacherEmail: doc.teacherEmail,
                studentNo: doc.studentNo ?? '',
                name: doc.name,
                firstName: doc.firstName ?? '',
                middleInitial: doc.middleInitial ?? '',
                lastName: doc.lastName ?? '',
                gender: doc.gender ?? '',
                grade: doc.grade,
                section: doc.section,
                subject: doc.subject,
                q1Score: doc.q1Score ?? 0,
                q2Score: doc.q2Score ?? 0,
                q3Score: doc.q3Score ?? 0,
                q4Score: doc.q4Score ?? 0,
                ranking: doc.ranking ?? 0,
            }
        });
    }
    console.log(`   ✅ ${studentDocs.length} students migrated`);

    // 5. Migrate teacher_tos_blueprints
    console.log('\n📋 Migrating TOS blueprints...');
    const tosDocs = await db.collection('teacher_tos_blueprints').find({}).toArray();
    for (const doc of tosDocs) {
        await prisma.tosBlueprint.create({
            data: {
                id: doc._id?.toString() ?? undefined,
                teacherEmail: doc.teacherEmail,
                schoolYear: doc.schoolYear,
                quarter: doc.quarter,
                classValue: doc.classValue,
                subject: doc.subject,
                totalDays: doc.totalDays ?? 0,
                totalItems: doc.totalItems ?? 0,
                objectiveCount: doc.objectiveCount ?? 0,
                bloomWeights: doc.bloomWeights ?? {},
                rows: doc.rows ?? [],
                latestHistoryVersion: doc.latestHistoryVersion ?? 0,
            }
        });
    }
    console.log(`   ✅ ${tosDocs.length} TOS blueprints migrated`);

    // 6. Migrate teacher_tos_blueprint_history
    console.log('\n📋 Migrating TOS blueprint history...');
    const tosHistoryDocs = await db.collection('teacher_tos_blueprint_history').find({}).toArray();
    for (const doc of tosHistoryDocs) {
        await prisma.tosBlueprintHistory.create({
            data: {
                id: doc._id?.toString() ?? undefined,
                teacherEmail: doc.teacherEmail,
                schoolYear: doc.schoolYear,
                quarter: doc.quarter,
                classValue: doc.classValue,
                subject: doc.subject,
                version: doc.version,
                savedAt: new Date(doc.savedAt),
                totalDays: doc.totalDays ?? 0,
                totalItems: doc.totalItems ?? 0,
                objectiveCount: doc.objectiveCount ?? 0,
                bloomWeights: doc.bloomWeights ?? {},
                rows: doc.rows ?? [],
            }
        });
    }
    console.log(`   ✅ ${tosHistoryDocs.length} TOS blueprint history entries migrated`);

    // 7. Migrate teacher_item_analysis
    console.log('\n📋 Migrating teacher item analysis...');
    const itemAnalysisDocs = await db.collection('teacher_item_analysis').find({}).toArray();
    for (const doc of itemAnalysisDocs) {
        await prisma.teacherItemAnalysis.create({
            data: {
                class: doc.class ?? '',
                subject: doc.subject ?? '',
                quarter: doc.quarter ?? '',
                teacherEmail: doc.teacherEmail ?? '',
                timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
                summary: doc.summary ?? {},
                items: doc.items ?? [],
                studentResults: doc.studentResults ?? [],
                studentItemResults: doc.studentItemResults ?? [],
                studentIdentityLinks: doc.studentIdentityLinks ?? [],
                totalStudents: doc.totalStudents ?? 0,
            }
        });
    }
    console.log(`   ✅ ${itemAnalysisDocs.length} item analysis records migrated`);

    // 8. Migrate teacher_upload_meta (optional)
    console.log('\n📋 Migrating teacher upload meta...');
    const uploadMetaDocs = await db.collection('teacher_upload_meta').find({}).toArray();
    for (const doc of uploadMetaDocs) {
        await prisma.teacherUploadMeta.create({
            data: {
                quarters: doc.quarters ?? ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"],
                fileFormats: doc.fileFormats ?? ["CSV", "Excel"],
                requiredColumns: doc.requiredColumns ?? ["Student ID", "Student Name", "Item Responses (1-50)", "Answer Key"],
                processingTime: doc.processingTime ?? "Analysis typically takes 5-10 minutes depending on the number of students.",
            }
        });
    }
    console.log(`   ✅ ${uploadMetaDocs.length} upload meta records migrated`);

    // 9. Migrate teacher_reports (optional)
    console.log('\n📋 Migrating teacher reports...');
    const reportDocs = await db.collection('teacher_reports').find({}).toArray();
    for (const doc of reportDocs) {
        await prisma.teacherReport.create({
            data: {
                actions: doc.actions ?? [],
                reports: doc.reports ?? [],
            }
        });
    }
    console.log(`   ✅ ${reportDocs.length} report records migrated`);

    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('\n✅ Migration complete!');
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
