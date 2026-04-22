import { fetchJson, getApiUrl } from './api';

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
	selectedQuarter?: string;
	classOptions?: string[];
	subjectOptions?: string[];
	selectedClass?: string;
	selectedSubject?: string;
	classAverage?: string | number;
	averageIndex?: string | number;
	totalStudents?: string | number;
	totalItems?: number;
	studentIdentityLinks?: Array<{
		uploadedStudentName: string;
		rank: number;
		totalScore: number;
		matchedStudentId?: string | null;
		matchedFirstName?: string | null;
		matchedLastName?: string | null;
		matchType?: string;
	}>;
	studentResults?: Array<{
		studentId?: string;
		studentName: string;
		totalScore: number;
		rank: number;
	}>;
	studentItemResults?: Array<{
		studentId?: string;
		studentName: string;
		totalScore: number;
		rank: number;
		itemResults: Array<{
			itemNo: number;
			item: string;
			score: number;
			interpretation: string;
		}>;
	}>;
	classStudents?: Array<{
		id: string;
		name: string;
		firstName: string;
		lastName: string;
		studentNo?: string;
	}>;
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
	ranking: number;
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

export type UploadClassListResult = {
	message: string;
	addedCount: number;
	skippedCount: number;
	processedCount: number;
};

export type TosBloomKey = 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating';

export type TosRowPayload = {
	id: number;
	competency: string;
	days: number;
	percentage: number;
	counts: Record<TosBloomKey, number>;
};

export type TosBlueprintPayload = {
	schoolYear: string;
	quarter: string;
	classValue: string;
	subject: string;
	totalDays: number;
	totalItems: number;
	objectiveCount: number;
	bloomWeights: Record<TosBloomKey, number>;
	rows: TosRowPayload[];
};

export type TosBlueprintRecord = TosBlueprintPayload & {
	version: number;
	historyCount: number;
};

export type TosBlueprintHistoryEntry = TosBlueprintPayload & {
	id: string;
	version: number;
	savedAt: string;
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

export async function submitTeacherItemAnalysis(payload: {
	classValue: string;
	subject: string;
	quarter: string;
	file: File;
}): Promise<void> {
	const formData = new FormData();
	formData.append('file', payload.file);
	formData.append('class', payload.classValue);
	formData.append('subject', payload.subject);
	formData.append('quarter', payload.quarter);

	const response = await fetch(getApiUrl('/api/item-analysis/compute'), {
		method: 'POST',
		body: formData,
		headers: getTeacherAuthHeaders()
	});

	if (!response.ok) {
		const responseText = await response.text();
		let errorMessage = `Upload failed (${response.status})`;

		if (responseText.trim()) {
			try {
				const errorData = JSON.parse(responseText) as { message?: string };
				errorMessage = errorData.message ?? errorMessage;
			} catch {
				errorMessage = responseText;
			}
		}

		throw new Error(errorMessage);
	}
}

export async function deleteTeacherItemAnalysis(classValue: string, subject: string): Promise<void> {
	const params = new URLSearchParams({ class: classValue, subject });
	await fetchJson<{ message: string }>(`/teacher/item-analysis?${params.toString()}`, {
		method: 'DELETE',
		headers: getTeacherAuthHeaders()
	});
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

export async function deleteTeacherClass(classId: string): Promise<void> {
	await fetchJson<{ message: string }>(`/teacher/my-classes/${encodeURIComponent(classId)}`, {
		method: 'DELETE',
		headers: getTeacherAuthHeaders()
	});
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

export async function deleteStudentRecord(studentId: string): Promise<void> {
	await fetchJson<{ message: string }>(`/teacher/students/${encodeURIComponent(studentId)}`, {
		method: 'DELETE',
		headers: getTeacherAuthHeaders()
	});
}

export async function uploadStudentClassList(classId: string, file: File): Promise<UploadClassListResult> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('classId', classId);

	const response = await fetch(getApiUrl('/teacher/students/upload-class-list'), {
		method: 'POST',
		body: formData,
		headers: getTeacherAuthHeaders()
	});

	if (!response.ok) {
		const responseText = await response.text();
		let errorMessage = `Class list upload failed (${response.status})`;

		if (responseText.trim()) {
			try {
				const errorData = JSON.parse(responseText) as { message?: string };
				errorMessage = errorData.message ?? errorMessage;
			} catch {
				errorMessage = responseText;
			}
		}

		throw new Error(errorMessage);
	}

	return response.json() as Promise<UploadClassListResult>;
}

export async function getTeacherTosBlueprint(query: Pick<TosBlueprintPayload, 'schoolYear' | 'quarter' | 'classValue' | 'subject'>): Promise<TosBlueprintRecord | null> {
	const params = new URLSearchParams(query as Record<string, string>);
	try {
		const payload = await fetchJson<{ blueprint: TosBlueprintRecord }>(`/teacher/tos?${params.toString()}`, {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
		return payload.blueprint;
	} catch {
		return null;
	}
}

export async function getTeacherTosBlueprintHistory(query: Pick<TosBlueprintPayload, 'schoolYear' | 'quarter' | 'classValue' | 'subject'>): Promise<TosBlueprintHistoryEntry[]> {
	const params = new URLSearchParams(query as Record<string, string>);
	try {
		const payload = await fetchJson<{ history: TosBlueprintHistoryEntry[] }>(`/teacher/tos/history?${params.toString()}`, {
			method: 'GET',
			headers: getTeacherAuthHeaders()
		});
		return Array.isArray(payload.history) ? payload.history : [];
	} catch {
		return [];
}
}

export async function deleteTeacherTosHistoryEntry(historyId: string): Promise<void> {
	await fetchJson<{ message: string }>(`/teacher/tos/history/${encodeURIComponent(historyId)}`, {
		method: 'DELETE',
		headers: getTeacherAuthHeaders()
	});
}

export async function saveTeacherTosBlueprint(payload: TosBlueprintPayload): Promise<TosBlueprintRecord> {
	const response = await fetchJson<{ message: string; blueprint: TosBlueprintRecord; savedAt: string }>('/teacher/tos', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getTeacherAuthHeaders()
		},
		body: JSON.stringify(payload)
	});

	return response.blueprint;
}
