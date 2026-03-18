import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import Teacher from './models/Teacher.js';
import Administrator from './models/Administrator.js';
import ClassSection from './models/ClassSection.js';
import Student from './models/Student.js';

// 1. Load environment variables from .env file
dotenv.config();

// 2. Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || '';

// 3. Middleware
// Allow the frontend to talk to the backend
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
// Parse incoming JSON data
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

type ComputedItem = {
    item: string;
    difficulty: number;
    discrimination: number;
    interpretation: string;
};

type UserRole = 'teacher' | 'administrator';
type RequestWithFile = Request & {
    file?: {
        buffer: Buffer;
        originalname?: string;
        mimetype?: string;
    };
};

type MemoryUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    subject?: string;
    className?: string;
    averageScore?: number;
    passRate?: number;
};

type PersistedUser = {
    _id?: unknown;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash?: string;
    subject?: string;
    className?: string;
    averageScore?: number;
    passRate?: number;
};

type CredentialUserRecord = {
    _id?: unknown;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    subject?: string;
    className?: string;
    averageScore?: number;
    passRate?: number;
};

type TeacherListItem = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
    className: string;
    averageScore: number;
    passRate: number;
};

type MemoryClass = {
    id: string;
    className: string;
    gradeLevel: string;
    section: string;
    subject: string;
    teacherName: string;
    studentCount: number;
};

type ClassRecord = {
    _id?: unknown;
    id?: string;
    className: string;
    gradeLevel: string;
    section: string;
    subject: string;
    teacherName: string;
    studentCount: number;
};

type ClassListItem = {
    id: string;
    className: string;
    gradeLevel: string;
    section: string;
    subject: string;
    teacherName: string;
    studentCount: number;
};

type MemoryStudent = {
    id: string;
    classId: string;
    teacherEmail: string;
    name: string;
    firstName: string;
    middleInitial: string;
    lastName: string;
    gender: string;
    grade: string;
    section: string;
    subject: string;
    q1Score: number;
    q2Score: number;
    q3Score: number;
    q4Score: number;
};

type StudentRecord = {
    _id?: unknown;
    id?: string;
    classId: string;
    teacherEmail: string;
    name: string;
    firstName?: string;
    middleInitial?: string;
    lastName?: string;
    gender?: string;
    grade: string;
    section: string;
    subject: string;
    q1Score?: number;
    q2Score?: number;
    q3Score?: number;
    q4Score?: number;
};

type TeacherPerformanceRow = {
    id: string;
    name: string;
    subject: string;
    classes: number;
    students: number;
    avgScore: number;
    passRate: number;
    uploadStatus: 'On Time' | 'Delayed';
};

type TeacherPerformanceResponse = {
    kpis: {
        totalTeachers: number;
        avgTeacherScore: number;
        onTimeUploadsPercent: number;
        onTimeUploadsCount: number;
        topPerformerName: string;
        topPerformerScore: number;
    };
    departmentBars: Array<{
        label: string;
        value: number;
    }>;
    teachers: TeacherPerformanceRow[];
};

type SchoolOverviewSummaryRow = {
    gradeLevel: string;
    averageScore: number;
    students: number;
    passRate: number;
    status: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
};

type SchoolOverviewResponse = {
    kpis: {
        schoolAverage: number;
        overallPassRate: number;
        totalStudents: number;
        activeTeachers: number;
    };
    gradeOptions: Array<{ id: string; label: string }>;
    gradeBars: Array<{ label: string; value: number }>;
    subjectBars: Array<{ label: string; value: number }>;
    gradeSummary: SchoolOverviewSummaryRow[];
};

type AdminItemAnalysisRow = {
    itemNo: number;
    difficultyIndex: number;
    discriminationIndex: number;
    interpretation: string;
    status: 'excellent' | 'good' | 'fair' | 'poor';
};

type AdminItemAnalysisResponse = {
    title: string;
    classOptions: string[];
    classSubjectMap: Record<string, string[]>;
    subjectOptions: string[];
    selectedClass: string;
    selectedSubject: string;
    classAverage: string;
    averageIndex: string;
    totalStudents: number;
    rows: AdminItemAnalysisRow[];
};

type UserLookupResult<TUser extends PersistedUser = PersistedUser> = {
    role: UserRole;
    user: TUser;
};

const USE_IN_MEMORY_AUTH_FALLBACK = (process.env.USE_IN_MEMORY_AUTH_FALLBACK ?? 'true').toLowerCase() !== 'false';
const USER_ROLES: UserRole[] = ['teacher', 'administrator'];
const memoryUsersByRole: Record<UserRole, Map<string, MemoryUser>> = {
    teacher: new Map<string, MemoryUser>(),
    administrator: new Map<string, MemoryUser>()
};
const memoryClasses = new Map<string, MemoryClass>();
const memoryStudents = new Map<string, MemoryStudent>();

function isSupportedRole(role: unknown): role is UserRole {
    return role === 'teacher' || role === 'administrator';
}

