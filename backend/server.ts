import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import Teacher from './models/Teacher.js';
import Administrator from './models/Administrator.js';

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
type RequestWithFile = Request & { file?: { buffer: Buffer } };

type MemoryUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
};

type PersistedUser = {
    _id?: unknown;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash?: string;
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

    if (!isSupportedRole(role)) {
        return res.status(400).json({ message: 'Please select either teacher or administrator.' });
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({ message: 'First name, last name, email, password, and confirm password are required.' });
    }

    const normalizedEmail = normalizeEmail(email);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (!isDatabaseReady() && USE_IN_MEMORY_AUTH_FALLBACK) {
        const existingFallbackUsers = findMemoryUsersByEmail(normalizedEmail);

        if (existingFallbackUsers.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const fallbackStore = getMemoryStoreByRole(role);

        const fallbackUser: MemoryUser = {
            id: randomBytes(12).toString('hex'),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(password)
        };

        fallbackStore.set(normalizedEmail, fallbackUser);

        return res.status(201).json({
            message: 'Account created successfully (temporary in-memory mode).',
            user: buildAuthUser(role, fallbackUser)
        });
    }

    if (!isDatabaseReady()) {
        return res.status(503).json({
            message: 'Database is currently unreachable. If you are using MongoDB Atlas, allow your current IP in Network Access and try again.'
        });
    }

    try {
        const existingUsers = await findDatabaseUsersByEmail(normalizedEmail);

        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const UserModel = getModelByRole(role) as mongoose.Model<any>;

        const createdUser = await UserModel.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(password)
        }) as {
            _id: unknown;
            firstName: string;
            lastName: string;
            email: string;
        };

        return res.status(201).json({
            message: 'Account created successfully.',
            user: buildAuthUser(role, createdUser)
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create account.';
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

app.get('/teacher/dashboard', async (_req: Request, res: Response) => {
    try {
        const document = await fetchCollectionDocument<Record<string, unknown>>('teacher_dashboard');

        if (document) {
            return res.json(document);
        }

        return res.json({
            filters: {
                grades: [],
                quarters: []
            },
            kpis: [],
            trend: [],
            highlights: [],
            topStudents: [],
            improvementAreas: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load dashboard data.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/item-analysis', async (_req: Request, res: Response) => {
    try {
        const document = await fetchCollectionDocument<Record<string, unknown>>('teacher_item_analysis');

        if (document) {
            return res.json(document);
        }

        return res.json({
            rows: []
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load item analysis data.';
        return res.status(500).json({ message });
    }
});

app.get('/teacher/upload-meta', async (_req: Request, res: Response) => {
    try {
        const document = await fetchCollectionDocument<Record<string, unknown>>('teacher_upload_meta');

        if (document) {
            return res.json(document);
        }

        return res.json({
            gradeLevels: [],
            subjects: [],
            quarters: [],
            fileFormats: [],
            requiredColumns: [],
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

app.post('/api/item-analysis/compute', upload.single('file'), (req: Request, res: Response) => {
    const requestWithFile = req as RequestWithFile;

    if (!requestWithFile.file) {
        return res.status(400).json({ message: 'No file uploaded. Use form-data field name "file".' });
    }

    try {
        const csvText = requestWithFile.file.buffer.toString('utf-8');
        const analysis = computeItemAnalysis(csvText);
        return res.json(analysis);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to process uploaded file.';
        return res.status(400).json({ message });
    }
});

// 6. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});