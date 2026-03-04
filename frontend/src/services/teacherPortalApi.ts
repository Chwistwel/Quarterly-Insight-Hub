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
	recentUploads: Array<{ fileName: string; status: string }>;
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
		status: string;
	}>;
};

export async function getDashboardData(): Promise<DashboardResponse> {
	return fetchJson<DashboardResponse>('/teacher/dashboard');
}

export async function getItemAnalysisData(): Promise<ItemAnalysisResponse> {
	return fetchJson<ItemAnalysisResponse>('/teacher/item-analysis');
}

export async function getUploadMetaData(): Promise<UploadMetaResponse> {
	return fetchJson<UploadMetaResponse>('/teacher/upload-meta');
}

export async function getReportsData(): Promise<ReportsResponse> {
	return fetchJson<ReportsResponse>('/teacher/reports');
}