function getModelByRole(role: UserRole) {
    return role === 'teacher' ? Teacher : Administrator;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function isDatabaseReady(): boolean {
    return mongoose.connection.readyState === 1;
}

function getMemoryStoreByRole(role: UserRole): Map<string, MemoryUser> {
    return memoryUsersByRole[role];
}

function findMemoryUsersByEmail(normalizedEmail: string): UserLookupResult<MemoryUser>[] {
    return USER_ROLES.flatMap((role) => {
        const user = getMemoryStoreByRole(role).get(normalizedEmail);
        return user ? [{ role, user }] : [];
    });
}

async function findDatabaseUsersByEmail(normalizedEmail: string): Promise<UserLookupResult[]> {
    const matches: UserLookupResult[] = [];

    await Promise.all(
        USER_ROLES.map(async (role) => {
            const UserModel = getModelByRole(role) as mongoose.Model<any>;
            const user = await UserModel.findOne({ email: normalizedEmail }).lean() as PersistedUser | null;

            if (user) {
                matches.push({ role, user });
            }
        })
    );

    return matches;
}

function buildAuthUser(role: UserRole, user: PersistedUser) {
    return {
        id: user._id ?? user.id,
        role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    };
}

function buildTeacherListItem(user: PersistedUser): TeacherListItem {
    return {
        id: String(user._id ?? user.id ?? user.email),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subject: user.subject ?? 'Not assigned',
        className: user.className ?? 'Not assigned',
        averageScore: typeof user.averageScore === 'number' ? user.averageScore : 0,
        passRate: typeof user.passRate === 'number' ? user.passRate : 0
    };
}

function normalizeTeacherDisplayName(teacherName: string): string {
    return teacherName.trim().toLowerCase();
}

function buildTeacherListWithClassAssignments(
    teachers: PersistedUser[],
    classRecords: Array<Pick<ClassRecord, 'gradeLevel' | 'section' | 'subject' | 'teacherName'>>
): TeacherListItem[] {
    const latestAssignmentByTeacher = new Map<string, { className: string; subject: string }>();

    for (const classItem of classRecords) {
        const normalizedTeacherName = normalizeTeacherDisplayName(classItem.teacherName);

        if (!normalizedTeacherName) {
            continue;
        }

        latestAssignmentByTeacher.set(normalizedTeacherName, {
            className: buildClassLabel(classItem.gradeLevel, classItem.section),
            subject: classItem.subject
        });
    }

    return teachers.map((teacher) => {
        const teacherItem = buildTeacherListItem(teacher);
        const assignment = latestAssignmentByTeacher.get(
            normalizeTeacherDisplayName(getTeacherDisplayNameFromUser(teacher))
        );

        return {
            ...teacherItem,
            subject: assignment?.subject ?? 'Not assigned',
            className: assignment?.className ?? 'Not assigned'
        };
    });
}

function buildClassListItem(classItem: ClassRecord): ClassListItem {
    return {
        id: String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`),
        className: classItem.className,
        gradeLevel: classItem.gradeLevel,
        section: classItem.section,
        subject: classItem.subject,
        teacherName: classItem.teacherName,
        studentCount: classItem.studentCount
    };
}

function buildClassLabel(gradeLevel: string, section: string): string {
    return `${gradeLevel} - ${section}`;
}

function parseTeacherDisplayName(teacherName: string): { firstName: string; lastName: string } {
    const parts = teacherName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
}

function getTeacherDisplayNameFromUser(user: { firstName?: string; lastName?: string }): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
}

function getLatestMemoryClassForTeacher(teacherName: string): MemoryClass | undefined {
    const normalizedTeacherName = teacherName.trim().toLowerCase();
    const matchingClasses = Array.from(memoryClasses.values())
        .filter((classItem) => classItem.teacherName.trim().toLowerCase() === normalizedTeacherName);

    return matchingClasses[matchingClasses.length - 1];
}

function syncMemoryTeacherAssignmentByName(teacherName: string): void {
    const normalizedTeacherName = teacherName.trim().toLowerCase();
    const assignedTeacher = Array.from(getMemoryStoreByRole('teacher').values())
        .find((teacher) => getTeacherDisplayNameFromUser(teacher).toLowerCase() === normalizedTeacherName);

    if (!assignedTeacher) {
        return;
    }

    const latestClass = getLatestMemoryClassForTeacher(teacherName);

    if (!latestClass) {
        assignedTeacher.className = '';
        assignedTeacher.subject = '';
        return;
    }

    assignedTeacher.className = buildClassLabel(latestClass.gradeLevel, latestClass.section);
    assignedTeacher.subject = latestClass.subject;
}

async function syncDatabaseTeacherAssignmentByName(
    TeacherModel: mongoose.Model<CredentialUserRecord>,
    ClassSectionModel: mongoose.Model<ClassRecord>,
    teacherName: string
): Promise<void> {
    const parsedTeacherName = parseTeacherDisplayName(teacherName);

    if (!parsedTeacherName.firstName || !parsedTeacherName.lastName) {
        return;
    }

    const teacher = await TeacherModel.findOne({
        firstName: parsedTeacherName.firstName,
        lastName: parsedTeacherName.lastName
    });

    if (!teacher) {
        return;
    }

    const latestClass = await ClassSectionModel.findOne({ teacherName: teacherName.trim() })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

    if (!latestClass) {
        teacher.className = '';
        teacher.subject = '';
        await teacher.save();
        return;
    }

    teacher.className = buildClassLabel(latestClass.gradeLevel, latestClass.section);
    teacher.subject = latestClass.subject;
    await teacher.save();
}

function hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
    const [salt, originalHash] = storedHash.split(':');

    if (!salt || !originalHash) {
        return false;
    }

    const passwordHash = scryptSync(password, salt, 64);
    const savedHashBuffer = Buffer.from(originalHash, 'hex');

    if (passwordHash.byteLength !== savedHashBuffer.byteLength) {
        return false;
    }

    return timingSafeEqual(passwordHash, savedHashBuffer);
}

function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (character === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    values.push(current.trim());
    return values;
}

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    const sum = values.reduce((runningTotal, value) => runningTotal + value, 0);
    return sum / values.length;
}

function variance(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }

    const mean = average(values);
    const squaredDiffs = values.map((value) => (value - mean) ** 2);
    return average(squaredDiffs);
}

function pearsonCorrelation(first: number[], second: number[]): number {
    if (first.length !== second.length || first.length === 0) {
        return 0;
    }

    const firstMean = average(first);
    const secondMean = average(second);

    let numerator = 0;
    let firstDenominator = 0;
    let secondDenominator = 0;

    for (let index = 0; index < first.length; index += 1) {
        const firstValue = first[index];
        const secondValue = second[index];

        if (firstValue === undefined || secondValue === undefined) {
            continue;
        }

        const firstDiff = firstValue - firstMean;
        const secondDiff = secondValue - secondMean;
        numerator += firstDiff * secondDiff;
        firstDenominator += firstDiff ** 2;
        secondDenominator += secondDiff ** 2;
    }

    const denominator = Math.sqrt(firstDenominator * secondDenominator);

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}

function interpretationFromDiscrimination(discrimination: number): string {
    if (discrimination >= 0.4) {
        return 'Excellent';
    }

    if (discrimination >= 0.3) {
        return 'Good';
    }

    if (discrimination >= 0.2) {
        return 'Fair';
    }

    return 'Poor';
}

function computeItemAnalysis(csvText: string) {
    const rows = csvText
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (rows.length < 2) {
        throw new Error('File must include a header row and at least one data row.');
    }

    const headerRow = rows[0];

    if (!headerRow) {
        throw new Error('Header row is missing.');
    }

    const headers = parseCsvLine(headerRow).map((header) => header.trim());
    const lowerHeaders = headers.map((header) => header.toLowerCase());

    const commonNonItemColumns = new Set([
        'student',
        'student_id',
        'studentid',
        'id',
        'name',
        'section',
        'grade',
        'class',
        'subject',
        'quarter',
        'total',
        'total_score',
        'score_total'
    ]);

    const likelyItemIndexes = headers
        .map((header, index) => ({ header, index }))
        .filter(({ header, index }) => {
            const lowerHeader = lowerHeaders[index] ?? '';
            const looksLikeItem = /^q\d+$/i.test(header) || /^item\s*\d+$/i.test(header) || /^item_?\d+$/i.test(lowerHeader);
            return looksLikeItem || !commonNonItemColumns.has(lowerHeader);
        })
        .map(({ index }) => index);

    const rawRowValues = rows.slice(1).map((row) => parseCsvLine(row));

    const numericColumnIndexes = likelyItemIndexes.filter((index) => {
        const values = rawRowValues
            .map((values) => Number(values[index] ?? Number.NaN))
            .filter((value) => Number.isFinite(value));

        return values.length > 0;
    });

    if (numericColumnIndexes.length === 0) {
        throw new Error('No numeric item columns were detected. Expected columns like Q1,Q2,Q3 or Item1,Item2.');
    }

    const normalizedRows: number[][] = rawRowValues.map((rowValues) =>
        numericColumnIndexes.map((index) => {
            const parsed = Number(rowValues[index] ?? Number.NaN);
            return Number.isFinite(parsed) ? parsed : 0;
        })
    );

    const columnMaxima = numericColumnIndexes.map((_, columnIndex) => {
        const values = normalizedRows.map((row) => row[columnIndex] ?? 0);
        const maxValue = Math.max(...values, 1);
        return maxValue <= 0 ? 1 : maxValue;
    });

    const scaledRows = normalizedRows.map((row) =>
        row.map((value, columnIndex) => {
            const scaled = value / (columnMaxima[columnIndex] ?? 1);
            return Math.min(1, Math.max(0, scaled));
        })
    );

    const totals = scaledRows.map((row) => row.reduce((runningTotal, value) => runningTotal + value, 0));

    const computedItems: ComputedItem[] = numericColumnIndexes.map((index, columnIndex) => {
        const headerValue = headers[index] ?? `Q${columnIndex + 1}`;
        const itemName = /^q\d+$/i.test(headerValue) ? headerValue.toUpperCase() : `Q${columnIndex + 1}`;
        const itemValues = scaledRows.map((row) => row[columnIndex] ?? 0);
        const totalWithoutItem = scaledRows.map((row, rowIndex) => (totals[rowIndex] ?? 0) - (row[columnIndex] ?? 0));
        const difficulty = average(itemValues);
        const discrimination = pearsonCorrelation(itemValues, totalWithoutItem);

        return {
            item: itemName,
            difficulty,
            discrimination,
            interpretation: interpretationFromDiscrimination(discrimination)
        };
    });

    const sumPQ = computedItems.reduce((runningTotal, item) => {
        const p = item.difficulty;
        const q = 1 - p;
        return runningTotal + (p * q);
    }, 0);

    const totalVariance = variance(totals);
    const k = computedItems.length;
    const reliability = k > 1 && totalVariance > 0
        ? (k / (k - 1)) * (1 - (sumPQ / totalVariance))
        : 0;

    const averageDifficulty = average(computedItems.map((item) => item.difficulty));
    const averageDiscrimination = average(computedItems.map((item) => item.discrimination));

    return {
        summary: {
            totalItems: k,
            avgDifficulty: Number(averageDifficulty.toFixed(2)),
            avgDiscrimination: Number(averageDiscrimination.toFixed(2)),
            reliability: Number(Math.max(-1, Math.min(1, reliability)).toFixed(2))
        },
        items: computedItems.map((item) => ({
            ...item,
            difficulty: Number(item.difficulty.toFixed(2)),
            discrimination: Number(item.discrimination.toFixed(2))
        }))
    };
}

// 4. Database Connection
if (!MONGO_URI) {
    console.error("Error: MONGO_URI is not defined in .env file");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

async function fetchCollectionDocument<T>(collectionName: string): Promise<T | null> {
    const db = mongoose.connection.db;

    if (!db) {
        return null;
    }

    return db.collection(collectionName).findOne({}) as Promise<T | null>;
}

// 5. Routes

// Health Check Route (Root)
app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

// Example API Route
app.get('/api/example', (req: Request, res: Response) => {
    res.json({ message: 'Hello from TypeScript Server!' });
});

app.get('/api/analytics', (_req: Request, res: Response) => {
    res.json({
        title: 'Advanced Analytics',
        description: 'Connect your data sources to start generating analytics insights.'
    });
});

app.get('/api/dashboard', (_req: Request, res: Response) => {
    res.json({
        metrics: {
            totalStudents: 0,
            averageScore: 0,
            subjectsAssessed: 0,
            highPerformers: 0,
            trends: {
                students: 'No trend data available',
                score: 'No trend data available',
                subjects: 'No trend data available',
                performers: 'No trend data available'
            }
        },
        gradeDistribution: { a: 0, b: 0, c: 0, d: 0, f: 0 },
        subjectPerformance: [],
        activities: []
    });
});

app.get('/api/performance-metrics', (_req: Request, res: Response) => {
    res.json({
        kpiMetrics: {
            overallAverage: 0,
            passingRate: 0,
            atRiskStudents: 0,
            trends: {
                average: 'No trend data available',
                passing: 'No trend data available',
                atRisk: 'No trend data available'
            }
        },
        subjectData: [],
        topPerformers: [],
        supportStudents: [],
        insights: []
    });
});

app.get('/api/quarterly-reports', (_req: Request, res: Response) => {
    res.json({
        templates: [],
        generatedReports: [],
        components: [],
        statistics: {
            totalReports: 0,
            downloads: 0,
            automatedSchedules: 0,
            accuracy: 0
        }
    });
});

app.get('/api/student-records', (req: Request, res: Response) => {
    const rawPage = Number(req.query.page);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    res.json({
        students: [],
        kpiCounts: {
            total: 0,
            excellent: 0,
            good: 0,
            satisfactory: 0,
            needsSupport: 0
        },
        currentPage: page,
        totalPages: 1
    });
});

app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body as {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        role?: string;
    };

    void firstName;
    void lastName;
    void email;
    void password;
    void confirmPassword;
    void role;

    return res.status(403).json({
        message: 'Self-signup is disabled. Ask an administrator to create your teacher account.'
    });
});

app.post('/api/admin/teachers', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { firstName, lastName, email, password, confirmPassword, subject, className } = req.body as {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        subject?: string;
        className?: string;
    };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can create teacher accounts.' });
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({ message: 'First name, last name, email/username, password, and confirm password are required.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);
    const normalizedTeacherEmail = normalizeEmail(email);
    const normalizedSubject = subject?.trim() || undefined;
    const normalizedClassName = className?.trim() || undefined;

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const existingFallbackUsers = findMemoryUsersByEmail(normalizedTeacherEmail);

        if (existingFallbackUsers.length > 0) {
            return res.status(409).json({ message: 'An account with this email/username already exists.' });
        }

        const fallbackTeacher: MemoryUser = {
            id: randomBytes(12).toString('hex'),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedTeacherEmail,
            passwordHash: hashPassword(password),
            averageScore: 0,
            passRate: 0,
            ...(normalizedSubject ? { subject: normalizedSubject } : {}),
            ...(normalizedClassName ? { className: normalizedClassName } : {})
        };

        getMemoryStoreByRole('teacher').set(normalizedTeacherEmail, fallbackTeacher);

        return res.status(201).json({
            message: 'Teacher account created successfully (temporary in-memory mode).',
            user: buildAuthUser('teacher', fallbackTeacher),
            teacher: buildTeacherListItem(fallbackTeacher)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can create teacher accounts.' });
        }

        const existingUsers = await findDatabaseUsersByEmail(normalizedTeacherEmail);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'An account with this email/username already exists.' });
        }

        const createdTeacher = await TeacherModel.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedTeacherEmail,
            passwordHash: hashPassword(password),
            averageScore: 0,
            passRate: 0,
            ...(normalizedSubject ? { subject: normalizedSubject } : {}),
            ...(normalizedClassName ? { className: normalizedClassName } : {})
        });

        return res.status(201).json({
            message: 'Teacher account created successfully.',
            user: buildAuthUser('teacher', createdTeacher),
            teacher: buildTeacherListItem(createdTeacher)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create teacher account.';
        return res.status(500).json({ message });
    }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as {
        email?: string;
        password?: string;
    };

    if (!email?.trim() || !password?.trim()) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const matchingFallbackUsers = findMemoryUsersByEmail(normalizedEmail)
            .filter(({ user }) => verifyPassword(password, user.passwordHash));

        if (matchingFallbackUsers.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (matchingFallbackUsers.length > 1) {
            return res.status(409).json({ message: 'This email is assigned to multiple roles. Contact support to resolve the duplicate account.' });
        }

        const authenticatedUser = matchingFallbackUsers[0];

        if (!authenticatedUser) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        return res.json({
            message: 'Login successful (temporary in-memory mode).',
            user: buildAuthUser(authenticatedUser.role, authenticatedUser.user)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const matchingUsers = (await findDatabaseUsersByEmail(normalizedEmail))
            .filter(({ user }) => typeof user.passwordHash === 'string' && verifyPassword(password, user.passwordHash));

        if (matchingUsers.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (matchingUsers.length > 1) {
            return res.status(409).json({ message: 'This email is assigned to multiple roles. Contact support to resolve the duplicate account.' });
        }

        const authenticatedUser = matchingUsers[0];

        if (!authenticatedUser) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        return res.json({
            message: 'Login successful.',
            user: buildAuthUser(authenticatedUser.role, authenticatedUser.user)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to login.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/dashboard', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const selectedGradeQuery = typeof req.query.grade === 'string' ? req.query.grade.trim() : '';
    const selectedQuarterQuery = typeof req.query.quarter === 'string' ? req.query.quarter.trim() : '';

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can view dashboard data.' });
    }

    try {
        const normalizedTeacherEmail = normalizeEmail(requesterEmail);
        const normalizeQuarter = (value: string): string => {
            const match = value.match(/(\d+)/);
            if (!match) {
                return value.trim();
            }

            const quarterDigits = match[1] ?? '';
            const quarterNumber = Number.parseInt(quarterDigits, 10);
            if (!Number.isFinite(quarterNumber) || quarterNumber < 1 || quarterNumber > 4) {
                return value.trim();
            }

            return `Q${quarterNumber}`;
        };

        const quarterOrder = new Map<string, number>([
            ['Q1', 1],
            ['Q2', 2],
            ['Q3', 3],
            ['Q4', 4]
        ]);

        type TeacherAssignedClass = {
            id: string;
            classLabel: string;
            studentCount: number;
        };

        let assignedClasses: TeacherAssignedClass[] = [];
        let uploads: Array<Record<string, unknown>> = [];
        let filterQuarterOptions = ['Q1', 'Q2', 'Q3', 'Q4'];

        // Build teacher classes and uploads so dashboard is based on real data.

        if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
            const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

            if (!fallbackTeacher) {
                return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
            }

            const teacherDisplayName = getTeacherDisplayNameFromUser(fallbackTeacher);
            const classes = Array.from(memoryClasses.values())
                .filter((classItem) => classItem.teacherName.trim().toLowerCase() === teacherDisplayName.toLowerCase());

            assignedClasses = classes.map((classItem) => {
                const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
                const studentCount = Array.from(memoryStudents.values()).filter((student) => student.classId === classItem.id).length;
                return {
                    id: classItem.id,
                    classLabel,
                    studentCount
                };
            });
        } else if (isDatabaseReady()) {
            const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
            const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
            const StudentModel = Student as mongoose.Model<StudentRecord>;
            const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

            if (!teacherAccount) {
                return res.status(403).json({ message: 'Only valid teachers can view dashboard data.' });
            }

            const teacherDisplayName = getTeacherDisplayNameFromUser(teacherAccount);
            const classRecords = await ClassSectionModel.find({ teacherName: teacherDisplayName }).lean();

            assignedClasses = await Promise.all(classRecords.map(async (classItem) => {
                const classId = String(classItem._id ?? classItem.id ?? '');
                const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
                const studentCount = classId ? await StudentModel.countDocuments({ classId }) : 0;
                return {
                    id: classId,
                    classLabel,
                    studentCount
                };
            }));

            const database = mongoose.connection.db;
            if (database) {
                uploads = await database.collection('teacher_item_analysis')
                    .find({ teacherEmail: normalizedTeacherEmail })
                    .sort({ timestamp: -1 })
                    .toArray() as Array<Record<string, unknown>>;

                const quartersFromUploads = Array.from(
                    new Set(
                        uploads
                            .map((upload) => normalizeQuarter(String(upload.quarter ?? '').trim()))
                            .filter((quarter) => quarter.length > 0)
                    )
                ).sort((first, second) => {
                    const firstOrder = quarterOrder.get(first) ?? Number.MAX_SAFE_INTEGER;
                    const secondOrder = quarterOrder.get(second) ?? Number.MAX_SAFE_INTEGER;
                    return firstOrder - secondOrder || first.localeCompare(second);
                });

                if (quartersFromUploads.length > 0) {
                    filterQuarterOptions = quartersFromUploads;
                }
            }
        } else {
            return res.status(503).json({
                message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
            });
        }

        const grades = Array.from(new Set(assignedClasses.map((classItem) => classItem.classLabel)));

        const selectedGrade = selectedGradeQuery && grades.includes(selectedGradeQuery)
            ? selectedGradeQuery
            : (grades[0] ?? '');

        const selectedQuarter = selectedQuarterQuery && filterQuarterOptions.includes(selectedQuarterQuery)
            ? selectedQuarterQuery
            : (filterQuarterOptions[0] ?? '');

        const filteredUploads = uploads
            .filter((upload) => (selectedGrade ? String(upload.class ?? '').trim() === selectedGrade : true))
            .filter((upload) => (selectedQuarter ? normalizeQuarter(String(upload.quarter ?? '').trim()) === selectedQuarter : true));

        const averageDifficulty = filteredUploads.length
            ? filteredUploads.reduce((sum, upload) => {
                const summary = upload.summary as Record<string, unknown> | undefined;
                const value = summary?.avgDifficulty;
                return sum + (typeof value === 'number' ? value : 0);
            }, 0) / filteredUploads.length
            : 0;

        const averageDiscrimination = filteredUploads.length
            ? filteredUploads.reduce((sum, upload) => {
                const summary = upload.summary as Record<string, unknown> | undefined;
                const value = summary?.avgDiscrimination;
                return sum + (typeof value === 'number' ? value : 0);
            }, 0) / filteredUploads.length
            : 0;

        const selectedClassStudentCount = selectedGrade
            ? (assignedClasses.find((classItem) => classItem.classLabel === selectedGrade)?.studentCount ?? 0)
            : assignedClasses.reduce((sum, classItem) => sum + classItem.studentCount, 0);

        const totalItemsAnalyzed = filteredUploads.reduce((sum, upload) => {
            const items = upload.items as Array<unknown> | undefined;
            return sum + (Array.isArray(items) ? items.length : 0);
        }, 0);

        const trendByQuarter = new Map<string, { total: number; count: number }>();
        const uploadsForTrend = uploads.filter((upload) => (selectedGrade ? String(upload.class ?? '').trim() === selectedGrade : true));

        for (const upload of uploadsForTrend) {
            const quarter = normalizeQuarter(String(upload.quarter ?? '').trim());
            if (!quarter) {
                continue;
            }

            const summary = upload.summary as Record<string, unknown> | undefined;
            const avgDifficulty = summary?.avgDifficulty;
            const score = typeof avgDifficulty === 'number' ? avgDifficulty * 100 : 0;
            const existing = trendByQuarter.get(quarter);

            if (!existing) {
                trendByQuarter.set(quarter, { total: score, count: 1 });
                continue;
            }

            existing.total += score;
            existing.count += 1;
        }

        const trend = Array.from(trendByQuarter.entries())
            .map(([label, values]) => ({
                label,
                value: values.count ? Math.round(values.total / values.count) : 0
            }))
            .sort((first, second) => {
                const firstOrder = quarterOrder.get(first.label) ?? Number.MAX_SAFE_INTEGER;
                const secondOrder = quarterOrder.get(second.label) ?? Number.MAX_SAFE_INTEGER;
                return firstOrder - secondOrder || first.label.localeCompare(second.label);
            });

        const kpis = [
            {
                label: 'Class Average',
                value: `${(averageDifficulty * 100).toFixed(1)}%`,
                description: selectedGrade || 'All assigned classes'
            },
            {
                label: 'Average Index',
                value: `${(averageDiscrimination * 100).toFixed(1)}%`,
                description: selectedQuarter || 'All quarters'
            },
            {
                label: 'My Students',
                value: selectedClassStudentCount,
                description: selectedGrade || 'All assigned classes'
            },
            {
                label: 'Items Analyzed',
                value: totalItemsAnalyzed,
                description: `${filteredUploads.length} uploaded analysis${filteredUploads.length === 1 ? '' : 'es'}`
            }
        ];

        return res.json({
            title: 'My Dashboard',
            systemLabel: 'QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM',
            filters: {
                grades,
                quarters: filterQuarterOptions
            },
            selectedGrade,
            selectedQuarter,
            kpis,
            trend,
            trendSubtitle: selectedGrade
                ? `Quarterly Performance Trend - ${selectedGrade}`
                : 'Quarterly Performance Trend - All Assigned Classes',
            highlights: [],
            topStudents: [],
            improvementAreas: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load dashboard data.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/item-analysis', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const selectedClassQuery = typeof req.query.class === 'string' ? req.query.class.trim() : '';
    const selectedSubjectQuery = typeof req.query.subject === 'string' ? req.query.subject.trim() : '';

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can view item analysis.' });
    }

    try {
        const db = mongoose.connection.db;
        if (db) {
            const normalizedTeacherEmail = normalizeEmail(requesterEmail);
            const uploads = await db.collection('teacher_item_analysis')
                .find({ teacherEmail: normalizedTeacherEmail })
                .sort({ timestamp: -1 })
                .toArray() as Array<Record<string, unknown>>;

            const classOptions = Array.from(
                new Set(
                    uploads
                        .map((upload) => String(upload.class ?? '').trim())
                        .filter((value) => value.length > 0)
                )
            );

            const selectedClass = selectedClassQuery && classOptions.includes(selectedClassQuery)
                ? selectedClassQuery
                : (classOptions[0] ?? '');

            const uploadsForClass = selectedClass
                ? uploads.filter((upload) => String(upload.class ?? '').trim() === selectedClass)
                : [];

            const subjectOptions = Array.from(
                new Set(
                    uploadsForClass
                        .map((upload) => String(upload.subject ?? '').trim())
                        .filter((value) => value.length > 0)
                )
            );

            const selectedSubject = selectedSubjectQuery && subjectOptions.includes(selectedSubjectQuery)
                ? selectedSubjectQuery
                : (subjectOptions[0] ?? '');

            const selectedAnalysis = uploadsForClass
                .find((upload) => String(upload.subject ?? '').trim() === selectedSubject);

            if (selectedAnalysis) {
                const items = (selectedAnalysis.items as Array<{ item: string; difficulty: number; discrimination: number; interpretation: string }>) ?? [];
                const rows = items.map((item, index) => ({
                    itemNo: index + 1,
                    difficultyIndex: item.difficulty,
                    discriminationIndex: item.discrimination,
                    interpretation: item.interpretation
                }));

                const summary = selectedAnalysis.summary as Record<string, unknown> | undefined;
                const avgDifficulty = typeof summary?.avgDifficulty === 'number' ? summary.avgDifficulty : 0;
                const avgDiscrimination = typeof summary?.avgDiscrimination === 'number' ? summary.avgDiscrimination : 0;

                return res.json({
                    title: `${selectedSubject} - ${selectedClass}`,
                    grade: selectedClass,
                    subject: selectedSubject,
                    classAverage: `${avgDifficulty * 100}%`,
                    averageIndex: `${avgDiscrimination * 100}%`,
                    totalStudents: items.length,
                    classOptions,
                    subjectOptions,
                    selectedClass,
                    selectedSubject,
                    rows
                });
            }

            return res.json({
                classOptions,
                subjectOptions,
                selectedClass,
                selectedSubject,
                rows: []
            });
        }

        // Fallback to empty response
        return res.json({
            classOptions: [],
            subjectOptions: [],
            selectedClass: '',
            selectedSubject: '',
            rows: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load item analysis data.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/upload-meta', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can view upload metadata.' });
    }

    try {
        // Get base metadata
        const baseDocument = await fetchCollectionDocument<Record<string, unknown>>('teacher_upload_meta');
        const baseMetadata: Record<string, unknown> = baseDocument ?? {
            quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
            fileFormats: ['CSV', 'Excel'],
            requiredColumns: ['Student ID', 'Student Name', 'Item Responses (1-50)', 'Answer Key'],
            processingTime: 'Analysis typically takes 5-10 minutes depending on the number of students.'
        };

        const normalizedTeacherEmail = normalizeEmail(requesterEmail);

        // Get teacher's assigned classes and extract unique grade levels and subjects
        let gradeLevels: string[] = [];
        let subjects: string[] = [];
        let classSubjectMap: Record<string, string[]> = {};

        if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
            const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

            if (!fallbackTeacher) {
                return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
            }

            const teacherDisplayName = getTeacherDisplayNameFromUser(fallbackTeacher);
            const classes = Array.from(memoryClasses.values())
                .filter((classItem) => classItem.teacherName.trim().toLowerCase() === teacherDisplayName.toLowerCase());

            const gradeSet = new Set<string>();
            const subjectSet = new Set<string>();

            for (const classItem of classes) {
                const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
                gradeSet.add(classLabel);
                subjectSet.add(classItem.subject);

                if (!classSubjectMap[classLabel]) {
                    classSubjectMap[classLabel] = [];
                }
                if (!classSubjectMap[classLabel].includes(classItem.subject)) {
                    classSubjectMap[classLabel].push(classItem.subject);
                }
            }

            gradeLevels = Array.from(gradeSet);
            subjects = Array.from(subjectSet);
        } else if (isDatabaseReady()) {
            const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
            const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
            const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

            if (!teacherAccount) {
                return res.status(403).json({ message: 'Only valid teachers can view upload metadata.' });
            }

            const teacherDisplayName = getTeacherDisplayNameFromUser(teacherAccount);
            const classRecords = await ClassSectionModel.find({ teacherName: teacherDisplayName }).lean();

            const gradeSet = new Set<string>();
            const subjectSet = new Set<string>();

            for (const classItem of classRecords) {
                const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
                gradeSet.add(classLabel);
                subjectSet.add(classItem.subject);

                if (!classSubjectMap[classLabel]) {
                    classSubjectMap[classLabel] = [];
                }
                if (!classSubjectMap[classLabel].includes(classItem.subject)) {
                    classSubjectMap[classLabel].push(classItem.subject);
                }
            }

            gradeLevels = Array.from(gradeSet);
            subjects = Array.from(subjectSet);
        } else {
            return res.status(503).json({
                message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
            });
        }

        return res.json({
            ...baseMetadata,
            gradeLevels,
            subjects,
            classSubjectMap,
            recentUploads: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load upload metadata.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/reports', async (_req: Request, res: Response) => {
    try {
        const document = await fetchCollectionDocument<Record<string, unknown>>('teacher_reports');

        if (document) {
            return res.json(document);
        }

        return res.json({
            actions: [],
            reports: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load reports data.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/my-classes', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can view assigned classes.' });
    }

    const normalizedTeacherEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

        if (!fallbackTeacher) {
            return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
        }

        const teacherDisplayName = getTeacherDisplayNameFromUser(fallbackTeacher);
        const classRecords = Array.from(memoryClasses.values())
            .filter((classItem) => classItem.teacherName.trim().toLowerCase() === teacherDisplayName.toLowerCase())
            .map((classItem) => ({
                id: classItem.id,
                grade: classItem.gradeLevel,
                section: classItem.section,
                subject: classItem.subject,
                studentCount: 0,
                teacher: classItem.teacherName,
                gradeTag: classItem.gradeLevel
            }));

        const studentCountsByClass = new Map<string, number>();
        for (const student of memoryStudents.values()) {
            if (student.teacherEmail !== normalizedTeacherEmail) {
                continue;
            }

            studentCountsByClass.set(student.classId, (studentCountsByClass.get(student.classId) ?? 0) + 1);
        }

        const classes = classRecords.map((classItem) => ({
            ...classItem,
            studentCount: studentCountsByClass.get(classItem.id) ?? 0
        }));

        return res.json({ classes });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

        if (!teacherAccount) {
            return res.status(403).json({ message: 'Only valid teachers can view assigned classes.' });
        }

        const teacherDisplayName = getTeacherDisplayNameFromUser(teacherAccount);
        const classRecords = await ClassSectionModel.find({ teacherName: teacherDisplayName }).sort({ gradeLevel: 1, section: 1 }).lean();
        const classIds = classRecords.map((classItem) => String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`));
        const studentCounts = await StudentModel.aggregate<{ _id: string; count: number }>([
            {
                $match: {
                    teacherEmail: normalizedTeacherEmail,
                    classId: { $in: classIds }
                }
            },
            {
                $group: {
                    _id: '$classId',
                    count: { $sum: 1 }
                }
            }
        ]);
        const studentCountMap = new Map(studentCounts.map((item) => [item._id, item.count]));

        const classes = classRecords.map((classItem) => {
            const classId = String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`);

            return {
            id: String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`),
            grade: classItem.gradeLevel,
            section: classItem.section,
            subject: classItem.subject,
            studentCount: studentCountMap.get(classId) ?? 0,
            teacher: classItem.teacherName,
            gradeTag: classItem.gradeLevel
            };
        });

        return res.json({ classes });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load assigned classes.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/students', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const classId = typeof req.query.classId === 'string' ? req.query.classId.trim() : '';

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can view student records.' });
    }

    const normalizedTeacherEmail = normalizeEmail(requesterEmail);

    const parseNameParts = (fullName: string): { firstName: string; middleInitial: string; lastName: string } => {
        const tokens = fullName.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
            return { firstName: '', middleInitial: '', lastName: '' };
        }

        if (tokens.length === 1) {
            return { firstName: tokens[0] ?? '', middleInitial: '', lastName: '' };
        }

        const firstName = tokens[0] ?? '';
        const lastName = tokens[tokens.length - 1] ?? '';
        const middleTokens = tokens.slice(1, -1);
        const middleInitial = middleTokens.length > 0 ? (middleTokens[0]?.charAt(0).toUpperCase() ?? '') : '';

        return { firstName, middleInitial, lastName };
    };

    const formatAverage = (student: {
        q1Score?: number;
        q2Score?: number;
        q3Score?: number;
        q4Score?: number;
    }): string => {
        const q1 = typeof student.q1Score === 'number' ? student.q1Score : 0;
        const q2 = typeof student.q2Score === 'number' ? student.q2Score : 0;
        const q3 = typeof student.q3Score === 'number' ? student.q3Score : 0;
        const q4 = typeof student.q4Score === 'number' ? student.q4Score : 0;
        const average = (q1 + q2 + q3 + q4) / 4;
        return `${average.toFixed(1)}%`;
    };

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

        if (!fallbackTeacher) {
            return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
        }

        const students = Array.from(memoryStudents.values())
            .filter((student) => student.teacherEmail === normalizedTeacherEmail)
            .filter((student) => !classId || student.classId === classId)
            .sort((first, second) => first.name.localeCompare(second.name))
            .map((student) => ({
                ...parseNameParts(student.name),
                id: student.id,
                name: student.name,
                gender: student.gender ?? '',
                grade: student.grade,
                section: student.section,
                q1Score: student.q1Score,
                q2Score: student.q2Score,
                q3Score: student.q3Score,
                q4Score: student.q4Score,
                average: formatAverage(student),
                classId: student.classId,
                subject: student.subject
            }));

        const classItem = classId ? memoryClasses.get(classId) : undefined;
        const classLabel = classItem ? `${classItem.gradeLevel} - ${classItem.section} (${classItem.subject})` : 'All Classes';

        return res.json({
            title: 'Student Management',
            systemLabel: 'MANAGE YOUR STUDENTS',
            classLabel,
            students
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

        if (!teacherAccount) {
            return res.status(403).json({ message: 'Only valid teachers can view student records.' });
        }

        const filter: { teacherEmail: string; classId?: string } = { teacherEmail: normalizedTeacherEmail };
        if (classId) {
            filter.classId = classId;
        }

        const studentRecords = await StudentModel.find(filter).sort({ name: 1 }).lean();
        const students = studentRecords.map((student) => ({
            ...parseNameParts(student.name),
            id: String(student._id ?? student.id ?? `${student.classId}-${student.name}`),
            name: student.name,
            gender: student.gender ?? '',
            grade: student.grade,
            section: student.section,
            q1Score: student.q1Score ?? 0,
            q2Score: student.q2Score ?? 0,
            q3Score: student.q3Score ?? 0,
            q4Score: student.q4Score ?? 0,
            average: formatAverage(student),
            classId: student.classId,
            subject: student.subject
        }));

        let classLabel = 'All Classes';
        if (classId) {
            const classRecord = await ClassSectionModel.findOne({ _id: classId }).lean();
            if (classRecord) {
                classLabel = `${classRecord.gradeLevel} - ${classRecord.section} (${classRecord.subject})`;
            }
        }

        return res.json({
            title: 'Student Management',
            systemLabel: 'MANAGE YOUR STUDENTS',
            classLabel,
            students
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load student records.';
        return res.status(500).json({ message });
    }
});

app.post('/teacher/students', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const {
        classId,
        name,
        firstName,
        middleName,
        lastName,
        gender
    } = req.body as {
        classId?: string;
        name?: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        gender?: string;
    };

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can add students.' });
    }

    if (!classId?.trim()) {
        return res.status(400).json({ message: 'Class is required.' });
    }

    const hasStructuredName = Boolean(firstName?.trim() && lastName?.trim());
    const hasSingleName = Boolean(name?.trim());

    if (!hasStructuredName && !hasSingleName) {
        return res.status(400).json({ message: 'Student name is required.' });
    }

    const normalizedTeacherEmail = normalizeEmail(requesterEmail);

    const parseNameParts = (fullName: string): { firstName: string; middleInitial: string; lastName: string } => {
        const tokens = fullName.trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
            return { firstName: '', middleInitial: '', lastName: '' };
        }

        if (tokens.length === 1) {
            return { firstName: tokens[0] ?? '', middleInitial: '', lastName: '' };
        }

        const firstName = tokens[0] ?? '';
        const lastName = tokens[tokens.length - 1] ?? '';
        const middleTokens = tokens.slice(1, -1);
        const middleInitial = middleTokens.length > 0 ? (middleTokens[0]?.charAt(0).toUpperCase() ?? '') : '';

        return { firstName, middleInitial, lastName };
    };

    const middleNameValue = middleName?.trim() ?? '';
    const structuredName = hasStructuredName
        ? `${firstName?.trim() ?? ''}${middleNameValue ? ` ${middleNameValue}` : ''} ${lastName?.trim() ?? ''}`.trim()
        : '';
    const normalizedName = structuredName || (name?.trim() ?? '');
    const nameParts = parseNameParts(normalizedName);
    const normalizedGender = gender?.trim() ?? '';

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

        if (!fallbackTeacher) {
            return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
        }

        const classItem = memoryClasses.get(classId);
        if (!classItem) {
            return res.status(404).json({ message: 'Class not found.' });
        }

        const studentId = randomBytes(12).toString('hex');
        const newStudent: MemoryStudent = {
            id: studentId,
            classId,
            teacherEmail: normalizedTeacherEmail,
            name: normalizedName,
            firstName: nameParts.firstName,
            middleInitial: nameParts.middleInitial,
            lastName: nameParts.lastName,
            gender: normalizedGender,
            grade: classItem.gradeLevel,
            section: classItem.section,
            subject: classItem.subject,
            q1Score: 0,
            q2Score: 0,
            q3Score: 0,
            q4Score: 0
        };

        memoryStudents.set(studentId, newStudent);

        return res.status(201).json({ message: 'Student added successfully.', student: newStudent });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

        if (!teacherAccount) {
            return res.status(403).json({ message: 'Only valid teachers can add students.' });
        }

        const classRecord = await ClassSectionModel.findOne({ _id: classId }).lean();
        if (!classRecord) {
            return res.status(404).json({ message: 'Class not found.' });
        }

        const teacherDisplayName = getTeacherDisplayNameFromUser(teacherAccount);
        if (normalizeTeacherDisplayName(classRecord.teacherName) !== normalizeTeacherDisplayName(teacherDisplayName)) {
            return res.status(403).json({ message: 'You can only add students to your assigned class.' });
        }

        const createdStudent = await StudentModel.create({
            classId,
            teacherEmail: normalizedTeacherEmail,
            name: normalizedName,
            firstName: nameParts.firstName,
            middleInitial: nameParts.middleInitial,
            lastName: nameParts.lastName,
            gender: normalizedGender,
            grade: classRecord.gradeLevel,
            section: classRecord.section,
            subject: classRecord.subject,
            q1Score: 0,
            q2Score: 0,
            q3Score: 0,
            q4Score: 0
        });

        return res.status(201).json({
            message: 'Student added successfully.',
            student: {
                id: String(createdStudent._id),
                classId,
                name: createdStudent.name,
                firstName: createdStudent.firstName,
                middleInitial: createdStudent.middleInitial,
                lastName: createdStudent.lastName,
                gender: createdStudent.gender,
                grade: createdStudent.grade,
                section: createdStudent.section,
                subject: createdStudent.subject,
                q1Score: createdStudent.q1Score,
                q2Score: createdStudent.q2Score,
                q3Score: createdStudent.q3Score,
                q4Score: createdStudent.q4Score
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to add student.';
        return res.status(500).json({ message });
    }
});

