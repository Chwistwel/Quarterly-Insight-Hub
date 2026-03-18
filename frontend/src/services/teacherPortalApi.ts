import { fetchJson } from './api';

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
	selectedGrade?: string;
	selectedQuarter?: string;
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
	classOptions?: string[];
	subjectOptions?: string[];
	selectedClass?: string;
	selectedSubject?: string;
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
	classSubjectMap?: Record<string, string[]>;
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
	firstName?: string;
	middleInitial?: string;
	lastName?: string;
	gender?: string;
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

export type StudentUpdatePayload = {
	firstName: string;
	middleInitial: string;
	lastName: string;
	gender: string;
	q1Score: number;
	q2Score: number;
	q3Score: number;
	q4Score: number;
};

export type AddStudentPayload = {
	firstName: string;
	middleName: string;
	lastName: string;
	gender: string;
};

function getTeacherAuthHeaders(): Record<string, string> {
	const role = localStorage.getItem('userRole') ?? '';
	const email = localStorage.getItem('userEmail') ?? '';
	return {
		'x-user-role': role,
		'x-user-email': email
	};
}

export async function getDashboardData(selectedGrade?: string, selectedQuarter?: string): Promise<DashboardResponse> {
	try {
		const params = new URLSearchParams();
		if (selectedGrade) {
			params.set('grade', selectedGrade);
		}
		if (selectedQuarter) {
			params.set('quarter', selectedQuarter);
		}

		const query = params.toString();
		return await fetchJson<DashboardResponse>(`/teacher/dashboard${query ? `?${query}` : ''}`, {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
	} catch {
		return {
			kpis: [],
			trend: [],
			highlights: []
		};
	}
}

export async function getItemAnalysisData(selectedClass?: string, selectedSubject?: string): Promise<ItemAnalysisResponse> {
	try {
		const params = new URLSearchParams();
		if (selectedClass) {
			params.set('class', selectedClass);
		}
		if (selectedSubject) {
			params.set('subject', selectedSubject);
		}

		const query = params.toString();
		const payload = await fetchJson<ItemAnalysisResponse>(`/teacher/item-analysis${query ? `?${query}` : ''}`, {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
		return payload;
	} catch {
		return {
			classOptions: [],
			subjectOptions: [],
			selectedClass: '',
			selectedSubject: '',
			rows: []
		};
	}
}

export async function getUploadMetaData(): Promise<UploadMetaResponse> {
	try {
		return await fetchJson<UploadMetaResponse>('/teacher/upload-meta', {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
	} catch {
		return {
			gradeLevels: [],
			subjects: [],
			quarters: [],
			recentUploads: []
		};
	}
}

export async function getReportsData(): Promise<ReportsResponse> {
	try {
		return await fetchJson<ReportsResponse>('/teacher/reports', {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
	} catch {
		return {
			actions: [],
			reports: []
		};
	}
}

export async function getMyClassesData(): Promise<TeacherClassSummary[]> {
	try {
		const payload = await fetchJson<{ classes: TeacherClassSummary[] }>('/teacher/my-classes', {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});

		if (!Array.isArray(payload.classes) || payload.classes.length === 0) {
			return [];
		}

		return payload.classes;
	} catch {
		return [];
	}
}

export async function getStudentManagementData(classId?: string): Promise<StudentManagementResponse> {
	const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
	try {
		return await fetchJson<StudentManagementResponse>(`/teacher/students${query}`, {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
	} catch {
		return {
			title: 'Student Management',
			systemLabel: 'MANAGE YOUR STUDENTS',
			classLabel: 'All Classes',
			students: []
		};
	}
}

export async function addStudentToClass(classId: string, payload: AddStudentPayload): Promise<void> {
	await fetchJson<{ message: string }>('/teacher/students', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getTeacherAuthHeaders()
		},
		body: JSON.stringify({ classId, ...payload })
	});
}

export async function updateStudentRecord(studentId: string, payload: StudentUpdatePayload): Promise<void> {
	await fetchJson<{ message: string }>(`/teacher/students/${encodeURIComponent(studentId)}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			...getTeacherAuthHeaders()
		},
		body: JSON.stringify(payload)
	});
}
