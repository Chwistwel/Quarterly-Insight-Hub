import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TrashIcon, PlusIcon, EditIcon, CloseIcon } from '../../components/icons';
import TeacherLayout from './TeacherLayout';
import {
	deleteTeacherTosHistoryEntry,
	getTeacherTosBlueprint,
	getTeacherTosBlueprintHistory,
	getTeacherTosCreatedOptions,
	getUploadMetaData,
	saveTeacherTosBlueprint,
	type TosBlueprintHistoryEntry,
	type TosBlueprintOptionsResponse,
	type TosBlueprintPayload,
	type UploadMetaResponse
} from '../../services/teacherPortalApi';
import '../../styles/TEACHER/TOSBuilder.css';

type BloomKey = 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating';

type TosRow = {
	id: number;
	topic?: string;
	competency: string;
	days: number;
	percentage: number;
	counts: Record<BloomKey, number>;
};

const BLOOM_ORDER: BloomKey[] = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];

const BLOOM_LABELS: Record<BloomKey, string> = {
	remembering: 'Remembering',
	understanding: 'Understanding',
	applying: 'Applying',
	analyzing: 'Analyzing',
	evaluating: 'Evaluating',
	creating: 'Creating'
};

const DEFAULT_BLOOM_WEIGHTS: Record<BloomKey, number> = {
	remembering: 10,
	understanding: 15,
	applying: 25,
	analyzing: 25,
	evaluating: 20,
	creating: 5
};

const STORAGE_KEY = 'teacher-tos-builder-draft';

function normalizeTextToken(value: string): string {
	return value.trim().toLowerCase();
}

function normalizeQuarter(value: string): string {
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
}

function buildQuarterDraftStorageKey(classValue: string, subject: string, quarter: string): string {
	return [
		STORAGE_KEY,
		normalizeTextToken(classValue),
		normalizeTextToken(subject),
		normalizeQuarter(quarter)
	].join('::');
}

function saveBlueprintDraft(blueprintPayload: TosBlueprintPayload): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprintPayload));

	if (blueprintPayload.classValue && blueprintPayload.subject && blueprintPayload.quarter) {
		localStorage.setItem(
			buildQuarterDraftStorageKey(blueprintPayload.classValue, blueprintPayload.subject, blueprintPayload.quarter),
			JSON.stringify(blueprintPayload)
		);
	}
}

