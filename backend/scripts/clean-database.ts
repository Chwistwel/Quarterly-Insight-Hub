import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not found in .env file');
      process.exit(1);
    }

    console.log('Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('Connected.');

    console.log('Clearing all data except Administrator accounts...');

    const deletions: { label: string; count: number }[] = [];

    const studentCount = await prisma.student.deleteMany();
    deletions.push({ label: 'Student', count: studentCount.count });

    const teacherItemAnalysisCount = await prisma.teacherItemAnalysis.deleteMany();
    deletions.push({ label: 'TeacherItemAnalysis', count: teacherItemAnalysisCount.count });

    const tosHistoryCount = await prisma.tosBlueprintHistory.deleteMany();
    deletions.push({ label: 'TosBlueprintHistory', count: tosHistoryCount.count });

    const tosBlueprintCount = await prisma.tosBlueprint.deleteMany();
    deletions.push({ label: 'TosBlueprint', count: tosBlueprintCount.count });

    const teacherReportCount = await prisma.teacherReport.deleteMany();
    deletions.push({ label: 'TeacherReport', count: teacherReportCount.count });

    const teacherUploadMetaCount = await prisma.teacherUploadMeta.deleteMany();
    deletions.push({ label: 'TeacherUploadMeta', count: teacherUploadMetaCount.count });

    const classSectionCount = await prisma.classSection.deleteMany();
    deletions.push({ label: 'ClassSection', count: classSectionCount.count });

    const teacherCount = await prisma.teacher.deleteMany();
    deletions.push({ label: 'Teacher', count: teacherCount.count });

    console.log('\nDeleted records:');
    for (const { label, count } of deletions) {
      console.log(`  ${label}: ${count}`);
    }

    const adminCount = await prisma.administrator.count();
    console.log(`\nPreserved Administrator accounts: ${adminCount}`);

    console.log('\nDatabase cleaned successfully.');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning database:', error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

cleanDatabase();
