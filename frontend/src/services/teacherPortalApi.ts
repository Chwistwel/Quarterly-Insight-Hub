import { fetchJson } from './api';

const USE_TEACHER_MOCK_DATA = (import.meta.env.VITE_USE_TEACHER_MOCK_DATA ?? 'true').toLowerCase() !== 'false';

export type TeacherKpi = {
	label: string;
	value: string | number;
	description?: string;
};

export type TrendPoint = {
	label: string;
	value: number;
};

export type DashboardResponse = {
	title?: string;
	systemLabel?: string;
	viewLabel?: string;
	filters?: {
		grades: string[];
		quarters: string[];
	};
	kpis: TeacherKpi[];
	trend: TrendPoint[];
	trendSubtitle?: string;
	highlights: Array<{ label: string; value: string | number }>;
	topStudents?: Array<{
		name: string;
		improvement: string | number;
		score: string | number;
	}>;
	improvementAreas?: Array<{
		area: string;
		value: string | number;
	}>;
};

export type ItemAnalysisRow = {
	itemNo: string | number;
	difficultyIndex: number | string;
	discriminationIndex: number | string;
	interpretation: string;
};

export type ItemAnalysisResponse = {
	title?: string;
	systemLabel?: string;
	viewLabel?: string;
	grade?: string;
	section?: string;
	subject?: string;
	classAverage?: string | number;
	averageIndex?: string | number;
	totalStudents?: string | number;
	totalItems?: number;
	rows: ItemAnalysisRow[];
};

export type UploadMetaResponse = {
	title?: string;
	systemLabel?: string;
	viewLabel?: string;
	titleSuffix?: string;
	gradeLevels: string[];
	subjects: string[];
	quarters: string[];
	fileFormats?: string[];
	requiredColumns?: string[];
	processingTime?: string;
	recentUploads: Array<{ fileName: string; status: string; uploadedAt?: string }>;
};

export type ReportsResponse = {
	title?: string;
	systemLabel?: string;
	viewLabel?: string;
	subtitle?: string;
	actions?: Array<{
		id: string;
		title: string;
		description: string;
		buttonLabel: string;
	}>;
	summary?: string;
	reports: Array<{
		id: string;
		title: string;
		category: string;
		updatedAt: string;
		size: string;
	}>;
};

export type TeacherClassSummary = {
	id: string;
	grade: string;
	section: string;
	subject: string;
	studentCount: number;
	teacher: string;
	gradeTag: string;
};

export type StudentRecord = {
	id: string;
	name: string;
	grade: string;
	section: string;
	q1Score: number;
	q2Score: number;
	q3Score: number;
	q4Score: number;
	average: string;
	classId: string;
	subject: string;
};

export type StudentManagementResponse = {
	title?: string;
	systemLabel?: string;
	viewLabel?: string;
	classLabel?: string;
	students: StudentRecord[];
};

