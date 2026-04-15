export type TosAnalysisEntry = {
	itemNumber: number;
	contentArea: string;
	intervention: string;
};

export type LinkedTosRecord = {
	id: string;
	schoolYear: string;
	classValue: string;
	subject: string;
	quarter: string;
	totalItems: number;
	updatedAt: string;
	analysisEntries: TosAnalysisEntry[];
};

const LINKED_TOS_STORAGE_KEY = 'teacher-tos-linked-records';

function normalizeToken(value: string): string {
	return value.trim().toLowerCase();
}

function buildRecordId(classValue: string, subject: string, quarter: string): string {
	return `${normalizeToken(classValue)}::${normalizeToken(subject)}::${normalizeToken(quarter)}`;
}

export function getLinkedTosRecords(): LinkedTosRecord[] {
	try {
		const raw = localStorage.getItem(LINKED_TOS_STORAGE_KEY);
		if (!raw) {
			return [];
		}

		const parsed = JSON.parse(raw) as LinkedTosRecord[];
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.filter((record) => record && typeof record.classValue === 'string' && typeof record.subject === 'string' && typeof record.quarter === 'string')
			.map((record) => ({
				...record,
				id: buildRecordId(record.classValue, record.subject, record.quarter),
				analysisEntries: Array.isArray(record.analysisEntries) ? record.analysisEntries : []
			}));
	} catch {
		return [];
	}
}

export function upsertLinkedTosRecord(record: Omit<LinkedTosRecord, 'id' | 'updatedAt'>): LinkedTosRecord {
	const id = buildRecordId(record.classValue, record.subject, record.quarter);
	const nextRecord: LinkedTosRecord = {
		...record,
		id,
		updatedAt: new Date().toISOString()
	};

	const current = getLinkedTosRecords();
	const index = current.findIndex((item) => item.id === id);

	if (index >= 0) {
		current[index] = nextRecord;
	} else {
		current.push(nextRecord);
	}

	localStorage.setItem(LINKED_TOS_STORAGE_KEY, JSON.stringify(current));
	return nextRecord;
}

export function findLinkedTosRecord(classValue: string, subject: string, quarter: string): LinkedTosRecord | null {
	const targetId = buildRecordId(classValue, subject, quarter);
	return getLinkedTosRecords().find((record) => record.id === targetId) ?? null;
}