function formatSavedAtLabel(savedAt: string): string {
	const date = new Date(savedAt);
	if (Number.isNaN(date.getTime())) {
		return savedAt;
	}

	return date.toLocaleString([], {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function createEmptyRow(index: number): TosRow {
	return {
		id: index + 1,
		topic: '',
		competency: `Objective ${index + 1}`,
		days: 0,
		percentage: 0,
		counts: {
			remembering: 0,
			understanding: 0,
			applying: 0,
			analyzing: 0,
			evaluating: 0,
			creating: 0
		}
	};
}

function sanitizeNumber(value: number): number {
	if (!Number.isFinite(value) || Number.isNaN(value)) {
		return 0;
	}
	return Math.max(0, value);
}

function allocateByWeights(total: number, weights: number[]): number[] {
	if (total <= 0 || weights.length === 0) {
		return new Array(weights.length).fill(0);
	}

	const safeWeights = weights.map((weight) => Math.max(0, weight));
	const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0);

	if (weightSum === 0) {
		const evenWeight = new Array(weights.length).fill(1);
		return allocateByWeights(total, evenWeight);
	}

	const rawValues = safeWeights.map((weight) => (weight / weightSum) * total);
	const floored = rawValues.map((value) => Math.floor(value));
	let remainder = total - floored.reduce((sum, value) => sum + value, 0);

	const rankedFractions = rawValues
		.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
		.sort((a, b) => b.fraction - a.fraction);

	for (let i = 0; i < rankedFractions.length && remainder > 0; i += 1) {
		floored[rankedFractions[i].index] += 1;
		remainder -= 1;
	}

	return floored;
}

function buildInitialRows(count: number): TosRow[] {
	return Array.from({ length: count }, (_, index) => createEmptyRow(index));
}

function getRowDistributionWeights(rows: TosRow[]): number[] {
	const itemWeights = rows.map((row) => BLOOM_ORDER.reduce((sum, key) => sum + row.counts[key], 0));
	const totalItems = itemWeights.reduce((sum, value) => sum + value, 0);
	if (totalItems > 0) {
		return itemWeights;
	}

	const percentWeights = rows.map((row) => sanitizeNumber(row.percentage));
	const totalPercent = percentWeights.reduce((sum, value) => sum + value, 0);
	if (totalPercent > 0) {
		return percentWeights;
	}

	return rows.map(() => 1);
}

function applyDaysFromDistribution(rows: TosRow[], totalDays: number): TosRow[] {
	const safeTotalDays = Math.max(1, Math.floor(sanitizeNumber(totalDays)));
	const weights = getRowDistributionWeights(rows);
	const daysAllocation = allocateByWeights(safeTotalDays, weights);

	return rows.map((row, index) => {
		const days = daysAllocation[index] ?? 0;
		const percentage = Number(((days / safeTotalDays) * 100).toFixed(2));
		return {
			...row,
			days,
			percentage
		};
	});
}

function TOSBuilder() {
	const navigate = useNavigate();
	const location = useLocation();
	const locationState = (location.state as {
		prefill?: Pick<TosBlueprintPayload, 'schoolYear' | 'classValue' | 'subject' | 'quarter'>;
	} | null) ?? null;
	const [schoolYear, setSchoolYear] = useState('2025-2026');
	const [quarter, setQuarter] = useState('1st Quarter');
	const [subject, setSubject] = useState('');
	const [classValue, setClassValue] = useState('');
	const [totalDays, setTotalDays] = useState(48);
	const [totalItems, setTotalItems] = useState(40);
	const [objectiveCount, setObjectiveCount] = useState(8);
	const [rows, setRows] = useState<TosRow[]>(() => buildInitialRows(8));
	const [bloomWeights, setBloomWeights] = useState<Record<BloomKey, number>>(DEFAULT_BLOOM_WEIGHTS);
	const [statusMessage, setStatusMessage] = useState('');
	const [uploadMeta, setUploadMeta] = useState<UploadMetaResponse | null>(null);
	const [lastSavedAt, setLastSavedAt] = useState<string>('');
	const [savedHistory, setSavedHistory] = useState<TosBlueprintHistoryEntry[]>([]);
	const [loadingSavedHistory, setLoadingSavedHistory] = useState(false);
	const [savingTos, setSavingTos] = useState(false);
	const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
	const [deletingHistoryId, setDeletingHistoryId] = useState<string>('');
	const [historySortBy, setHistorySortBy] = useState<'date' | 'subject' | 'class'>('date');
	const [tosCreatedOptions, setTosCreatedOptions] = useState<TosBlueprintOptionsResponse>({
		combinations: [],
		classOptions: [],
		subjectOptions: [],
		quarterOptions: []
	});
	const [landingClass, setLandingClass] = useState('');
	const [landingSubject, setLandingSubject] = useState('');
	const [landingQuarter, setLandingQuarter] = useState('');
	const [landingHistoryCount, setLandingHistoryCount] = useState(0);
	const isCreatePage = location.pathname.endsWith('/create');

	const sortedHistory = useMemo(() => {
		const sorted = [...savedHistory];
		switch (historySortBy) {
			case 'date':
				return sorted.sort((first, second) => new Date(second.savedAt).getTime() - new Date(first.savedAt).getTime());
			case 'subject':
				return sorted.sort((first, second) => first.subject.localeCompare(second.subject));
			case 'class':
				return sorted.sort((first, second) => first.classValue.localeCompare(second.classValue));
			default:
				return sorted;
		}
	}, [savedHistory, historySortBy]);

	useEffect(() => {
		const loadUploadMeta = async () => {
			try {
				const response = await getUploadMetaData();
				setUploadMeta(response);
			} catch {
				setUploadMeta(null);
			}
		};

		void loadUploadMeta();
	}, []);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) {
				return;
			}

			const draft = JSON.parse(raw) as {
				schoolYear?: string;
				quarter?: string;
				subject?: string;
				classValue?: string;
				totalDays?: number;
				totalItems?: number;
				objectiveCount?: number;
				rows?: TosRow[];
				bloomWeights?: Record<BloomKey, number>;
			};

			if (draft.schoolYear) setSchoolYear(draft.schoolYear);
			if (draft.quarter) setQuarter(draft.quarter);
			if (draft.subject) setSubject(draft.subject);
			if (draft.classValue) setClassValue(draft.classValue);
			if (typeof draft.totalDays === 'number') setTotalDays(sanitizeNumber(draft.totalDays));
			if (typeof draft.totalItems === 'number') setTotalItems(sanitizeNumber(draft.totalItems));
			if (typeof draft.objectiveCount === 'number') setObjectiveCount(Math.max(1, Math.floor(draft.objectiveCount)));

			if (Array.isArray(draft.rows) && draft.rows.length > 0) {
				setRows(draft.rows.map((row, index) => ({
					id: index + 1,
					topic: row.topic || '',
					competency: row.competency || `Objective ${index + 1}`,
					days: sanitizeNumber(row.days),
					percentage: sanitizeNumber(row.percentage),
					counts: {
						remembering: sanitizeNumber(row.counts?.remembering ?? 0),
						understanding: sanitizeNumber(row.counts?.understanding ?? 0),
						applying: sanitizeNumber(row.counts?.applying ?? 0),
						analyzing: sanitizeNumber(row.counts?.analyzing ?? 0),
						evaluating: sanitizeNumber(row.counts?.evaluating ?? 0),
						creating: sanitizeNumber(row.counts?.creating ?? 0)
					}
				})));
			}

			if (draft.bloomWeights) {
				setBloomWeights({
					remembering: sanitizeNumber(draft.bloomWeights.remembering ?? DEFAULT_BLOOM_WEIGHTS.remembering),
					understanding: sanitizeNumber(draft.bloomWeights.understanding ?? DEFAULT_BLOOM_WEIGHTS.understanding),
					applying: sanitizeNumber(draft.bloomWeights.applying ?? DEFAULT_BLOOM_WEIGHTS.applying),
					analyzing: sanitizeNumber(draft.bloomWeights.analyzing ?? DEFAULT_BLOOM_WEIGHTS.analyzing),
					evaluating: sanitizeNumber(draft.bloomWeights.evaluating ?? DEFAULT_BLOOM_WEIGHTS.evaluating),
					creating: sanitizeNumber(draft.bloomWeights.creating ?? DEFAULT_BLOOM_WEIGHTS.creating)
				});
			}
		} catch {
			setStatusMessage('Previous draft could not be loaded.');
		}
	}, []);

	useEffect(() => {
		if (!isCreatePage) {
			return;
		}

		handleCreateDraft();
		if (locationState?.prefill) {
			setSchoolYear(locationState.prefill.schoolYear || '2025-2026');
			setClassValue(locationState.prefill.classValue || '');
			setSubject(locationState.prefill.subject || '');
			setQuarter(locationState.prefill.quarter || '1st Quarter');
		}
		// Fresh create pages should always start from a blank builder state.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isCreatePage, locationState]);

	useEffect(() => {
		if (isCreatePage) {
			return;
		}

		const loadCreatedOptions = async () => {
			const options = await getTeacherTosCreatedOptions();
			setTosCreatedOptions(options);
		};

		void loadCreatedOptions();
	}, [isCreatePage]);

	// If no landing filters are selected, default to the first available saved TOS
	useEffect(() => {
		if (isCreatePage) return;
		if (landingClass || landingSubject || landingQuarter) return; // user already selected
		const combos = tosCreatedOptions.combinations ?? [];
		if (!combos.length) return;
		const first = combos[0];
		if (!first) return;
		setLandingClass(first.classValue || '');
		setLandingSubject(first.subject || '');
		setLandingQuarter(first.quarter || '');
	}, [isCreatePage, tosCreatedOptions, landingClass, landingSubject, landingQuarter]);

	const landingSubjectOptions = useMemo(() => {
		if (!landingClass) {
			return tosCreatedOptions.subjectOptions;
		}

		return Array.from(
			new Set(
				tosCreatedOptions.combinations
					.filter((entry) => entry.classValue === landingClass)
					.map((entry) => entry.subject)
			)
		);
	}, [landingClass, tosCreatedOptions]);

	const landingQuarterOptions = useMemo(() => {
		return Array.from(
			new Set(
				tosCreatedOptions.combinations
					.filter((entry) => (!landingClass || entry.classValue === landingClass) && (!landingSubject || entry.subject === landingSubject))
					.map((entry) => entry.quarter)
			)
		);
	}, [landingClass, landingSubject, tosCreatedOptions]);

	const [landingBlueprint, setLandingBlueprint] = useState<TosBlueprintPayload | null>(null);
	const [loadingLandingBlueprint, setLoadingLandingBlueprint] = useState(false);

	useEffect(() => {
		let active = true;
		if (!landingClass || !landingSubject || !landingQuarter) {
			setLandingBlueprint(null);
			setLandingHistoryCount(0);
			return;
		}

		const load = async () => {
			setLoadingLandingBlueprint(true);
			try {
				const matched = tosCreatedOptions.combinations.find((entry) => (
					entry.classValue === landingClass && entry.subject === landingSubject && entry.quarter === landingQuarter
				));

				const schoolYearToUse = matched?.schoolYear || '2025-2026';
				const query = { schoolYear: schoolYearToUse, classValue: landingClass, subject: landingSubject, quarter: landingQuarter };
				const [blueprint, history] = await Promise.all([
					getTeacherTosBlueprint(query),
					getTeacherTosBlueprintHistory(query)
				]);
				if (!active) return;
				setLandingBlueprint(blueprint ?? null);
				setLandingHistoryCount(history.length);
			} catch {
				if (active) {
					setLandingBlueprint(null);
					setLandingHistoryCount(0);
				}
			} finally {
				if (active) setLoadingLandingBlueprint(false);
			}
		};

		void load();

		return () => { active = false; };
	}, [landingClass, landingSubject, landingQuarter, tosCreatedOptions]);

	const handleLandingCreate = () => {
		navigate('/teacher/tos-builder/create');
	};

	const handleOpenSaved = () => {
		const matched = tosCreatedOptions.combinations.find((entry) => (
			(!landingClass || entry.classValue === landingClass)
			&& (!landingSubject || entry.subject === landingSubject)
			&& (!landingQuarter || entry.quarter === landingQuarter)
		));

		navigate('/teacher/tos-builder/create', {
			state: {
				prefill: {
					schoolYear: matched?.schoolYear || '2025-2026',
					classValue: landingClass,
					subject: landingSubject,
					quarter: landingQuarter || '1st Quarter'
				}
			}
		});
	};

	const handleToggleBuilderPage = () => {
		navigate(isCreatePage ? '/teacher/tos-builder' : '/teacher/tos-builder/create');
	};

	const handleDeleteLandingSaved = async () => {
		if (!landingClass || !landingSubject || !landingQuarter || !landingBlueprint) {
			return;
		}

		const shouldDelete = window.confirm('Delete the latest saved TOS for this class, subject, and quarter?');
		if (!shouldDelete) {
			return;
		}

		setLoadingLandingBlueprint(true);
		try {
			const query = { schoolYear: landingBlueprint.schoolYear, classValue: landingClass, subject: landingSubject, quarter: landingQuarter };

			const history = await getTeacherTosBlueprintHistory(query);
			const latestEntry = [...history].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
			if (!latestEntry) {
				setStatusMessage('No saved TOS version found to delete.');
				return;
			}

			await deleteTeacherTosHistoryEntry(latestEntry.id);

			const [nextBlueprint, nextHistory, refreshedOptions] = await Promise.all([
				getTeacherTosBlueprint(query),
				getTeacherTosBlueprintHistory(query),
				getTeacherTosCreatedOptions()
			]);

			setLandingBlueprint(nextBlueprint ?? null);
			setLandingHistoryCount(nextHistory.length);
			setTosCreatedOptions(refreshedOptions);
			setStatusMessage('Latest saved TOS version deleted.');
		} catch (error) {
			setStatusMessage(error instanceof Error ? error.message : 'Unable to delete the saved TOS version.');
		} finally {
			setLoadingLandingBlueprint(false);
		}
	};

	useEffect(() => {
		if (!schoolYear || !classValue || !subject || !quarter) {
			setSavedHistory([]);
			return;
		}

		let isActive = true;
		const query = { schoolYear, classValue, subject, quarter };

		const loadSavedTos = async () => {
			setLoadingSavedHistory(true);
			try {
				const [savedBlueprint, history] = await Promise.all([
					getTeacherTosBlueprint(query),
					getTeacherTosBlueprintHistory(query)
				]);

				if (!isActive) {
					return;
				}

				if (savedBlueprint) {
					setSchoolYear(savedBlueprint.schoolYear || schoolYear);
					setQuarter(savedBlueprint.quarter || quarter);
					setClassValue(savedBlueprint.classValue || classValue);
					setSubject(savedBlueprint.subject || subject);
					setTotalDays(Math.max(1, Math.floor(savedBlueprint.totalDays || totalDays)));
					setTotalItems(Math.max(1, Math.floor(savedBlueprint.totalItems || totalItems)));
					setObjectiveCount(Math.max(1, Math.floor(savedBlueprint.objectiveCount || objectiveCount)));
					setBloomWeights(savedBlueprint.bloomWeights ?? DEFAULT_BLOOM_WEIGHTS);

					if (Array.isArray(savedBlueprint.rows) && savedBlueprint.rows.length > 0) {
						setRows(savedBlueprint.rows.map((row, index) => ({
							id: index + 1,
							topic: row.topic || '',
							competency: row.competency || `Objective ${index + 1}`,
							days: sanitizeNumber(row.days),
							percentage: sanitizeNumber(row.percentage),
							counts: {
								remembering: sanitizeNumber(row.counts?.remembering ?? 0),
								understanding: sanitizeNumber(row.counts?.understanding ?? 0),
								applying: sanitizeNumber(row.counts?.applying ?? 0),
								analyzing: sanitizeNumber(row.counts?.analyzing ?? 0),
								evaluating: sanitizeNumber(row.counts?.evaluating ?? 0),
								creating: sanitizeNumber(row.counts?.creating ?? 0)
							}
						})));
					}
					setLastSavedAt(formatSavedAtLabel(history[0]?.savedAt ?? new Date().toISOString()));
				}

				setSavedHistory(history);
			} catch {
				if (isActive) {
					setSavedHistory([]);
				}
			} finally {
				if (isActive) {
					setLoadingSavedHistory(false);
				}
			}
		};

		void loadSavedTos();

		return () => {
			isActive = false;
		};
	}, [schoolYear, classValue, subject, quarter]);

	useEffect(() => {
		setRows((currentRows) => {
			const targetCount = Math.max(1, objectiveCount);
			if (currentRows.length === targetCount) {
				return applyDaysFromDistribution(currentRows, totalDays);
			}

			const resizedRows = Array.from({ length: targetCount }, (_, index) => {
				const existing = currentRows[index];
				if (existing) {
					return { ...existing, id: index + 1, competency: existing.competency || `Objective ${index + 1}` };
				}
				return createEmptyRow(index);
			});

			return applyDaysFromDistribution(resizedRows, totalDays);
		});
	}, [objectiveCount, totalDays]);

	useEffect(() => {
		setRows((currentRows) => applyDaysFromDistribution(currentRows, totalDays));
	}, [totalDays]);

	useEffect(() => {
		if (!isCreatePage) {
			return;
		}

		const blueprintPayload: TosBlueprintPayload = {
			schoolYear,
			quarter,
			classValue,
			subject,
			totalDays,
			totalItems,
			objectiveCount,
			bloomWeights,
			rows
		};

		saveBlueprintDraft(blueprintPayload);
	}, [isCreatePage, schoolYear, quarter, classValue, subject, totalDays, totalItems, objectiveCount, bloomWeights, rows]);

	const subjectOptions = useMemo(() => {
		if (!classValue) {
			return uploadMeta?.subjects ?? [];
		}
		return uploadMeta?.classSubjectMap?.[classValue] ?? uploadMeta?.subjects ?? [];
	}, [classValue, uploadMeta?.classSubjectMap, uploadMeta?.subjects]);

	const rowTotals = useMemo(
		() => rows.map((row) => BLOOM_ORDER.reduce((sum, key) => sum + row.counts[key], 0)),
		[rows]
	);

	const bloomTotals = useMemo(() => {
		const totals: Record<BloomKey, number> = {
			remembering: 0,
			understanding: 0,
			applying: 0,
			analyzing: 0,
			evaluating: 0,
			creating: 0
		};

		rows.forEach((row) => {
			BLOOM_ORDER.forEach((key) => {
				totals[key] += row.counts[key];
			});
		});

		return totals;
	}, [rows]);

	const totalAllocatedItems = useMemo(
		() => rowTotals.reduce((sum, value) => sum + value, 0),
		[rowTotals]
	);

	const totalAllocatedPercentage = useMemo(
		() => rows.reduce((sum, row) => sum + row.percentage, 0),
		[rows]
	);

	const itemPlacements = useMemo(() => {
		let pointer = 1;
		const placementRows: Record<BloomKey, string>[] = rows.map(() => ({
			remembering: '',
			understanding: '',
			applying: '',
			analyzing: '',
			evaluating: '',
			creating: ''
		}));

		rows.forEach((row, rowIndex) => {
			BLOOM_ORDER.forEach((key) => {
				const count = row.counts[key];
				if (count <= 0) {
					placementRows[rowIndex][key] = '-';
					return;
				}

				const values: number[] = [];
				for (let i = 0; i < count; i += 1) {
					values.push(pointer);
					pointer += 1;
				}

				placementRows[rowIndex][key] = values.join(', ');
			});
		});

		return placementRows;
	}, [rows]);

	const automatedReadiness = totalAllocatedItems === totalItems && Math.round(totalAllocatedPercentage) === 100;

	const updateRow = (rowIndex: number, updater: (row: TosRow) => TosRow, autoComputeDays = false) => {
		setRows((currentRows) => {
			const copy = [...currentRows];
			copy[rowIndex] = updater(copy[rowIndex]);
			return autoComputeDays ? applyDaysFromDistribution(copy, totalDays) : copy;
		});
	};

	const handleSaveDraft = async () => {
		if (!schoolYear || !quarter || !classValue || !subject) {
			setStatusMessage('School year, class, subject, and quarter are required before saving.');
			return;
		}

		const blueprintPayload: TosBlueprintPayload = {
			schoolYear,
			quarter,
			classValue,
			subject,
			totalDays,
			totalItems,
			objectiveCount,
			bloomWeights,
			rows
		};

		saveBlueprintDraft(blueprintPayload);

		try {
			setSavingTos(true);
			const savedBlueprint = await saveTeacherTosBlueprint(blueprintPayload);
			const savedAt = formatSavedAtLabel(new Date().toISOString());
			setLastSavedAt(savedAt);
			setStatusMessage(`TOS saved to database. Version ${savedBlueprint.version}.`);
			setSavedHistory(await getTeacherTosBlueprintHistory({ schoolYear, classValue, subject, quarter }));
		} catch (error) {
			setStatusMessage(error instanceof Error ? error.message : 'Unable to save TOS to database. Draft was kept locally.');
		} finally {
			setSavingTos(false);
		}
	};

	const handleAutoDistributeItems = () => {
		const rowWeights = rows.map((row) => row.percentage);
		const bloomWeightsVector = BLOOM_ORDER.map((key) => bloomWeights[key]);
		const targetItemsPerRow = allocateByWeights(totalItems, rowWeights);
		const targetItemsPerBloom = allocateByWeights(totalItems, bloomWeightsVector);

		const matrix: number[][] = Array.from({ length: rows.length }, () => Array.from({ length: BLOOM_ORDER.length }, () => 0));

		for (let bloomIndex = 0; bloomIndex < BLOOM_ORDER.length; bloomIndex += 1) {
			const distribution = allocateByWeights(targetItemsPerBloom[bloomIndex], targetItemsPerRow);
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
				matrix[rowIndex][bloomIndex] = distribution[rowIndex];
			}
		}

		setRows((currentRows) =>
			applyDaysFromDistribution(currentRows.map((row, rowIndex) => ({
				...row,
				counts: {
					remembering: matrix[rowIndex][0],
					understanding: matrix[rowIndex][1],
					applying: matrix[rowIndex][2],
					analyzing: matrix[rowIndex][3],
					evaluating: matrix[rowIndex][4],
					creating: matrix[rowIndex][5]
				}
			})), totalDays)
		);

		setStatusMessage('Items were auto-distributed, and days were auto-computed from distribution.');
	};

	const resetToDefaults = () => {
		setRows(applyDaysFromDistribution(buildInitialRows(objectiveCount), totalDays));
		setBloomWeights(DEFAULT_BLOOM_WEIGHTS);
		setStatusMessage('TOS table was reset to defaults.');
	};

	const handleCreateDraft = () => {
		setSchoolYear('2025-2026');
		setQuarter('1st Quarter');
		setSubject('');
		setClassValue('');
		setTotalDays(48);
		setTotalItems(40);
		setObjectiveCount(8);
		setRows(buildInitialRows(8));
		setBloomWeights(DEFAULT_BLOOM_WEIGHTS);
		setLastSavedAt('');
		setSavedHistory([]);
		setSelectedHistoryId(null);
		setStatusMessage('New TOS draft created.');
		localStorage.removeItem(STORAGE_KEY);
	};

	const handleEditHistoryEntry = (entry: TosBlueprintHistoryEntry) => {
		setSchoolYear(entry.schoolYear);
		setQuarter(entry.quarter);
		setClassValue(entry.classValue);
		setSubject(entry.subject);
		setTotalDays(Math.max(1, Math.floor(entry.totalDays || 1)));
		setTotalItems(Math.max(1, Math.floor(entry.totalItems || 1)));
		setObjectiveCount(Math.max(1, Math.floor(entry.objectiveCount || 1)));
		setBloomWeights(entry.bloomWeights ?? DEFAULT_BLOOM_WEIGHTS);
		setRows(entry.rows.map((row, index) => ({
			id: index + 1,
			topic: row.topic || '',
			competency: row.competency || `Objective ${index + 1}`,
			days: sanitizeNumber(row.days),
			percentage: sanitizeNumber(row.percentage),
			counts: {
				remembering: sanitizeNumber(row.counts?.remembering ?? 0),
				understanding: sanitizeNumber(row.counts?.understanding ?? 0),
				applying: sanitizeNumber(row.counts?.applying ?? 0),
				analyzing: sanitizeNumber(row.counts?.analyzing ?? 0),
				evaluating: sanitizeNumber(row.counts?.evaluating ?? 0),
				creating: sanitizeNumber(row.counts?.creating ?? 0)
			}
		})));
		setStatusMessage(`Version ${entry.version} loaded for editing.`);
	};

	const handleDeleteHistoryEntry = async (entry: TosBlueprintHistoryEntry) => {
		const shouldDelete = window.confirm(`Delete TOS history version ${entry.version}?`);
		if (!shouldDelete) {
			return;
		}

		try {
			setDeletingHistoryId(entry.id);
			await deleteTeacherTosHistoryEntry(entry.id);
			const refreshedHistory = await getTeacherTosBlueprintHistory({
				schoolYear,
				classValue,
				subject,
				quarter
			});
			setSavedHistory(refreshedHistory);
			if (selectedHistoryId === entry.id) {
				setSelectedHistoryId(null);
			}
			setStatusMessage(`Version ${entry.version} was deleted from history.`);
		} catch (error) {
			setStatusMessage(error instanceof Error ? error.message : 'Unable to delete TOS history entry.');
		} finally {
			setDeletingHistoryId('');
		}
	};

	if (!isCreatePage) {
		return (
			<TeacherLayout title="Table of Specifications">
				{statusMessage ? <p className="teacher-status">{statusMessage}</p> : null}
				<section className="teacher-dash-heading teacher-page-heading">
					<p>TABLE OF SPECIFICATIONS AUTOMATION WORKSPACE</p>
					<div className="teacher-heading-row teacher-tos-heading-row">
					<button type="button" className="teacher-pill-btn" onClick={handleLandingCreate}>
						<PlusIcon className="teacher-btn-icon" />
						Create
					</button>
				</div>
			</section>

			<div className="teacher-content-toggle-bar teacher-tos-toggle-bar" role="tablist" aria-label="Analysis tools">
					<NavLink
						to="/teacher/item-analysis"
						role="tab"
						className={({ isActive }) => `teacher-content-toggle${isActive ? ' active' : ''}`}
					>
						Item Analysis
					</NavLink>
					<NavLink
						to="/teacher/tos-builder"
						role="tab"
						className={({ isActive }) => `teacher-content-toggle${isActive ? ' active' : ''}`}
					>
						TOS
					</NavLink>
				</div>

				<section className="teacher-filter-row">
					<select
						value={landingClass}
						onChange={(event) => {
							setLandingClass(event.target.value);
							setLandingSubject('');
							setLandingQuarter('');
						}}
					>
						<option value="">Select Class</option>
						{tosCreatedOptions.classOptions.map((classOption) => (
							<option key={classOption} value={classOption}>{classOption}</option>
						))}
					</select>
					<select
						value={landingSubject}
						onChange={(event) => {
							setLandingSubject(event.target.value);
							setLandingQuarter('');
						}}
						disabled={!landingClass}
					>
						<option value="">Select Subject</option>
						{landingSubjectOptions.map((subjectOption) => (
							<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
						))}
					</select>
					<select
						value={landingQuarter}
						onChange={(event) => setLandingQuarter(event.target.value)}
						disabled={!landingSubject}
					>
						<option value="">Select Quarter</option>
						{landingQuarterOptions.map((quarterOption) => (
							<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
						))}
					</select>
				</section>

				<section className="teacher-panel teacher-tos-landing-panel">
					{loadingLandingBlueprint ? (
						<p className="teacher-tos-landing-copy">Loading created TOS...</p>
					) : landingBlueprint ? (
						<div style={{ width: '100%' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
								<div>
									<strong style={{ fontSize: '1rem', color: 'var(--brand)' }}>{landingBlueprint.subject} — {landingBlueprint.classValue}</strong>
									<div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{landingBlueprint.quarter} • {landingBlueprint.schoolYear}</div>
								</div>

							</div>
							<div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
									<div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface)' }}>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Days</div>
										<div style={{ fontSize: '1.2rem', color: 'var(--brand)', fontWeight: 700, marginTop: '0.25rem' }}>{landingBlueprint.totalDays}</div>
									</div>
									<div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface)' }}>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>No. of Items</div>
										<div style={{ fontSize: '1.2rem', color: 'var(--brand)', fontWeight: 700, marginTop: '0.25rem' }}>{landingBlueprint.totalItems}</div>
									</div>
									<div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface)' }}>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Objectives</div>
										<div style={{ fontSize: '1.2rem', color: 'var(--brand)', fontWeight: 700, marginTop: '0.25rem' }}>{landingBlueprint.objectiveCount}</div>
									</div>
									<div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', background: 'var(--surface)' }}>
										<div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Saved Versions</div>
										<div style={{ fontSize: '1.2rem', color: 'var(--brand)', fontWeight: 700, marginTop: '0.25rem' }}>{landingHistoryCount}</div>
									</div>
								</div>
							</div>
							<div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', background: 'var(--surface)', overflowX: 'auto' }}>
								<p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>TOS Matrix (Read-Only)</p>
								<table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
									<thead>
										<tr>
											<th style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>Topic</th>
											<th style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>Competency</th>
											<th style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>Days</th>
											<th style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>%</th>
											{BLOOM_ORDER.map((key) => (
												<th key={key} style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>{BLOOM_LABELS[key]}</th>
											))}
											<th style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', background: 'var(--surface-soft)', fontWeight: 700 }}>Total</th>
										</tr>
									</thead>
									<tbody>
										{landingBlueprint.rows.map((row) => {
											const rowTotal = BLOOM_ORDER.reduce((sum, key) => sum + (row.counts?.[key] ?? 0), 0);
											return (
												<tr key={row.id} style={{ background: row.id % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-soft) 36%, transparent)' }}>
													<td style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'left', color: 'var(--text-main)' }}>{row.topic || '—'}</td>
													<td style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'left', color: 'var(--text-main)' }}>{row.competency}</td>
													<td style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'center', color: 'var(--text-main)' }}>{row.days}</td>
													<td style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'center', color: 'var(--text-main)' }}>{row.percentage.toFixed(1)}%</td>
													{BLOOM_ORDER.map((key) => (
														<td key={key} style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'center', color: 'var(--text-main)' }}>{row.counts?.[key] ?? 0}</td>
													))}
													<td style={{ border: '1px solid var(--border)', padding: '0.4rem', textAlign: 'center', fontWeight: 700, color: 'var(--brand)' }}>{rowTotal}</td>
												</tr>
											);
										})}
									</tbody>
									<tfoot>
										<tr style={{ background: 'var(--surface-soft)' }}>
											<td colSpan={2} style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>TOTAL</td>
											<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>{landingBlueprint.rows.reduce((sum, r) => sum + r.days, 0)}</td>
											<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>100%</td>
											{BLOOM_ORDER.map((key) => {
												const total = landingBlueprint.rows.reduce((sum, r) => sum + (r.counts?.[key] ?? 0), 0);
												return (
													<td key={key} style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>{total}</td>
												);
											})}
											<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--brand)' }}>{landingBlueprint.rows.reduce((sum, r) => sum + BLOOM_ORDER.reduce((bs, k) => bs + (r.counts?.[k] ?? 0), 0), 0)}</td>
										</tr>
									</tfoot>
								</table>
							</div>
						</div>
					) : landingClass && landingSubject && landingQuarter ? (
						<p className="teacher-tos-landing-copy">
							No saved TOS found for this class, subject, and quarter. Click Create to build one.
						</p>
					) : (
						<p className="teacher-tos-landing-copy">
							Select a class, subject, and quarter above, then click Create to open the TOS builder.
						</p>
					)}
				</section>
			</TeacherLayout>
		);
	}

	return (
		<TeacherLayout title="Table of Specifications">
			<section className="teacher-dash-heading teacher-page-heading">
				<p>TABLE OF SPECIFICATIONS AUTOMATION WORKSPACE</p>
				<div className="teacher-heading-row teacher-tos-heading-row">
					<div className="teacher-tos-heading-actions">
						<span className={`teacher-tos-status ${automatedReadiness ? 'ready' : 'draft'}`}>
							{automatedReadiness ? 'Ready for Exam Blueprint' : 'Draft in Progress'}
						</span>
						<button type="button" className="teacher-icon-btn" onClick={handleToggleBuilderPage} title="Back to TOS overview">
							<CloseIcon className="teacher-btn-icon" />
						</button>
					</div>
				</div>
			</section>

			<div className="teacher-content-toggle-bar teacher-tos-toggle-bar" role="tablist" aria-label="Analysis tools">
				<NavLink
					to="/teacher/item-analysis"
					role="tab"
					className={({ isActive }) => `teacher-content-toggle${isActive ? ' active' : ''}`}
				>
					Item Analysis
				</NavLink>
				<NavLink
					to="/teacher/tos-builder"
					role="tab"
					className={({ isActive }) => `teacher-content-toggle${isActive ? ' active' : ''}`}
				>
					TOS
				</NavLink>
			</div>

			{statusMessage ? <p className="teacher-status">{statusMessage}</p> : null}

			<section className="teacher-panel teacher-tos-meta-panel">
				{lastSavedAt ? <p className="teacher-panel-copy">Last saved: {lastSavedAt}</p> : null}
				<div className="teacher-tos-meta-grid">
					<label>
						School Year
						<input value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} />
					</label>
					<label>
						Class
						<select value={classValue} onChange={(event) => {
							setClassValue(event.target.value);
							setSubject('');
						}}>
							<option value="">Select class</option>
							{(uploadMeta?.gradeLevels ?? []).map((classOption) => (
								<option key={classOption} value={classOption}>{classOption}</option>
							))}
						</select>
					</label>
					<label>
						Subject
						<select value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!classValue}>
							<option value="">Select subject</option>
							{subjectOptions.map((subjectOption) => (
								<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
							))}
						</select>
					</label>
					<label>
						Quarter
						<select value={quarter} onChange={(event) => setQuarter(event.target.value)}>
							{(uploadMeta?.quarters ?? ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter']).map((quarterOption) => (
								<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
							))}
						</select>
					</label>
					<label>
						Total Days
						<input
							type="number"
							min={1}
							value={totalDays}
							onChange={(event) => setTotalDays(sanitizeNumber(Number(event.target.value)))}
						/>
					</label>
					<label>
						No. of Items
						<input
							type="number"
							min={1}
							value={totalItems}
							onChange={(event) => setTotalItems(sanitizeNumber(Number(event.target.value)))}
						/>
					</label>
					<label>
						Objectives
						<input
							type="number"
							min={1}
							max={20}
							value={objectiveCount}
							onChange={(event) => setObjectiveCount(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
						/>
					</label>
				</div>

				<div className="teacher-panel-head" style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
					<h3 style={{ fontSize: '1rem', color: 'var(--primary)' }}>Bloom Taxonomy Weighting</h3>
					<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total: {BLOOM_ORDER.reduce((sum, key) => sum + bloomWeights[key], 0)}%</span>
				</div>
				<div className="teacher-tos-bloom-grid" style={{ marginTop: '1rem' }}>
					{BLOOM_ORDER.map((key) => (
						<label key={key}>
							{BLOOM_LABELS[key]}
							<input
								type="number"
								min={0}
								value={bloomWeights[key]}
								onChange={(event) => {
									const nextValue = sanitizeNumber(Number(event.target.value));
									setBloomWeights((current) => ({ ...current, [key]: nextValue }));
								}}
							/>
						</label>
					))}
				</div>
			</section>

			<div className="teacher-tos-action-row" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
				<button type="button" className="teacher-filter-apply-btn" onClick={handleSaveDraft} disabled={savingTos}>{savingTos ? 'Saving...' : 'Save TOS'}</button>
				<button type="button" className="teacher-filter-apply-btn" onClick={handleAutoDistributeItems}>Auto Distribute Items</button>
				<button type="button" className="teacher-secondary-btn" onClick={resetToDefaults}>Reset</button>
			</div>

			<section className="teacher-panel teacher-tos-table-panel">
				<div className="teacher-panel-head">
					<h2>TOS Blueprint Matrix</h2>
					<span>Total Items Allocated: {totalAllocatedItems}/{totalItems}</span>
				</div>
				<div className="teacher-table-wrap teacher-tos-table-wrap" style={{ overflowX: 'auto' }}>
					<table className="teacher-table teacher-tos-table" style={{ minWidth: '1200px', borderCollapse: 'collapse' }}>
						<thead>
							<tr>
								<th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Topics</th>
								<th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Competencies</th>
								<th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Days</th>
								<th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Percentage</th>
								<th colSpan={12} style={{ border: '1px solid var(--border)', textAlign: 'center' }}>BLOOMS TAXONOMY</th>
								<th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Total Number of Items</th>
							</tr>
							<tr>
								{BLOOM_ORDER.map((key) => (
									<th key={key} colSpan={2} style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
										{BLOOM_LABELS[key]}
									</th>
								))}
							</tr>
							<tr>
								{BLOOM_ORDER.map((key) => (
									<React.Fragment key={`${key}-sub`}>
										<th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.75rem' }}>NOI</th>
										<th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.75rem' }}>POI</th>
									</React.Fragment>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((row, rowIndex) => (
								<tr key={row.id}>
									<td style={{ border: '1px solid var(--border)', padding: '0.25rem' }}>
										<input
											style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
											value={row.topic || ''}
											onChange={(event) => updateRow(rowIndex, (current) => ({ ...current, topic: event.target.value }))}
											placeholder={`Topic ${row.id}`}
										/>
									</td>
									<td style={{ border: '1px solid var(--border)', padding: '0.25rem' }}>
										<input
											style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
											value={row.competency}
											onChange={(event) => {
												const nextValue = event.target.value;
												updateRow(rowIndex, (current) => ({ ...current, competency: nextValue }));
											}}
										/>
									</td>
									<td style={{ border: '1px solid var(--border)', padding: '0.25rem', textAlign: 'center' }}>
										<input
											style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }}
											type="number"
											min={0}
											value={row.days}
											readOnly
										/>
									</td>
									<td style={{ border: '1px solid var(--border)', padding: '0.25rem', textAlign: 'center' }}>
										<input
											style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }}
											type="number"
											min={0}
											value={row.percentage}
											readOnly
										/>
									</td>
									{BLOOM_ORDER.map((key) => (
										<React.Fragment key={key}>
											<td style={{ border: '1px solid var(--border)', padding: '0.25rem', textAlign: 'center' }}>
												<input
													type="number"
													min={0}
													value={row.counts[key]}
													onChange={(event) => {
														const nextValue = sanitizeNumber(Number(event.target.value));
														updateRow(rowIndex, (current) => ({
															...current,
															counts: { ...current.counts, [key]: nextValue }
														}), true);
													}}
													style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none' }}
												/>
											</td>
											<td style={{ border: '1px solid var(--border)', padding: '0.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
												{itemPlacements[rowIndex]?.[key] ?? '-'}
											</td>
										</React.Fragment>
									))}
									<td className="teacher-tos-total-cell" style={{ border: '1px solid var(--border)', padding: '0.25rem', textAlign: 'center', fontWeight: 'bold' }}>{rowTotals[rowIndex]}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td colSpan={2} style={{ border: '1px solid var(--border)', textAlign: 'right', paddingRight: '1rem', fontWeight: 'bold' }}>TOTAL</td>
								<td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{rows.reduce((sum, row) => sum + row.days, 0)}</td>
								<td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{totalAllocatedPercentage.toFixed(0)}%</td>
								{BLOOM_ORDER.map((key) => (
									<React.Fragment key={`${key}-total`}>
										<td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{bloomTotals[key]}</td>
										<td style={{ border: '1px solid var(--border)', background: '#f5f5f5' }}></td>
									</React.Fragment>
								))}
								<td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{totalAllocatedItems}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</section>

			<div className="teacher-tos-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
				<section className="teacher-panel teacher-tos-panel-compact">
					<h2>Cognitive Process Distribution</h2>
					<div className="teacher-tos-bars">
						{BLOOM_ORDER.map((key) => {
							const value = bloomTotals[key];
							const height = totalItems > 0 ? Math.min(100, (value / totalItems) * 100) : 0;

							return (
								<div key={key} className="teacher-tos-bar-item">
									<div className="teacher-tos-bar-track">
										<div className="teacher-tos-bar-fill" style={{ height: `${height}%` }} />
									</div>
									<strong>{value}</strong>
									<span>{BLOOM_LABELS[key]}</span>
								</div>
							);
						})}
					</div>
				</section>

				<section className="teacher-panel teacher-tos-panel-compact">
					<div className="teacher-panel-head">
						<h2>Saved TOS History</h2>
						<select
							value={historySortBy}
							onChange={(e) => setHistorySortBy(e.target.value as 'date' | 'subject' | 'class')}
							style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }}
						>
							<option value="date">Sort by Date</option>
							<option value="subject">Sort by Subject</option>
							<option value="class">Sort by Class</option>
						</select>
					</div>

					{loadingSavedHistory ? (
						<p className="teacher-status">Loading history...</p>
					) : sortedHistory.length > 0 ? (
						<div style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem', marginTop: '1rem' }}>
							<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
								{sortedHistory.map((entry) => (
									<li
										key={entry.id}
										onClick={() => handleEditHistoryEntry(entry)}
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											padding: '0.75rem 1rem',
											background: selectedHistoryId === entry.id ? '#eff6ff' : '#f9f9f9',
											border: selectedHistoryId === entry.id ? '1px solid var(--primary)' : '1px solid var(--border)',
											borderRadius: '8px',
											cursor: 'pointer',
											transition: 'all 0.2s'
										}}
									>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
											<strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{entry.quarter} &bull; {entry.subject}</strong>
											<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.classValue} &bull; {formatSavedAtLabel(entry.savedAt)}</span>
										</div>
										<button
											type="button"
											title="Delete Saved TOS"
											onClick={(e) => {
												e.stopPropagation();
												void handleDeleteHistoryEntry(entry);
											}}
											disabled={deletingHistoryId === entry.id}
											style={{
												background: 'transparent',
												border: 'none',
												cursor: 'pointer',
												color: '#ef4444',
												opacity: deletingHistoryId === entry.id ? 0.5 : 1,
												padding: '0.25rem',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												borderRadius: '4px'
											}}
											onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
											onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
										>
											<TrashIcon className="teacher-btn-icon" />
										</button>
									</li>
								))}
							</ul>
						</div>
					) : (
						<p className="teacher-status" style={{ marginTop: '1rem' }}>No saved versions found.</p>
					)}
				</section>
			</div>

		</TeacherLayout>
	);
}

export default TOSBuilder;