app.put('/teacher/students/:studentId', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { studentId } = req.params as { studentId?: string };
    const {
        firstName,
        middleInitial,
        lastName,
        gender,
        q1Score,
        q2Score,
        q3Score,
        q4Score
    } = req.body as {
        firstName?: string;
        middleInitial?: string;
        lastName?: string;
        gender?: string;
        q1Score?: number;
        q2Score?: number;
        q3Score?: number;
        q4Score?: number;
    };

    if (requesterRole !== 'teacher' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only teachers can update students.' });
    }

    if (!studentId?.trim()) {
        return res.status(400).json({ message: 'Student id is required.' });
    }

    if (!firstName?.trim() || !lastName?.trim()) {
        return res.status(400).json({ message: 'First name and last name are required.' });
    }

    const parseScore = (value: unknown): number => {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(100, Math.round(value)));
    };

    const normalizedTeacherEmail = normalizeEmail(requesterEmail);
    const normalizedMiddleInitial = (middleInitial ?? '').trim().slice(0, 1).toUpperCase();
    const normalizedGender = (gender ?? '').trim();
    const normalizedName = `${firstName.trim()}${normalizedMiddleInitial ? ` ${normalizedMiddleInitial}.` : ''} ${lastName.trim()}`.trim();
    const normalizedQ1 = parseScore(q1Score);
    const normalizedQ2 = parseScore(q2Score);
    const normalizedQ3 = parseScore(q3Score);
    const normalizedQ4 = parseScore(q4Score);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackTeacher = getMemoryStoreByRole('teacher').get(normalizedTeacherEmail);

        if (!fallbackTeacher) {
            return res.status(403).json({ message: 'Teacher session is not recognized. Please sign in again.' });
        }

        const existingStudent = memoryStudents.get(studentId);
        if (!existingStudent || existingStudent.teacherEmail !== normalizedTeacherEmail) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        existingStudent.firstName = firstName.trim();
        existingStudent.middleInitial = normalizedMiddleInitial;
        existingStudent.lastName = lastName.trim();
        existingStudent.gender = normalizedGender;
        existingStudent.name = normalizedName;
        existingStudent.q1Score = normalizedQ1;
        existingStudent.q2Score = normalizedQ2;
        existingStudent.q3Score = normalizedQ3;
        existingStudent.q4Score = normalizedQ4;

        return res.json({ message: 'Student updated successfully.' });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const teacherAccount = await TeacherModel.findOne({ email: normalizedTeacherEmail }).lean();

        if (!teacherAccount) {
            return res.status(403).json({ message: 'Only valid teachers can update students.' });
        }

        const existingStudent = await StudentModel.findById(studentId).lean();
        if (!existingStudent || normalizeEmail(existingStudent.teacherEmail) !== normalizedTeacherEmail) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        await StudentModel.updateOne(
            { _id: studentId },
            {
                $set: {
                    name: normalizedName,
                    firstName: firstName.trim(),
                    middleInitial: normalizedMiddleInitial,
                    lastName: lastName.trim(),
                    gender: normalizedGender,
                    q1Score: normalizedQ1,
                    q2Score: normalizedQ2,
                    q3Score: normalizedQ3,
                    q4Score: normalizedQ4
                }
            }
        );

        return res.json({ message: 'Student updated successfully.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update student.';
        return res.status(500).json({ message });
    }
});