const dashboardMockData: DashboardResponse = {
	title: 'My Dashboard',
	systemLabel: 'QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM',
	filters: {
		grades: ['Grade 7 - Section A', 'Grade 7 - Section B', 'Grade 8 - Section A'],
		quarters: ['Q1', 'Q2', 'Q3', 'Q4']
	},
	kpis: [
		{ label: 'Class Average', value: '76.8%', description: '+2.3% from last quarter' },
		{ label: 'Pass Rate', value: '79%', description: '34 of 43 students' },
		{ label: 'My Students', value: 43, description: 'Grade 7 - Section A' },
		{ label: 'Items Analyzed', value: 50, description: 'Math Q1 Exam' }
	],
	trend: [
		{ label: 'Q1', value: 76 },
		{ label: 'Q2', value: 78 },
		{ label: 'Q3', value: 82 },
		{ label: 'Q4', value: 86 }
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
};

const itemAnalysisMockData: ItemAnalysisResponse = {
	title: 'My Item Analysis - Grade 7',
	systemLabel: 'COMPREHENSIVE ITEM ANALYSIS',
	grade: 'Grade 7',
	section: 'Section A',
	subject: 'Mathematics',
	classAverage: '78.5%',
	averageIndex: '82%',
	totalStudents: 45,
	rows: [
		{ itemNo: 1, difficultyIndex: 0.75, discriminationIndex: 0.68, interpretation: 'Good' },
		{ itemNo: 2, difficultyIndex: 0.82, discriminationIndex: 0.51, interpretation: 'Fair' },
		{ itemNo: 3, difficultyIndex: 0.68, discriminationIndex: 0.72, interpretation: 'Good' },
		{ itemNo: 4, difficultyIndex: 0.48, discriminationIndex: 0.81, interpretation: 'Excellent' },
		{ itemNo: 5, difficultyIndex: 0.52, discriminationIndex: 0.42, interpretation: 'Poor' },
		{ itemNo: 6, difficultyIndex: 0.75, discriminationIndex: 0.65, interpretation: 'Good' }
	]
};

const uploadMetaMockData: UploadMetaResponse = {
	title: 'Upload Quarterly Exam Results - Q2',
	systemLabel: 'UPLOAD AND ANALYZE STUDENT PERFORMANCE DATA',
	gradeLevels: ['Grade 7 - Section A', 'Grade 7 - Section B', 'Grade 8 - Section A'],
	subjects: ['Mathematics', 'Science', 'English'],
	quarters: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'],
	fileFormats: ['CSV', 'Excel'],
	requiredColumns: ['Student ID', 'Student Name', 'Item Responses (1-50)', 'Answer Key'],
	processingTime: 'Analysis typically takes 5-10 minutes depending on the number of students.',
	recentUploads: [
		{ fileName: 'Mathematics - Grade 7-A', uploadedAt: '2024-02-28', status: 'Completed' },
		{ fileName: 'Mathematics - Grade 7-B', uploadedAt: '2024-02-27', status: 'Completed' },
		{ fileName: 'Mathematics - Grade 8-A', uploadedAt: '2024-02-26', status: 'Completed' }
	]
};

const reportsMockData: ReportsResponse = {
	title: 'My Reports',
	systemLabel: 'REPORT GENERATION CENTER',
	subtitle: 'Generate and download reports for your classes and student performance',
	actions: [
		{
			id: 'class-reports',
			title: 'Class Reports',
			description: 'Generate performance reports for your classes',
			buttonLabel: 'Generate Report'
		},
		{
			id: 'student-progress',
			title: 'Student Progress',
			description: 'Track individual student performance trends',
			buttonLabel: 'View Progress'
		},
		{
			id: 'item-analysis',
			title: 'Item Analysis',
			description: 'Detailed item-level analysis reports',
			buttonLabel: 'Generate'
		}
	],
	reports: [
		{
			id: 'class-performance',
			title: 'My Class Performance Report',
			category: 'Detailed analysis of your class performance for Q2',
			updatedAt: 'March 1, 2024',
			size: '2.4 MB'
		},
		{
			id: 'student-progress',
			title: 'Student Progress Report',
			category: 'Individual student progress tracking for Grade 7-A',
			updatedAt: 'March 1, 2024',
			size: '1.8 MB'
		},
		{
			id: 'item-analysis',
			title: 'Item Analysis Summary',
			category: 'Comprehensive item analysis for Mathematics Q2',
			updatedAt: 'February 28, 2024',
			size: '1.2 MB'
		},
		{
			id: 'competency-assessment',
			title: 'Competency Assessment',
			category: 'Learning competency mastery report for your classes',
			updatedAt: 'February 27, 2024',
			size: '1.5 MB'
		}
	]
};

const myClassesMockData: TeacherClassSummary[] = [
	{ id: 'grade7-sectionA', grade: 'Grade 7', section: 'Section A', subject: 'Mathematics', studentCount: 43, teacher: 'Ms. Sarah Johnson', gradeTag: 'Grade 7' },
	{ id: 'grade7-sectionB', grade: 'Grade 7', section: 'Section B', subject: 'Mathematics', studentCount: 45, teacher: 'Ms. Sarah Johnson', gradeTag: 'Grade 7' },
	{ id: 'grade8-sectionA', grade: 'Grade 8', section: 'Section A', subject: 'Mathematics', studentCount: 38, teacher: 'Ms. Sarah Johnson', gradeTag: 'Grade 8' },
	{ id: 'grade8-sectionB', grade: 'Grade 8', section: 'Section B', subject: 'Science', studentCount: 42, teacher: 'Mr. David Lee', gradeTag: 'Grade 8' }
];

const studentsMockData: StudentRecord[] = [
	{ id: 's-001', name: 'Maria Santos', grade: 'Grade 7', section: 'Section A', q1Score: 95, q2Score: 92, q3Score: 94, q4Score: 93, average: '93.5%', classId: 'grade7-sectionA', subject: 'Mathematics' },
	{ id: 's-002', name: 'Juan Dela Cruz', grade: 'Grade 7', section: 'Section A', q1Score: 92, q2Score: 88, q3Score: 90, q4Score: 90, average: '90.0%', classId: 'grade7-sectionA', subject: 'Mathematics' },
	{ id: 's-003', name: 'Anna Reyes', grade: 'Grade 7', section: 'Section A', q1Score: 90, q2Score: 93, q3Score: 92, q4Score: 91, average: '91.5%', classId: 'grade7-sectionA', subject: 'Mathematics' },
	{ id: 's-004', name: 'Carlos Garcia', grade: 'Grade 7', section: 'Section B', q1Score: 88, q2Score: 85, q3Score: 87, q4Score: 86, average: '86.5%', classId: 'grade7-sectionB', subject: 'Mathematics' },
	{ id: 's-005', name: 'Lisa Mendoza', grade: 'Grade 8', section: 'Section A', q1Score: 87, q2Score: 90, q3Score: 89, q4Score: 88, average: '88.5%', classId: 'grade8-sectionA', subject: 'Mathematics' },
	{ id: 's-006', name: 'Kevin Cruz', grade: 'Grade 8', section: 'Section B', q1Score: 84, q2Score: 89, q3Score: 86, q4Score: 87, average: '86.5%', classId: 'grade8-sectionB', subject: 'Science' }
];

function hasItems<T>(values: T[] | undefined): boolean {
	return Array.isArray(values) && values.length > 0;
}

function getTeacherAuthHeaders(): Record<string, string> {
	const role = localStorage.getItem('userRole') ?? '';
	const email = localStorage.getItem('userEmail') ?? '';
	return {
		'x-user-role': role,
		'x-user-email': email
	};
}

export async function getDashboardData(): Promise<DashboardResponse> {
	if (USE_TEACHER_MOCK_DATA) {
		return dashboardMockData;
	}

	try {
		const payload = await fetchJson<DashboardResponse>('/teacher/dashboard');
		if (!hasItems(payload.kpis) || !hasItems(payload.trend)) {
			return dashboardMockData;
		}
		return payload;
	} catch {
		return dashboardMockData;
	}
}

export async function getItemAnalysisData(): Promise<ItemAnalysisResponse> {
	if (USE_TEACHER_MOCK_DATA) {
		return itemAnalysisMockData;
	}

	try {
		const payload = await fetchJson<ItemAnalysisResponse>('/teacher/item-analysis');
		if (!hasItems(payload.rows)) {
			return itemAnalysisMockData;
		}
		return payload;
	} catch {
		return itemAnalysisMockData;
	}
}

export async function getUploadMetaData(): Promise<UploadMetaResponse> {
	if (USE_TEACHER_MOCK_DATA) {
		return uploadMetaMockData;
	}

	try {
		const payload = await fetchJson<UploadMetaResponse>('/teacher/upload-meta');
		if (!hasItems(payload.gradeLevels) || !hasItems(payload.recentUploads)) {
			return uploadMetaMockData;
		}
		return payload;
	} catch {
		return uploadMetaMockData;
	}
}

export async function getReportsData(): Promise<ReportsResponse> {
	if (USE_TEACHER_MOCK_DATA) {
		return reportsMockData;
	}

	try {
		const payload = await fetchJson<ReportsResponse>('/teacher/reports');
		if (!hasItems(payload.actions) || !hasItems(payload.reports)) {
			return reportsMockData;
		}
		return payload;
	} catch {
		return reportsMockData;
	}
}

export async function getMyClassesData(): Promise<TeacherClassSummary[]> {
	try {
		const payload = await fetchJson<{ classes: TeacherClassSummary[] }>('/teacher/my-classes', {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});

		if (!hasItems(payload.classes)) {
			return [];
		}

		return payload.classes;
	} catch {
		return USE_TEACHER_MOCK_DATA ? myClassesMockData : [];
	}
}

export async function getStudentManagementData(classId?: string): Promise<StudentManagementResponse> {
	const selectedClass = myClassesMockData.find((item) => item.id === classId);
	const students = classId ? studentsMockData.filter((item) => item.classId === classId) : studentsMockData;

	return {
		title: 'Student Management',
		systemLabel: 'MANAGE YOUR STUDENTS',
		classLabel: selectedClass ? `${selectedClass.grade} - ${selectedClass.section} (${selectedClass.subject})` : 'All Classes',
		students
	};
}
