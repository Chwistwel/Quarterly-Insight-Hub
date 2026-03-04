import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';

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
        const firstDiff = first[index] - firstMean;
        const secondDiff = second[index] - secondMean;
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

    const headers = parseCsvLine(rows[0]).map((header) => header.trim());
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
            const lowerHeader = lowerHeaders[index];
            const looksLikeItem = /^q\d+$/i.test(header) || /^item\s*\d+$/i.test(header) || /^item_?\d+$/i.test(lowerHeader);
            return looksLikeItem || !commonNonItemColumns.has(lowerHeader);
        })
        .map(({ index }) => index);

    const rawRowValues = rows.slice(1).map((row) => parseCsvLine(row));

    const numericColumnIndexes = likelyItemIndexes.filter((index) => {
        const values = rawRowValues
            .map((values) => Number(values[index]))
            .filter((value) => Number.isFinite(value));

        return values.length > 0;
    });

    if (numericColumnIndexes.length === 0) {
        throw new Error('No numeric item columns were detected. Expected columns like Q1,Q2,Q3 or Item1,Item2.');
    }

    const normalizedRows: number[][] = rawRowValues.map((rowValues) =>
        numericColumnIndexes.map((index) => {
            const parsed = Number(rowValues[index]);
            return Number.isFinite(parsed) ? parsed : 0;
        })
    );

    const columnMaxima = numericColumnIndexes.map((_, columnIndex) => {
        const values = normalizedRows.map((row) => row[columnIndex]);
        const maxValue = Math.max(...values, 1);
        return maxValue <= 0 ? 1 : maxValue;
    });

    const scaledRows = normalizedRows.map((row) =>
        row.map((value, columnIndex) => {
            const scaled = value / columnMaxima[columnIndex];
            return Math.min(1, Math.max(0, scaled));
        })
    );

    const totals = scaledRows.map((row) => row.reduce((runningTotal, value) => runningTotal + value, 0));

    const computedItems: ComputedItem[] = numericColumnIndexes.map((index, columnIndex) => {
        const itemName = /^q\d+$/i.test(headers[index]) ? headers[index].toUpperCase() : `Q${columnIndex + 1}`;
        const itemValues = scaledRows.map((row) => row[columnIndex]);
        const totalWithoutItem = scaledRows.map((row, rowIndex) => totals[rowIndex] - row[columnIndex]);
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

app.get('/teacher/dashboard', (_req: Request, res: Response) => {
    res.json({
        title: 'My Dashboard',
        systemLabel: 'QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM',
        viewLabel: 'Teacher View',
        filters: {
            grades: ['Grade 7 - Section A'],
            quarters: ['Q1', 'Q2', 'Q3', 'Q4']
        },
        kpis: [
            { label: 'Class Average', value: '76.8%', description: '+2.3% from last quarter' },
            { label: 'Pass Rate', value: '79%', description: '34 of 43 students' },
            { label: 'My Students', value: '43', description: 'Grade 7 - Section A' },
            { label: 'Items Analyzed', value: '50', description: 'Math Q1 Exam' }
        ],
        trend: [
            { label: 'Q1', value: 77 },
            { label: 'Q2', value: 79 },
            { label: 'Q3', value: 82 },
            { label: 'Q4', value: 85 }
        ],
        trendSubtitle: 'Quarterly Performance Trend - Grade 7 Section A',
        topStudents: [
            { name: 'Maria Santos', improvement: '+5% improvement', score: '95%' },
            { name: 'Juan Dela Cruz', improvement: '+3% improvement', score: '92%' },
            { name: 'Anna Reyes', improvement: '+8% improvement', score: '90%' },
            { name: 'Carlos Garcia', improvement: '+2% improvement', score: '88%' },
            { name: 'Lisa Mendoza', improvement: '+6% improvement', score: '87%' }
        ],
        improvementAreas: [
            { area: 'Algebraic Thinking', value: 88 },
            { area: 'Problem Solving', value: 75 },
            { area: 'Geometry Concepts', value: 85 },
            { area: 'Data Analysis', value: 82 }
        ],
        highlights: []
    });
});

app.get('/teacher/item-analysis', (_req: Request, res: Response) => {
    res.json({
        title: 'My Item Analysis - Grade 7',
        systemLabel: 'COMPREHENSIVE ITEM ANALYSIS',
        viewLabel: 'Teacher View',
        grade: 'Grade 7',
        section: 'Section A',
        subject: 'Mathematics',
        classAverage: '78.5%',
        averageIndex: '82%',
        totalStudents: 45,
        totalItems: 50,
        rows: [
            { itemNo: 1, difficultyIndex: 0.75, discriminationIndex: 0.68, interpretation: 'Good' },
            { itemNo: 2, difficultyIndex: 0.82, discriminationIndex: 0.51, interpretation: 'Fair' },
            { itemNo: 3, difficultyIndex: 0.68, discriminationIndex: 0.72, interpretation: 'Good' },
            { itemNo: 4, difficultyIndex: 0.48, discriminationIndex: 0.81, interpretation: 'Excellent' },
            { itemNo: 5, difficultyIndex: 0.82, discriminationIndex: 0.42, interpretation: 'Poor' },
            { itemNo: 6, difficultyIndex: 0.75, discriminationIndex: 0.65, interpretation: 'Good' }
        ]
    });
});

app.get('/teacher/upload-meta', (_req: Request, res: Response) => {
    res.json({
        title: 'Upload Quarterly Exam Results - Q2',
        systemLabel: 'UPLOAD AND ANALYZE STUDENT PERFORMANCE DATA',
        viewLabel: 'Teacher View',
        gradeLevels: ['Grade 7 - Section A', 'Grade 7 - Section B', 'Grade 8 - Section A'],
        subjects: ['Mathematics', 'Science', 'English'],
        quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
        fileFormats: ['CSV', 'Excel'],
        requiredColumns: ['Student ID', 'Student Name', 'Item Responses (1-50)', 'Answer Key'],
        processingTime: 'Analysis typically takes 5-10 minutes depending on the number of students.',
        recentUploads: [
            { fileName: 'Mathematics - Grade 7-A', status: 'Completed' },
            { fileName: 'Mathematics - Grade 7-B', status: 'Completed' },
            { fileName: 'Mathematics - Grade 8-A', status: 'Completed' }
        ]
    });
});

app.get('/teacher/reports', (_req: Request, res: Response) => {
    res.json({
        title: 'My Reports',
        systemLabel: 'REPORT GENERATION CENTER',
        viewLabel: 'Teacher View',
        subtitle: 'Generate and download reports for your classes and student performance',
        actions: [
            { id: 'class-reports', title: 'Class Reports', description: 'Generate performance reports for your classes', buttonLabel: 'Generate Report' },
            { id: 'student-progress', title: 'Student Progress', description: 'Track individual student performance trends', buttonLabel: 'View Progress' },
            { id: 'item-analysis', title: 'Item Analysis', description: 'Detailed item-level analysis reports', buttonLabel: 'Generate' }
        ],
        summary: '',
        reports: [
            { id: '1', title: 'My Class Performance Report', category: 'Detailed analysis of your class performance for Q2', updatedAt: 'March 1, 2024', status: '2.4 MB' },
            { id: '2', title: 'Student Progress Report', category: 'Individual student progress tracking for Grade 7-A', updatedAt: 'March 1, 2024', status: '1.8 MB' },
            { id: '3', title: 'Item Analysis Summary', category: 'Comprehensive item analysis for Mathematics Q2', updatedAt: 'February 28, 2024', status: '1.2 MB' },
            { id: '4', title: 'Competency Assessment', category: 'Learning competency mastery report for your classes', updatedAt: 'February 27, 2024', status: '1.5 MB' }
        ]
    });
});

app.post('/api/item-analysis/compute', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded. Use form-data field name "file".' });
    }

    try {
        const csvText = req.file.buffer.toString('utf-8');
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