app.post('/api/item-analysis/compute', upload.single('file'), async (req: Request, res: Response) => {
    const requestWithFile = req as RequestWithFile;
    const { class: classValue, subject, quarter } = req.body as { class?: string; subject?: string; quarter?: string };
    const requesterEmail = req.header('x-user-email');

    if (!requestWithFile.file) {
        return res.status(400).json({ message: 'No file uploaded. Use form-data field name "file".' });
    }

    try {
        const uploadedFile = requestWithFile.file;
        const fileName = uploadedFile?.originalname?.toLowerCase() ?? '';
        const mimeType = uploadedFile?.mimetype?.toLowerCase() ?? '';
        const isExcelFile = fileName.endsWith('.xlsx')
            || fileName.endsWith('.xls')
            || mimeType.includes('spreadsheetml')
            || mimeType.includes('excel')
            || mimeType === 'application/octet-stream';

        let csvText = '';

        if (isExcelFile) {
            const workbook = XLSX.read(uploadedFile.buffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];

            if (!firstSheetName) {
                throw new Error('Excel file has no worksheet to process.');
            }

            const worksheet = workbook.Sheets[firstSheetName];
            if (!worksheet) {
                throw new Error('Unable to read worksheet from uploaded Excel file.');
            }

            csvText = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
        } else {
            csvText = uploadedFile.buffer.toString('utf-8');
        }

        if (!csvText.trim()) {
            throw new Error('Uploaded file is empty or has no readable tabular data.');
        }

        const analysis = computeItemAnalysis(csvText);

        // Store the analysis with teacher and class info
        const db = mongoose.connection.db;
        if (db && classValue && subject && requesterEmail) {
            const analysisData = {
                class: classValue,
                subject,
                quarter: quarter ?? '',
                teacherEmail: requesterEmail,
                timestamp: new Date(),
                ...analysis
            };
            await db.collection('teacher_item_analysis').updateOne(
                { class: classValue, subject, teacherEmail: requesterEmail },
                { $set: analysisData },
                { upsert: true }
            );
        }

        return res.json(analysis);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to process uploaded file.';
        return res.status(400).json({ message });
    }
});

app.get('/api/admin/school-overview', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can view school overview analytics.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);
    const selectedGradeLevel = typeof req.query.gradeLevel === 'string' ? req.query.gradeLevel.trim() : '';
    const selectedQuarter = typeof req.query.quarter === 'string' ? req.query.quarter.trim() : '';

    const parseGradeSortValue = (gradeLevel: string): number => {
        const match = gradeLevel.match(/(\d+)/);
        if (!match) {
            return Number.MAX_SAFE_INTEGER;
        }

        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
    };

    const getStatusByScore = (value: number): SchoolOverviewSummaryRow['status'] => {
        if (value >= 85) {
            return 'Excellent';
        }

        if (value >= 75) {
            return 'Good';
        }

        if (value >= 60) {
            return 'Fair';
        }

        return 'Needs Improvement';
    };

    const buildResponse = (
        teachers: PersistedUser[],
        allClasses: Array<{
            id: string;
            classLabel: string;
            gradeLevel: string;
            section: string;
            subject: string;
            teacherName: string;
        }>,
        classPerformanceById: Map<string, { studentCount: number; avgScore: number; passRate: number }>,
        classLabelsInQuarter?: Set<string>
    ): SchoolOverviewResponse => {
        void teachers;

        const gradeAccumulator = new Map<string, { students: number; scoreWeighted: number; passWeighted: number; weight: number }>();
        const subjectAccumulator = new Map<string, { scoreWeighted: number; weight: number }>();

        const uniqueGradeOptions = new Map<string, { id: string; label: string }>();
        for (const classItem of allClasses) {
            if (!uniqueGradeOptions.has(classItem.gradeLevel)) {
                uniqueGradeOptions.set(classItem.gradeLevel, {
                    id: classItem.gradeLevel,
                    label: classItem.gradeLevel
                });
            }
        }

        const gradeOptions = Array.from(uniqueGradeOptions.values())
            .sort((first, second) => {
                const firstGrade = parseGradeSortValue(first.label);
                const secondGrade = parseGradeSortValue(second.label);

                if (firstGrade !== secondGrade) {
                    return firstGrade - secondGrade;
                }

                return first.label.localeCompare(second.label);
            });

        const filteredClasses = allClasses.filter((classItem) => {
            if (classLabelsInQuarter && !classLabelsInQuarter.has(classItem.classLabel)) {
                return false;
            }

            if (selectedGradeLevel && selectedGradeLevel !== 'All Grades' && classItem.gradeLevel !== selectedGradeLevel) {
                return false;
            }

            return true;
        });

        for (const classItem of filteredClasses) {
            const classMetrics = classPerformanceById.get(classItem.id);
            const students = classMetrics?.studentCount ?? 0;
            const weight = students > 0 ? students : 0;
            const score = classMetrics?.avgScore ?? 0;
            const pass = classMetrics?.passRate ?? 0;

            const gradeEntry = gradeAccumulator.get(classItem.gradeLevel) ?? {
                students: 0,
                scoreWeighted: 0,
                passWeighted: 0,
                weight: 0
            };
            gradeEntry.students += students;
            gradeEntry.scoreWeighted += score * weight;
            gradeEntry.passWeighted += pass * weight;
            gradeEntry.weight += weight;
            gradeAccumulator.set(classItem.gradeLevel, gradeEntry);

            const subjectEntry = subjectAccumulator.get(classItem.subject) ?? { scoreWeighted: 0, weight: 0 };
            subjectEntry.scoreWeighted += score * weight;
            subjectEntry.weight += weight;
            subjectAccumulator.set(classItem.subject, subjectEntry);
        }

        const gradeSummary = Array.from(gradeAccumulator.entries())
            .map(([gradeLevel, values]) => {
                const averageScore = values.weight ? values.scoreWeighted / values.weight : 0;
                const passRate = values.weight ? values.passWeighted / values.weight : 0;

                return {
                    gradeLevel,
                    averageScore,
                    students: values.students,
                    passRate,
                    status: getStatusByScore(averageScore)
                };
            })
            .sort((first, second) => {
                const firstGrade = parseGradeSortValue(first.gradeLevel);
                const secondGrade = parseGradeSortValue(second.gradeLevel);

                if (firstGrade !== secondGrade) {
                    return firstGrade - secondGrade;
                }

                return first.gradeLevel.localeCompare(second.gradeLevel);
            });

        const gradeBars = gradeSummary.map((row) => ({
            label: row.gradeLevel,
            value: Math.round(row.averageScore)
        }));

        const subjectBars = Array.from(subjectAccumulator.entries())
            .map(([label, values]) => ({
                label,
                value: values.weight ? Math.round(values.scoreWeighted / values.weight) : 0
            }))
            .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label));

        const totalStudents = gradeSummary.reduce((sum, row) => sum + row.students, 0);
        const schoolAverage = gradeSummary.length
            ? gradeSummary.reduce((sum, row) => sum + row.averageScore, 0) / gradeSummary.length
            : 0;
        const overallPassRate = gradeSummary.length
            ? gradeSummary.reduce((sum, row) => sum + row.passRate, 0) / gradeSummary.length
            : 0;

        const activeTeacherNames = new Set(
            filteredClasses.map((classItem) => normalizeTeacherDisplayName(classItem.teacherName)).filter(Boolean)
        );

        return {
            kpis: {
                schoolAverage,
                overallPassRate,
                totalStudents,
                activeTeachers: activeTeacherNames.size
            },
            gradeOptions,
            gradeBars,
            subjectBars,
            gradeSummary
        };
    };

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const teachers = Array.from(getMemoryStoreByRole('teacher').values());
        const classes = Array.from(memoryClasses.values()).map((classItem) => ({
            id: classItem.id,
            classLabel: buildClassLabel(classItem.gradeLevel, classItem.section),
            gradeLevel: classItem.gradeLevel,
            section: classItem.section,
            subject: classItem.subject,
            teacherName: classItem.teacherName
        }));

        const classPerformanceById = new Map<string, { studentCount: number; avgScore: number; passRate: number }>();
        for (const classItem of classes) {
            const studentsInClass = Array.from(memoryStudents.values()).filter((student) => student.classId === classItem.id);
            const studentCount = studentsInClass.length;
            const totalAverage = studentsInClass.reduce((sum, student) => {
                const average = (student.q1Score + student.q2Score + student.q3Score + student.q4Score) / 4;
                return sum + average;
            }, 0);
            const passCount = studentsInClass.filter((student) => {
                const average = (student.q1Score + student.q2Score + student.q3Score + student.q4Score) / 4;
                return average >= 75;
            }).length;

            classPerformanceById.set(classItem.id, {
                studentCount,
                avgScore: studentCount ? totalAverage / studentCount : 0,
                passRate: studentCount ? (passCount / studentCount) * 100 : 0
            });
        }

        const classLabelsInQuarter: Set<string> | undefined = undefined;

        return res.json(buildResponse(teachers, classes, classPerformanceById, classLabelsInQuarter));
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can view school overview analytics.' });
        }

        const teachers = await TeacherModel.find({}).sort({ lastName: 1, firstName: 1 }).lean();
        const classRecords = await ClassSectionModel.find({}).lean();
        const classes = classRecords.map((classItem) => ({
            id: String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`),
            classLabel: buildClassLabel(classItem.gradeLevel, classItem.section),
            gradeLevel: classItem.gradeLevel,
            section: classItem.section,
            subject: classItem.subject,
            teacherName: classItem.teacherName
        }));

        const classIds = classes.map((classItem) => classItem.id);
        const classPerformanceAggregate = await StudentModel.aggregate<{
            _id: string;
            studentCount: number;
            totalAverage: number;
            passCount: number;
        }>([
            {
                $match: {
                    classId: { $in: classIds }
                }
            },
            {
                $addFields: {
                    studentAverage: {
                        $avg: [
                            { $ifNull: ['$q1Score', 0] },
                            { $ifNull: ['$q2Score', 0] },
                            { $ifNull: ['$q3Score', 0] },
                            { $ifNull: ['$q4Score', 0] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$classId',
                    studentCount: { $sum: 1 },
                    totalAverage: { $sum: '$studentAverage' },
                    passCount: {
                        $sum: {
                            $cond: [{ $gte: ['$studentAverage', 75] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const classPerformanceById = new Map<string, { studentCount: number; avgScore: number; passRate: number }>();
        for (const classMetric of classPerformanceAggregate) {
            const studentCount = classMetric.studentCount;
            classPerformanceById.set(classMetric._id, {
                studentCount,
                avgScore: studentCount ? classMetric.totalAverage / studentCount : 0,
                passRate: studentCount ? (classMetric.passCount / studentCount) * 100 : 0
            });
        }

        let classLabelsInQuarter: Set<string> | undefined;

        if (selectedQuarter && selectedQuarter !== 'All Quarters') {
            const database = mongoose.connection.db;

            if (database) {
                const uploads = await database.collection('teacher_item_analysis')
                    .find(
                        { quarter: selectedQuarter },
                        { projection: { class: 1 } }
                    )
                    .toArray() as Array<{ class?: string }>;

                classLabelsInQuarter = new Set(
                    uploads
                        .map((upload) => upload.class?.trim() ?? '')
                        .filter((value) => value.length > 0)
                );
            } else {
                classLabelsInQuarter = new Set();
            }
        }

        return res.json(buildResponse(teachers, classes, classPerformanceById, classLabelsInQuarter));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load school overview analytics.';
        return res.status(500).json({ message });
    }
});

app.get('/api/admin/teacher-performance', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can view teacher performance analytics.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    const buildResponse = (
        teachers: PersistedUser[],
        classes: Array<{ id: string; teacherName: string; subject: string }>,
        classPerformanceById: Map<string, { studentCount: number; avgScore: number; passRate: number }>,
        onTimeEmails: Set<string>
    ): TeacherPerformanceResponse => {
        const teacherRows: TeacherPerformanceRow[] = teachers
            .map((teacher) => {
                const teacherName = getTeacherDisplayNameFromUser(teacher);
                const normalizedName = normalizeTeacherDisplayName(teacherName);
                const teacherClasses = classes.filter((classItem) => normalizeTeacherDisplayName(classItem.teacherName) === normalizedName);
                const classCount = teacherClasses.length;
                const studentCount = teacherClasses.reduce((sum, classItem) => sum + (classPerformanceById.get(classItem.id)?.studentCount ?? 0), 0);
                const assignedSubjects = Array.from(new Set(teacherClasses.map((classItem) => classItem.subject).filter(Boolean)));
                const rowSubject = (teacher.subject?.trim() || assignedSubjects[0] || 'Not assigned');
                const totals = teacherClasses.reduce((acc, classItem) => {
                    const classMetrics = classPerformanceById.get(classItem.id);
                    const count = classMetrics?.studentCount ?? 0;
                    const avg = classMetrics?.avgScore ?? 0;
                    const pass = classMetrics?.passRate ?? 0;

                    acc.weight += count;
                    acc.scoreWeighted += avg * count;
                    acc.passWeighted += pass * count;
                    return acc;
                }, { weight: 0, scoreWeighted: 0, passWeighted: 0 });

                const avgScore = totals.weight > 0 ? (totals.scoreWeighted / totals.weight) : 0;
                const passRate = totals.weight > 0 ? (totals.passWeighted / totals.weight) : 0;
                const normalizedTeacherEmail = normalizeEmail(teacher.email);
                const uploadStatus: TeacherPerformanceRow['uploadStatus'] = onTimeEmails.has(normalizedTeacherEmail)
                    ? 'On Time'
                    : 'Delayed';

                return {
                    id: String(teacher._id ?? teacher.id ?? normalizedTeacherEmail),
                    name: teacherName || normalizedTeacherEmail,
                    subject: rowSubject,
                    classes: classCount,
                    students: studentCount,
                    avgScore,
                    passRate,
                    uploadStatus
                };
            })
            .sort((first, second) => first.name.localeCompare(second.name));

        const totalTeachers = teacherRows.length;
        const avgTeacherScore = totalTeachers
            ? teacherRows.reduce((sum, row) => sum + row.avgScore, 0) / totalTeachers
            : 0;
        const onTimeUploadsCount = teacherRows.filter((row) => row.uploadStatus === 'On Time').length;
        const onTimeUploadsPercent = totalTeachers ? Math.round((onTimeUploadsCount / totalTeachers) * 100) : 0;
        const topPerformer = teacherRows.reduce<TeacherPerformanceRow | null>((best, row) => {
            if (!best || row.avgScore > best.avgScore) {
                return row;
            }

            return best;
        }, null);

        const departmentMap = new Map<string, { total: number; count: number }>();

        for (const row of teacherRows) {
            if (!row.subject || row.subject === 'Not assigned') {
                continue;
            }

            const existing = departmentMap.get(row.subject);
            if (!existing) {
                departmentMap.set(row.subject, { total: row.avgScore, count: 1 });
                continue;
            }

            existing.total += row.avgScore;
            existing.count += 1;
        }

        const departmentBars = Array.from(departmentMap.entries())
            .map(([label, values]) => ({
                label,
                value: values.count ? Math.round(values.total / values.count) : 0
            }))
            .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label));

        return {
            kpis: {
                totalTeachers,
                avgTeacherScore,
                onTimeUploadsPercent,
                onTimeUploadsCount,
                topPerformerName: topPerformer?.name ?? 'N/A',
                topPerformerScore: topPerformer?.avgScore ?? 0
            },
            departmentBars,
            teachers: teacherRows
        };
    };

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const teachers = Array.from(getMemoryStoreByRole('teacher').values());
        const classes = Array.from(memoryClasses.values()).map((classItem) => ({
            id: classItem.id,
            teacherName: classItem.teacherName,
            subject: classItem.subject
        }));
        const classPerformanceById = new Map<string, { studentCount: number; avgScore: number; passRate: number }>();
        for (const classItem of classes) {
            const studentsInClass = Array.from(memoryStudents.values()).filter((student) => student.classId === classItem.id);
            const studentCount = studentsInClass.length;
            const totalAverage = studentsInClass.reduce((sum, student) => {
                const average = (student.q1Score + student.q2Score + student.q3Score + student.q4Score) / 4;
                return sum + average;
            }, 0);
            const passCount = studentsInClass.filter((student) => {
                const average = (student.q1Score + student.q2Score + student.q3Score + student.q4Score) / 4;
                return average >= 75;
            }).length;

            classPerformanceById.set(classItem.id, {
                studentCount,
                avgScore: studentCount ? totalAverage / studentCount : 0,
                passRate: studentCount ? (passCount / studentCount) * 100 : 0
            });
        }

        const response = buildResponse(teachers, classes, classPerformanceById, new Set<string>());
        return res.json(response);
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can view teacher performance analytics.' });
        }

        const teacherRecords = await TeacherModel.find({}).sort({ lastName: 1, firstName: 1 }).lean();
        const classRecords = await ClassSectionModel.find({}).lean();
        const classes = classRecords.map((classItem) => ({
            id: String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`),
            teacherName: classItem.teacherName,
            subject: classItem.subject
        }));
        const classIds = classes.map((classItem) => classItem.id);
        const classPerformanceAggregate = await StudentModel.aggregate<{
            _id: string;
            studentCount: number;
            totalAverage: number;
            passCount: number;
        }>([
            {
                $match: {
                    classId: { $in: classIds }
                }
            },
            {
                $addFields: {
                    studentAverage: {
                        $avg: [
                            { $ifNull: ['$q1Score', 0] },
                            { $ifNull: ['$q2Score', 0] },
                            { $ifNull: ['$q3Score', 0] },
                            { $ifNull: ['$q4Score', 0] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$classId',
                    studentCount: { $sum: 1 },
                    totalAverage: { $sum: '$studentAverage' },
                    passCount: {
                        $sum: {
                            $cond: [{ $gte: ['$studentAverage', 75] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        const classPerformanceById = new Map<string, { studentCount: number; avgScore: number; passRate: number }>();
        for (const classMetric of classPerformanceAggregate) {
            const studentCount = classMetric.studentCount;
            classPerformanceById.set(classMetric._id, {
                studentCount,
                avgScore: studentCount ? classMetric.totalAverage / studentCount : 0,
                passRate: studentCount ? (classMetric.passCount / studentCount) * 100 : 0
            });
        }

        const database = mongoose.connection.db;
        let onTimeEmails = new Set<string>();

        if (database) {
            const uploads = await database.collection('teacher_item_analysis')
                .find(
                    { teacherEmail: { $exists: true, $ne: '' } },
                    { projection: { teacherEmail: 1 } }
                )
                .toArray() as Array<{ teacherEmail?: string }>;

            onTimeEmails = new Set(
                uploads
                    .map((upload) => upload.teacherEmail?.trim().toLowerCase() ?? '')
                    .filter((email) => email.length > 0)
            );
        }

        const response = buildResponse(teacherRecords, classes, classPerformanceById, onTimeEmails);
        return res.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load teacher performance analytics.';
        return res.status(500).json({ message });
    }
});

app.get('/api/admin/item-analysis', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const selectedClassQuery = typeof req.query.class === 'string' ? req.query.class.trim() : '';
    const selectedSubjectQuery = typeof req.query.subject === 'string' ? req.query.subject.trim() : '';

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can view item analysis.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const classSubjectMap: Record<string, string[]> = {};
        for (const classItem of memoryClasses.values()) {
            const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
            if (!classSubjectMap[classLabel]) {
                classSubjectMap[classLabel] = [];
            }

            if (!classSubjectMap[classLabel].includes(classItem.subject)) {
                classSubjectMap[classLabel].push(classItem.subject);
            }
        }

        const classOptions = Object.keys(classSubjectMap)
            .sort((first, second) => first.localeCompare(second));
        const selectedClass = selectedClassQuery && classOptions.includes(selectedClassQuery)
            ? selectedClassQuery
            : (classOptions[0] ?? '');
        const subjectOptions = selectedClass ? (classSubjectMap[selectedClass] ?? []) : [];
        const selectedSubject = selectedSubjectQuery && subjectOptions.includes(selectedSubjectQuery)
            ? selectedSubjectQuery
            : (subjectOptions[0] ?? '');

        const emptyResponse: AdminItemAnalysisResponse = {
            title: selectedClass ? `Item Analysis - ${selectedClass}` : 'Item Analysis',
            classOptions,
            classSubjectMap,
            subjectOptions,
            selectedClass,
            selectedSubject,
            classAverage: '0.0%',
            averageIndex: '0.0%',
            totalStudents: 0,
            rows: []
        };

        return res.json(emptyResponse);
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can view item analysis.' });
        }

        const database = mongoose.connection.db;
        if (!database) {
            const emptyResponse: AdminItemAnalysisResponse = {
                title: 'Item Analysis',
                classOptions: [],
                classSubjectMap: {},
                subjectOptions: [],
                selectedClass: '',
                selectedSubject: '',
                classAverage: '0.0%',
                averageIndex: '0.0%',
                totalStudents: 0,
                rows: []
            };

            return res.json(emptyResponse);
        }

        const classRecords = await ClassSectionModel.find({}).lean();
        const classSubjectMap: Record<string, string[]> = {};

        for (const classItem of classRecords) {
            const classLabel = buildClassLabel(classItem.gradeLevel, classItem.section);
            const subjectLabel = classItem.subject?.trim() ?? '';

            if (!classLabel || !subjectLabel) {
                continue;
            }

            if (!classSubjectMap[classLabel]) {
                classSubjectMap[classLabel] = [];
            }

            if (!classSubjectMap[classLabel].includes(subjectLabel)) {
                classSubjectMap[classLabel].push(subjectLabel);
            }
        }

        const classOptions = Object.keys(classSubjectMap)
            .sort((first, second) => first.localeCompare(second));

        const uploads = await database.collection('teacher_item_analysis')
            .find({})
            .sort({ timestamp: -1 })
            .toArray() as Array<Record<string, unknown>>;

        const selectedClass = selectedClassQuery && classOptions.includes(selectedClassQuery)
            ? selectedClassQuery
            : (classOptions[0] ?? '');

        const uploadsForClass = selectedClass
            ? uploads.filter((upload) => String(upload.class ?? '').trim() === selectedClass)
            : [];

        const subjectOptions = selectedClass ? (classSubjectMap[selectedClass] ?? []) : [];

        const selectedSubject = selectedSubjectQuery && subjectOptions.includes(selectedSubjectQuery)
            ? selectedSubjectQuery
            : (subjectOptions[0] ?? '');

        const selectedAnalysis = uploadsForClass.find((upload) => String(upload.subject ?? '').trim() === selectedSubject);

        if (!selectedAnalysis) {
            const emptyResponse: AdminItemAnalysisResponse = {
                title: selectedClass ? `Item Analysis - ${selectedClass}` : 'Item Analysis',
                classOptions,
                classSubjectMap,
                subjectOptions,
                selectedClass,
                selectedSubject,
                classAverage: '0.0%',
                averageIndex: '0.0%',
                totalStudents: 0,
                rows: []
            };

            return res.json(emptyResponse);
        }

        const items = (selectedAnalysis.items as Array<{
            item?: string;
            difficulty?: number;
            discrimination?: number;
            interpretation?: string;
        }>) ?? [];

        const toStatus = (interpretation: string): 'excellent' | 'good' | 'fair' | 'poor' => {
            const normalized = interpretation.trim().toLowerCase();

            if (normalized === 'excellent') {
                return 'excellent';
            }

            if (normalized === 'good') {
                return 'good';
            }

            if (normalized === 'fair') {
                return 'fair';
            }

            return 'poor';
        };

        const rows: AdminItemAnalysisRow[] = items.map((item, index) => {
            const interpretation = String(item.interpretation ?? 'Needs Improvement');
            return {
                itemNo: index + 1,
                difficultyIndex: typeof item.difficulty === 'number' ? item.difficulty : 0,
                discriminationIndex: typeof item.discrimination === 'number' ? item.discrimination : 0,
                interpretation,
                status: toStatus(interpretation)
            };
        });

        const classAverageValue = ((selectedAnalysis.summary as Record<string, unknown>)?.avgDifficulty ?? 0) as number;
        const averageIndexValue = ((selectedAnalysis.summary as Record<string, unknown>)?.avgDiscrimination ?? 0) as number;

        const response: AdminItemAnalysisResponse = {
            title: selectedClass ? `My Item Analysis - ${selectedClass}` : 'Item Analysis',
            classOptions,
            classSubjectMap,
            subjectOptions,
            selectedClass,
            selectedSubject,
            classAverage: `${(classAverageValue * 100).toFixed(1)}%`,
            averageIndex: `${(averageIndexValue * 100).toFixed(1)}%`,
            totalStudents: typeof selectedAnalysis.totalStudents === 'number' ? selectedAnalysis.totalStudents : rows.length,
            rows
        };

        return res.json(response);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load item analysis.';
        return res.status(500).json({ message });
    }
});

app.get('/api/admin/teachers', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can view teacher accounts.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const teachers = buildTeacherListWithClassAssignments(
            Array.from(getMemoryStoreByRole('teacher').values()),
            Array.from(memoryClasses.values())
        )
            .sort((first, second) => first.lastName.localeCompare(second.lastName));

        return res.json({ teachers });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can view teacher accounts.' });
        }

        const teacherRecords = await TeacherModel.find({}).sort({ lastName: 1, firstName: 1 }).lean();
        const classRecords = await ClassSectionModel.find({})
            .sort({ updatedAt: 1, createdAt: 1 })
            .lean();

        const teachers = buildTeacherListWithClassAssignments(teacherRecords, classRecords);

        return res.json({ teachers });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load teacher accounts.';
        return res.status(500).json({ message });
    }
});

app.put('/api/admin/teachers/:teacherId', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { teacherId } = req.params as { teacherId?: string };
    const { firstName, lastName, email, password, confirmPassword } = req.body as {
        firstName?: string;
        lastName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can update teacher accounts.' });
    }

    if (!teacherId?.trim()) {
        return res.status(400).json({ message: 'Teacher id is required.' });
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
        return res.status(400).json({ message: 'First name, last name, and email/username are required.' });
    }

    if (!password?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({ message: 'Password and confirm password are required.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);
    const normalizedTeacherEmail = normalizeEmail(email);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const teacherStore = getMemoryStoreByRole('teacher');
        const existingEntry = Array.from(teacherStore.entries())
            .find(([, teacher]) => teacher.id === teacherId);

        if (!existingEntry) {
            return res.status(404).json({ message: 'Teacher account not found.' });
        }

        const [existingKey, existingTeacher] = existingEntry;
        const duplicateUser = teacherStore.get(normalizedTeacherEmail);

        if (duplicateUser && duplicateUser.id !== existingTeacher.id) {
            return res.status(409).json({ message: 'An account with this email/username already exists.' });
        }

        const updatedTeacher: MemoryUser = {
            ...existingTeacher,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedTeacherEmail,
            passwordHash: hashPassword(password)
        };

        if (existingKey !== normalizedTeacherEmail) {
            teacherStore.delete(existingKey);
        }

        teacherStore.set(normalizedTeacherEmail, updatedTeacher);

        return res.json({
            message: 'Teacher account updated successfully (temporary in-memory mode).',
            teacher: buildTeacherListItem(updatedTeacher)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can update teacher accounts.' });
        }

        const existingTeacher = await TeacherModel.findById(teacherId).lean();

        if (!existingTeacher) {
            return res.status(404).json({ message: 'Teacher account not found.' });
        }

        if (normalizeEmail(existingTeacher.email) !== normalizedTeacherEmail) {
            const conflictingUsers = await findDatabaseUsersByEmail(normalizedTeacherEmail);
            const hasConflict = conflictingUsers.some(({ user }) => String(user._id ?? user.id ?? '') !== String(existingTeacher._id ?? ''));

            if (hasConflict) {
                return res.status(409).json({ message: 'An account with this email/username already exists.' });
            }
        }

        const updatedTeacher = await TeacherModel.findByIdAndUpdate(
            teacherId,
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedTeacherEmail,
                passwordHash: hashPassword(password)
            },
            { new: true }
        ).lean();

        if (!updatedTeacher) {
            return res.status(404).json({ message: 'Teacher account not found.' });
        }

        return res.json({
            message: 'Teacher account updated successfully.',
            teacher: buildTeacherListItem(updatedTeacher)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update teacher account.';
        return res.status(500).json({ message });
    }
});

app.delete('/api/admin/teachers/:teacherId', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { teacherId } = req.params as { teacherId?: string };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can delete teacher accounts.' });
    }

    if (!teacherId?.trim()) {
        return res.status(400).json({ message: 'Teacher id is required.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const teacherStore = getMemoryStoreByRole('teacher');
        const existingEntry = Array.from(teacherStore.entries())
            .find(([, teacher]) => teacher.id === teacherId);

        if (!existingEntry) {
            return res.status(404).json({ message: 'Teacher account not found.' });
        }

        const [existingKey] = existingEntry;
        teacherStore.delete(existingKey);

        return res.json({ message: 'Teacher account deleted successfully (temporary in-memory mode).' });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can delete teacher accounts.' });
        }

        const deletedTeacher = await TeacherModel.findByIdAndDelete(teacherId).lean();

        if (!deletedTeacher) {
            return res.status(404).json({ message: 'Teacher account not found.' });
        }

        return res.json({ message: 'Teacher account deleted successfully.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete teacher account.';
        return res.status(500).json({ message });
    }
});

app.get('/api/admin/classes', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can view class records.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const studentCountsByClass = new Map<string, number>();
        for (const student of memoryStudents.values()) {
            studentCountsByClass.set(student.classId, (studentCountsByClass.get(student.classId) ?? 0) + 1);
        }

        const classes = Array.from(memoryClasses.values())
            .map((classItem) => ({
                ...buildClassListItem(classItem),
                studentCount: studentCountsByClass.get(classItem.id) ?? 0
            }))
            .sort((first, second) => first.gradeLevel.localeCompare(second.gradeLevel));

        return res.json({ classes });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const StudentModel = Student as mongoose.Model<StudentRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can view class records.' });
        }

        const classRecords = await ClassSectionModel.find({}).sort({ gradeLevel: 1, section: 1 }).lean();
        const classIds = classRecords.map((classItem) => String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`));
        const studentCounts = await StudentModel.aggregate<{ _id: string; count: number }>([
            {
                $match: {
                    classId: { $in: classIds }
                }
            },
            {
                $group: {
                    _id: '$classId',
                    count: { $sum: 1 }
                }
            }
        ]);
        const studentCountMap = new Map(studentCounts.map((item) => [item._id, item.count]));

        const classes = classRecords.map((classItem) => {
            const classId = String(classItem._id ?? classItem.id ?? `${classItem.className}-${classItem.section}`);
            return {
                ...buildClassListItem(classItem),
                studentCount: studentCountMap.get(classId) ?? 0
            };
        });
        return res.json({ classes });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load class records.';
        return res.status(500).json({ message });
    }
});

app.post('/api/admin/classes', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { className, gradeLevel, section, subject, teacherName, studentCount } = req.body as {
        className?: string;
        gradeLevel?: string;
        section?: string;
        subject?: string;
        teacherName?: string;
        studentCount?: number;
    };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can create class records.' });
    }

    if (!className?.trim() || !gradeLevel?.trim() || !section?.trim() || !subject?.trim() || !teacherName?.trim() || typeof studentCount !== 'number' || !Number.isFinite(studentCount) || studentCount < 0) {
        return res.status(400).json({ message: 'Class name, grade level, section, subject, teacher, and number of students are required.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const classId = randomBytes(12).toString('hex');
        const newClass: MemoryClass = {
            id: classId,
            className: className.trim(),
            gradeLevel: gradeLevel.trim(),
            section: section.trim(),
            subject: subject.trim(),
            teacherName: teacherName.trim(),
            studentCount: Math.floor(studentCount)
        };

        memoryClasses.set(classId, newClass);
        syncMemoryTeacherAssignmentByName(newClass.teacherName);

        return res.status(201).json({
            message: 'Class record created successfully (temporary in-memory mode).',
            classItem: buildClassListItem(newClass)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can create class records.' });
        }

        const createdClass = await ClassSectionModel.create({
            className: className.trim(),
            gradeLevel: gradeLevel.trim(),
            section: section.trim(),
            subject: subject.trim(),
            teacherName: teacherName.trim(),
            studentCount: Math.floor(studentCount)
        });

        await syncDatabaseTeacherAssignmentByName(TeacherModel, ClassSectionModel, createdClass.teacherName);

        return res.status(201).json({
            message: 'Class record created successfully.',
            classItem: buildClassListItem(createdClass)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create class record.';
        return res.status(500).json({ message });
    }
});

app.put('/api/admin/classes/:classId', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { classId } = req.params as { classId?: string };
    const { className, gradeLevel, section, subject, teacherName, studentCount } = req.body as {
        className?: string;
        gradeLevel?: string;
        section?: string;
        subject?: string;
        teacherName?: string;
        studentCount?: number;
    };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can update class records.' });
    }

    if (!classId?.trim()) {
        return res.status(400).json({ message: 'Class id is required.' });
    }

    if (!className?.trim() || !gradeLevel?.trim() || !section?.trim() || !subject?.trim() || !teacherName?.trim() || typeof studentCount !== 'number' || !Number.isFinite(studentCount) || studentCount < 0) {
        return res.status(400).json({ message: 'Class name, grade level, section, subject, teacher, and number of students are required.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const existingClass = memoryClasses.get(classId);

        if (!existingClass) {
            return res.status(404).json({ message: 'Class record not found.' });
        }

        const updatedClass: MemoryClass = {
            ...existingClass,
            className: className.trim(),
            gradeLevel: gradeLevel.trim(),
            section: section.trim(),
            subject: subject.trim(),
            teacherName: teacherName.trim(),
            studentCount: Math.floor(studentCount)
        };

        memoryClasses.set(classId, updatedClass);
        syncMemoryTeacherAssignmentByName(existingClass.teacherName);
        syncMemoryTeacherAssignmentByName(updatedClass.teacherName);

        return res.json({
            message: 'Class record updated successfully (temporary in-memory mode).',
            classItem: buildClassListItem(updatedClass)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can update class records.' });
        }

        const existingClass = await ClassSectionModel.findById(classId).lean();

        if (!existingClass) {
            return res.status(404).json({ message: 'Class record not found.' });
        }

        const updatedClass = await ClassSectionModel.findByIdAndUpdate(
            classId,
            {
                className: className.trim(),
                gradeLevel: gradeLevel.trim(),
                section: section.trim(),
                subject: subject.trim(),
                teacherName: teacherName.trim(),
                studentCount: Math.floor(studentCount)
            },
            { new: true }
        ).lean();

        if (!updatedClass) {
            return res.status(404).json({ message: 'Class record not found.' });
        }

        await syncDatabaseTeacherAssignmentByName(TeacherModel, ClassSectionModel, existingClass.teacherName);
        await syncDatabaseTeacherAssignmentByName(TeacherModel, ClassSectionModel, updatedClass.teacherName);

        return res.json({
            message: 'Class record updated successfully.',
            classItem: buildClassListItem(updatedClass)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update class record.';
        return res.status(500).json({ message });
    }
});

app.delete('/api/admin/classes/:classId', async (req: Request, res: Response) => {
    const requesterRole = req.header('x-user-role');
    const requesterEmail = req.header('x-user-email');
    const { classId } = req.params as { classId?: string };

    if (requesterRole !== 'administrator' || !requesterEmail?.trim()) {
        return res.status(403).json({ message: 'Only administrators can delete class records.' });
    }

    if (!classId?.trim()) {
        return res.status(400).json({ message: 'Class id is required.' });
    }

    const normalizedAdminEmail = normalizeEmail(requesterEmail);

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const fallbackAdmin = getMemoryStoreByRole('administrator').get(normalizedAdminEmail);

        if (!fallbackAdmin) {
            return res.status(403).json({ message: 'Admin session is not recognized. Please sign in again.' });
        }

        const existingClass = memoryClasses.get(classId);

        if (!existingClass) {
            return res.status(404).json({ message: 'Class record not found.' });
        }

        memoryClasses.delete(classId);
        syncMemoryTeacherAssignmentByName(existingClass.teacherName);

        return res.json({ message: 'Class record deleted successfully (temporary in-memory mode).' });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const AdministratorModel = Administrator as mongoose.Model<CredentialUserRecord>;
        const ClassSectionModel = ClassSection as mongoose.Model<ClassRecord>;
        const TeacherModel = Teacher as mongoose.Model<CredentialUserRecord>;
        const adminAccount = await AdministratorModel.findOne({ email: normalizedAdminEmail }).lean();

        if (!adminAccount) {
            return res.status(403).json({ message: 'Only valid administrators can delete class records.' });
        }

        const deletedClass = await ClassSectionModel.findByIdAndDelete(classId).lean();

        if (!deletedClass) {
            return res.status(404).json({ message: 'Class record not found.' });
        }

        await syncDatabaseTeacherAssignmentByName(TeacherModel, ClassSectionModel, deletedClass.teacherName);

        return res.json({ message: 'Class record deleted successfully.' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete class record.';
        return res.status(500).json({ message });
    }
});

// 6. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});