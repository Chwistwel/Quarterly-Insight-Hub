import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusIcon } from '../../components/icons';
import TeacherLayout from './TeacherLayout';
import {
	deleteTeacherItemAnalysis,
	getItemAnalysisData,
	getUploadMetaData,
	submitTeacherItemAnalysis,
	type ItemAnalysisResponse,
	type UploadMetaResponse
} from '../../services/teacherPortalApi';
import {
	findLinkedTosRecord,
	getLinkedTosRecords,
	upsertLinkedTosRecord,
	type TosAnalysisEntry
} from '../../services/tosStorage';
import '../../styles/TEACHER/ItemAnalysis.css';

type ItemScopeView = 'all' | 'individual';
type ItemPerformanceFilter = 'all' | string;
type IndividualResultFilter = 'all' | string;
type IndividualSortBy = 'name' | 'ranking' | 'score';

type DifficultyLevel = 'easy' | 'moderate' | 'difficult' | 'unknown';

type IndividualItemResult = {
	itemNo: number;
	item: string;
	score: number;
	interpretation: string;
};

type IndividualStudentResult = {
	id: string;
	studentName: string;
	firstName: string;
	lastName: string;
	rank: number;
	totalScore: number;
	notFound: boolean;
	itemResults: IndividualItemResult[];
};

function normalizeStudentToken(value: string): string {
	return value
		.toLowerCase()
		.replace(/\./g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizeStudentIdentifier(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.trim();
}

function getSimpleStudentId(studentId: string): string {
	const normalized = String(studentId ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	if (!normalized) {
		return '';
	}

	return `SID-${normalized.slice(-6)}`;
}

function getFirstLastKey(firstName: string, lastName: string): string {
	const normalizedFirstName = normalizeStudentToken(firstName);
	const normalizedLastName = normalizeStudentToken(lastName);
	if (!normalizedFirstName || !normalizedLastName) {
		return '';
	}

	return `${normalizedFirstName}::${normalizedLastName}`;
}

function getFirstLastKeyFromFullName(fullName: string): string {
	const tokens = normalizeStudentToken(fullName).split(' ').filter(Boolean);
	if (tokens.length === 0) {
		return '';
	}

	if (tokens.length === 1) {
		return '';
	}

	const firstName = tokens[0] ?? '';
	const lastName = tokens[tokens.length - 1] ?? '';
	return getFirstLastKey(firstName, lastName);
}

function normalizeInterpretation(interpretation: string): string {
	return interpretation.toLowerCase().trim();
}

function parseIndexValue(value: string | number): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value > 1 ? value / 100 : value;
	}

	if (typeof value === 'string') {
		const normalized = value.replace(/%/g, '').trim();
		const parsed = Number(normalized);
		if (!Number.isFinite(parsed)) {
			return null;
		}
		return parsed > 1 ? parsed / 100 : parsed;
	}

	return null;
}

function getDifficultyLevel(value: string | number): DifficultyLevel {
	const parsedValue = parseIndexValue(value);
	if (parsedValue === null) {
		return 'unknown';
	}

	if (parsedValue >= 0.76) {
		return 'easy';
	}

	if (parsedValue >= 0.26) {
		return 'moderate';
	}

	return 'difficult';
}

function getDifficultyLabel(value: string | number): string {
	const level = getDifficultyLevel(value);
	if (level === 'easy') return 'Easy';
	if (level === 'moderate') return 'Moderate';
	if (level === 'difficult') return 'Difficult';
	return 'N/A';
}

function ItemAnalysis() {
	const navigate = useNavigate();
	const [data, setData] = useState<ItemAnalysisResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedScope, setSelectedScope] = useState<ItemScopeView>('all');
	const [selectedPerformance, setSelectedPerformance] = useState<ItemPerformanceFilter>('all');
	const [selectedClass, setSelectedClass] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	const [selectedQuarter, setSelectedQuarter] = useState('');
	const [appliedClass, setAppliedClass] = useState('');
	const [appliedSubject, setAppliedSubject] = useState('');
	const [appliedQuarter, setAppliedQuarter] = useState('');
	const [uploadMeta, setUploadMeta] = useState<UploadMetaResponse | null>(null);
	const [linkedRecordsVersion, setLinkedRecordsVersion] = useState(0);
	const [analysisEntries, setAnalysisEntries] = useState<TosAnalysisEntry[]>([]);
	const [savingLinkedAnalysis, setSavingLinkedAnalysis] = useState(false);
	const [selectedStudentId, setSelectedStudentId] = useState('');
	const [selectedIndividualResultFilter, setSelectedIndividualResultFilter] = useState<IndividualResultFilter>('all');
	const [selectedIndividualSortBy, setSelectedIndividualSortBy] = useState<IndividualSortBy>('name');
	const [showEditModal, setShowEditModal] = useState(false);
	const [editClass, setEditClass] = useState('');
	const [editSubject, setEditSubject] = useState('');
	const [editQuarter, setEditQuarter] = useState('');
	const [editFile, setEditFile] = useState<File | null>(null);
	const [savingEdit, setSavingEdit] = useState(false);
	const [deletingRecord, setDeletingRecord] = useState(false);
	const [actionMessage, setActionMessage] = useState<string | null>(null);

	const linkedRecords = useMemo(() => getLinkedTosRecords(), [linkedRecordsVersion]);

	const availableClassOptions = useMemo(() => {
		return Array.from(new Set(data?.classOptions ?? []));
	}, [data?.classOptions]);

	const availableSubjectOptions = useMemo(() => {
		const options = new Set<string>(data?.subjectOptions ?? []);
		if (selectedClass) {
			const byClass = uploadMeta?.classSubjectMap?.[selectedClass] ?? [];
			byClass.forEach((subjectOption) => options.add(subjectOption));
			linkedRecords
				.filter((record) => record.classValue === selectedClass)
				.forEach((record) => options.add(record.subject));
		}
		return Array.from(options);
	}, [data?.subjectOptions, selectedClass, uploadMeta?.classSubjectMap, linkedRecords]);

	const availableQuarterOptions = useMemo(() => {
		const options = new Set<string>(uploadMeta?.quarters ?? []);
		if (data?.selectedQuarter) {
			options.add(data.selectedQuarter);
		}
		linkedRecords.forEach((record) => {
			const classMatch = !selectedClass || record.classValue === selectedClass;
			const subjectMatch = !selectedSubject || record.subject === selectedSubject;
			if (classMatch && subjectMatch) {
				options.add(record.quarter);
			}
		});
		return Array.from(options);
	}, [uploadMeta?.quarters, data?.selectedQuarter, linkedRecords, selectedClass, selectedSubject]);

	const linkedRecord = useMemo(() => {
		const classToken = appliedClass || selectedClass;
		const subjectToken = appliedSubject || selectedSubject;
		const quarterToken = appliedQuarter || selectedQuarter;
		if (!classToken || !subjectToken || !quarterToken) {
			return null;
		}
		return findLinkedTosRecord(classToken, subjectToken, quarterToken);
	}, [appliedClass, selectedClass, appliedSubject, selectedSubject, appliedQuarter, selectedQuarter, linkedRecordsVersion]);

	const filteredRows = useMemo(() => {
		const rows = data?.rows ?? [];
		if (selectedPerformance === 'all') {
			return rows;
		}

		return rows.filter((row) => normalizeInterpretation(row.interpretation) === selectedPerformance);
	}, [data?.rows, selectedPerformance]);

	const allInterpretationFilterOptions = useMemo(() => {
		const options = new Map<string, string>();
		(data?.rows ?? []).forEach((row) => {
			const label = row.interpretation.trim();
			if (!label) {
				return;
			}
			const value = normalizeInterpretation(label);
			if (!options.has(value)) {
				options.set(value, label);
			}
		});
		return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
	}, [data?.rows]);

	const targetAnalysisCount = useMemo(() => {
		if (typeof data?.totalItems === 'number' && data.totalItems > 0) {
			return data.totalItems;
		}
		if (linkedRecord?.totalItems && linkedRecord.totalItems > 0) {
			return linkedRecord.totalItems;
		}
		if (filteredRows.length > 0) {
			return filteredRows.length;
		}
		return 40;
	}, [data?.totalItems, linkedRecord?.totalItems, filteredRows.length]);

	const createAnalysisEntry = (itemNumber: number): TosAnalysisEntry => ({
		itemNumber,
		contentArea: '',
		intervention: ''
	});

	const individualStudents = useMemo<IndividualStudentResult[]>(() => {
		const classStudentsList = [...(data?.classStudents ?? [])];
		const studentItemResults = data?.studentItemResults ?? [];
		const studentIdentityLinks = data?.studentIdentityLinks ?? [];

		const uploadedById = new Map<string, (typeof studentItemResults)[number]>();
		const uploadedByFirstLast = new Map<string, (typeof studentItemResults)[number]>();
		const uploadedByLastName = new Map<string, Array<(typeof studentItemResults)[number]>>();
		const uploadedByMatchedStudentId = new Map<string, (typeof studentItemResults)[number]>();

		studentItemResults.forEach((entry) => {
			const normalizedName = normalizeStudentToken(entry.studentName ?? '');
			const normalizedStudentId = normalizeStudentIdentifier(String(entry.studentId ?? ''));
			const firstLastKey = getFirstLastKeyFromFullName(entry.studentName ?? '');
			if (normalizedName) {
				const nameTokens = normalizedName.split(' ').filter(Boolean);
				const lastName = nameTokens[nameTokens.length - 1] ?? normalizedName;
				const current = uploadedByLastName.get(lastName) ?? [];
				current.push(entry);
				uploadedByLastName.set(lastName, current);
			}

			if (normalizedStudentId) {
				uploadedById.set(normalizedStudentId, entry);
			}

			if (firstLastKey) {
				uploadedByFirstLast.set(firstLastKey, entry);
			}
		});

		studentIdentityLinks.forEach((link) => {
			const matchedStudentId = String(link.matchedStudentId ?? '').trim();
			if (!matchedStudentId) {
				return;
			}

			const uploadedStudentName = normalizeStudentToken(link.uploadedStudentName ?? '');
			if (!uploadedStudentName) {
				return;
			}

			const uploadedFirstLastKey = getFirstLastKeyFromFullName(uploadedStudentName);
			const matchedResult = uploadedFirstLastKey ? uploadedByFirstLast.get(uploadedFirstLastKey) : undefined;
			if (matchedResult) {
				uploadedByMatchedStudentId.set(matchedStudentId, matchedResult);
			}
		});

		return classStudentsList.map((classStudent) => {
			const classStudentId = normalizeStudentIdentifier(String(classStudent.id ?? ''));
			const classStudentSimpleId = normalizeStudentIdentifier(getSimpleStudentId(String(classStudent.id ?? '')));
			const classStudentNo = normalizeStudentIdentifier(String(classStudent.studentNo ?? ''));
			const classStudentFirstLast = getFirstLastKey(classStudent.firstName ?? '', classStudent.lastName ?? '');

			let matchedResult: (typeof studentItemResults)[number] | undefined =
				uploadedByMatchedStudentId.get(classStudent.id)
				?? (classStudentNo ? uploadedById.get(classStudentNo) : undefined)
				?? (classStudentSimpleId ? uploadedById.get(classStudentSimpleId) : undefined)
				?? (classStudentId ? uploadedById.get(classStudentId) : undefined)
				?? (classStudentFirstLast ? uploadedByFirstLast.get(classStudentFirstLast) : undefined);

			if (!matchedResult) {
				const normalizedLastName = normalizeStudentToken(classStudent.lastName || '');
				const lastNameMatches = normalizedLastName ? (uploadedByLastName.get(normalizedLastName) ?? []) : [];
				if (lastNameMatches.length === 1) {
					matchedResult = lastNameMatches[0];
				}
			}

			const defaultStudentName = `${classStudent.firstName} ${classStudent.lastName}`.trim() || classStudent.name;
			const itemResults = matchedResult?.itemResults ?? [];

			return {
				id: classStudent.id,
				studentName: defaultStudentName,
				firstName: classStudent.firstName,
				lastName: classStudent.lastName,
				rank: matchedResult?.rank ?? 0,
				totalScore: matchedResult?.totalScore ?? 0,
				notFound: !matchedResult,
				itemResults: itemResults.map((itemResult) => ({
					itemNo: itemResult.itemNo,
					item: itemResult.item,
					score: itemResult.score,
					interpretation: itemResult.interpretation
				}))
			};
		});
	}, [data?.classStudents, data?.studentItemResults, data?.studentIdentityLinks]);

	const sortedIndividualStudents = useMemo(() => {
		const students = [...individualStudents];

		if (selectedIndividualSortBy === 'ranking') {
			return students.sort((first, second) => {
				if (first.notFound !== second.notFound) {
					return first.notFound ? 1 : -1;
				}
				const firstRank = first.rank > 0 ? first.rank : Number.POSITIVE_INFINITY;
				const secondRank = second.rank > 0 ? second.rank : Number.POSITIVE_INFINITY;
				return firstRank - secondRank || first.studentName.localeCompare(second.studentName);
			});
		}

		if (selectedIndividualSortBy === 'score') {
			return students.sort((first, second) => {
				if (first.notFound !== second.notFound) {
					return first.notFound ? 1 : -1;
				}
				return second.totalScore - first.totalScore || first.studentName.localeCompare(second.studentName);
			});
		}

		return students.sort((first, second) => {
			const firstLast = normalizeStudentToken(first.lastName || first.studentName);
			const secondLast = normalizeStudentToken(second.lastName || second.studentName);
			const firstFirst = normalizeStudentToken(first.firstName || '');
			const secondFirst = normalizeStudentToken(second.firstName || '');
			return firstLast.localeCompare(secondLast) || firstFirst.localeCompare(secondFirst);
		});
	}, [individualStudents, selectedIndividualSortBy]);

	useEffect(() => {
		if (selectedScope !== 'individual' || sortedIndividualStudents.length === 0) {
			return;
		}

		setSelectedStudentId(sortedIndividualStudents[0]?.id ?? '');
	}, [selectedScope, selectedIndividualSortBy, sortedIndividualStudents]);

	const selectedStudent = useMemo(
		() => sortedIndividualStudents.find((student) => student.id === selectedStudentId) ?? null,
		[sortedIndividualStudents, selectedStudentId]
	);

	const displayedRows = useMemo(() => {
		if (selectedScope === 'all') {
			return filteredRows;
		}
		return [];
	}, [selectedScope, filteredRows]);

	const individualRows = useMemo(() => {
		if (selectedScope !== 'individual' || !selectedStudent || selectedStudent.notFound) {
			return [];
		}

		return selectedStudent.itemResults;
	}, [selectedScope, selectedStudent]);

	const filteredIndividualRows = useMemo(() => {
		if (selectedIndividualResultFilter === 'all') {
			return individualRows;
		}

		return individualRows.filter((row) => normalizeInterpretation(row.interpretation) === selectedIndividualResultFilter);
	}, [individualRows, selectedIndividualResultFilter]);

	const individualInterpretationFilterOptions = useMemo(() => {
		const options = new Map<string, string>();
		individualRows.forEach((row) => {
			const label = row.interpretation.trim();
			if (!label) {
				return;
			}
			const value = normalizeInterpretation(label);
			if (!options.has(value)) {
				options.set(value, label);
			}
		});
		return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
	}, [individualRows]);

	const itemResultStatsByItemNo = useMemo(() => {
		const itemStats = new Map<number, { correctCount: number; totalCount: number }>();
		(data?.studentItemResults ?? []).forEach((studentResult) => {
			if (!studentResult.itemResults?.length) {
				return;
			}

			studentResult.itemResults.forEach((itemResult) => {
				const itemNo = Number(itemResult.itemNo);
				if (!Number.isFinite(itemNo)) {
					return;
				}

				const current = itemStats.get(itemNo) ?? { correctCount: 0, totalCount: 0 };
				current.totalCount += 1;
				if (normalizeInterpretation(itemResult.interpretation) === 'correct') {
					current.correctCount += 1;
				}
				itemStats.set(itemNo, current);
			});
		});
		return itemStats;
	}, [data?.studentItemResults]);

	const analysisRowByItemNo = useMemo(() => {
		const map = new Map<number, { difficultyIndex: string | number; discriminationIndex: string | number }>();
		(data?.rows ?? []).forEach((row) => {
			const itemNo = Number(row.itemNo);
			if (!Number.isFinite(itemNo)) {
				return;
			}

			map.set(itemNo, {
				difficultyIndex: row.difficultyIndex,
				discriminationIndex: row.discriminationIndex
			});
		});
		return map;
	}, [data?.rows]);

	const getInterpretationClass = (interpretation: string) => {
		const normalized = interpretation.toLowerCase();
		if (normalized.includes('excellent')) return 'excellent';
		if (normalized.includes('good')) return 'good';
		if (normalized.includes('fair')) return 'fair';
		if (normalized.includes('poor') || normalized.includes('needs')) return 'poor';
		return 'neutral';
	};

	const sortedByDifficulty = useMemo(() => {
		const items = [...(data?.rows ?? [])].map(row => {
			const diff = parseIndexValue(row.difficultyIndex) ?? 0;
			const itemNo = Number(row.itemNo) || 0;
			return { ...row, itemNo, diffValue: diff };
		});
		return items.sort((a, b) => b.diffValue - a.diffValue);
	}, [data?.rows]);

	const mostLearnedItems = useMemo(() => {
		return sortedByDifficulty.slice(0, 10);
	}, [sortedByDifficulty]);

	const leastLearnedItems = useMemo(() => {
		return [...sortedByDifficulty].reverse().slice(0, 10);
	}, [sortedByDifficulty]);

	const interpretationSummary = useMemo(() => {
		const summary = new Map<string, number>();
		(data?.rows ?? []).forEach(row => {
			const interp = row.interpretation.trim();
			if (interp) {
				summary.set(interp, (summary.get(interp) || 0) + 1);
			}
		});
		return Array.from(summary.entries()).map(([label, count]) => ({ label, count }));
	}, [data?.rows]);

	const updateAnalysisEntryByItemNo = (itemNo: number, patch: Partial<TosAnalysisEntry>) => {
		setAnalysisEntries((current) => {
			const index = current.findIndex(e => e.itemNumber === itemNo);
			if (index >= 0) {
				const copy = [...current];
				copy[index] = { ...copy[index], ...patch };
				return copy;
			} else {
				return [...current, { ...createAnalysisEntry(itemNo), ...patch }];
			}
		});
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getItemAnalysisData(appliedClass, appliedSubject, appliedQuarter);
				setData(response);
				const nextClass = response.selectedClass ?? '';
				const nextSubject = response.selectedSubject ?? '';
				const nextQuarter = response.selectedQuarter ?? '';

				if (!selectedClass && nextClass) setSelectedClass(nextClass);
				if (!selectedSubject && nextSubject) setSelectedSubject(nextSubject);
				if (!selectedQuarter && nextQuarter) setSelectedQuarter(nextQuarter);
				if (!appliedClass && nextClass) setAppliedClass(nextClass);
				if (!appliedSubject && nextSubject) setAppliedSubject(nextSubject);
				if (!appliedQuarter && nextQuarter) setAppliedQuarter(nextQuarter);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load item analysis.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [appliedClass, appliedSubject, appliedQuarter, selectedClass, selectedSubject, selectedQuarter]);

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
		const syncLinkedRecords = () => setLinkedRecordsVersion((value) => value + 1);
		syncLinkedRecords();
		window.addEventListener('focus', syncLinkedRecords);
		return () => window.removeEventListener('focus', syncLinkedRecords);
	}, []);

	useEffect(() => {
		if (linkedRecord) {
			setAnalysisEntries(
				linkedRecord.analysisEntries.map((entry, index) => ({
					itemNumber: index + 1,
					contentArea: entry.contentArea ?? '',
					intervention: entry.intervention ?? ''
				}))
			);
			return;
		}

		setAnalysisEntries([]);
	}, [linkedRecord]);

	useEffect(() => {
		if (selectedScope !== 'individual') {
			return;
		}

		if (sortedIndividualStudents.length === 0) {
			if (selectedStudentId) {
				setSelectedStudentId('');
			}
			return;
		}

		if (!selectedStudentId || !sortedIndividualStudents.some((student) => student.id === selectedStudentId)) {
			setSelectedStudentId(sortedIndividualStudents[0]?.id ?? '');
		}
	}, [selectedScope, sortedIndividualStudents, selectedStudentId]);

	const handleSaveAnalysisEntries = () => {
		const classToken = appliedClass || selectedClass;
		const subjectToken = appliedSubject || selectedSubject;
		const quarterToken = appliedQuarter || selectedQuarter;

		if (!classToken || !subjectToken || !quarterToken) {
			setActionMessage('Class, subject, and quarter are required before saving analysis entries.');
			return;
		}

		setSavingLinkedAnalysis(true);
		upsertLinkedTosRecord({
			schoolYear: 'N/A',
			classValue: classToken,
			subject: subjectToken,
			quarter: quarterToken,
			totalItems: targetAnalysisCount,
			analysisEntries,
			itemAnalysisRows: (data?.rows ?? []).map((row) => ({
				itemNo: Number(row.itemNo) || 0,
				difficultyIndex: row.difficultyIndex,
				discriminationIndex: row.discriminationIndex,
				interpretation: row.interpretation
			}))
		});
		setSavingLinkedAnalysis(false);
		setLinkedRecordsVersion((value) => value + 1);
		setActionMessage('Analysis entries saved and linked to this Class, Subject, and Quarter.');
	};

	const availableEditSubjects = editClass
		? (uploadMeta?.classSubjectMap?.[editClass] ?? uploadMeta?.subjects ?? [])
		: (uploadMeta?.subjects ?? []);

	const handleSaveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setActionMessage(null);

		if (!editClass || !editSubject || !editQuarter) {
			setActionMessage('Class, subject, and quarter are required.');
			return;
		}

		if (!editFile) {
			setActionMessage('Please select a file to update the analysis.');
			return;
		}

		try {
			setSavingEdit(true);

			const originalClass = appliedClass || data?.selectedClass || '';
			const originalSubject = appliedSubject || data?.selectedSubject || '';
			const originalQuarter = appliedQuarter || data?.selectedQuarter || '';
			const changedIdentity = Boolean(originalClass && originalSubject)
				&& (originalClass !== editClass || originalSubject !== editSubject);

			if (changedIdentity) {
				await deleteTeacherItemAnalysis(originalClass, originalSubject, originalQuarter);
			}

			await submitTeacherItemAnalysis({
				classValue: editClass,
				subject: editSubject,
				quarter: editQuarter,
				file: editFile
			});

			setShowEditModal(false);
			setAppliedClass(editClass);
			setAppliedSubject(editSubject);
			setAppliedQuarter(editQuarter);
			setSelectedClass(editClass);
			setSelectedSubject(editSubject);
			setSelectedQuarter(editQuarter);
			setActionMessage('Item analysis updated successfully.');
		} catch (editError) {
			setActionMessage(editError instanceof Error ? editError.message : 'Unable to update item analysis.');
		} finally {
			setSavingEdit(false);
		}
	};

	const handleDelete = async () => {
		const classToDelete = appliedClass || data?.selectedClass || '';
		const subjectToDelete = appliedSubject || data?.selectedSubject || '';
		const quarterToDelete = appliedQuarter || selectedQuarter || data?.selectedQuarter || '';

		if (!classToDelete || !subjectToDelete) {
			setActionMessage('Select a class and subject record first.');
			return;
		}

		const shouldDelete = window.confirm(`Delete item analysis for ${subjectToDelete} - ${classToDelete}?`);
		if (!shouldDelete) {
			return;
		}

		try {
			setDeletingRecord(true);
			setActionMessage(null);
			await deleteTeacherItemAnalysis(classToDelete, subjectToDelete, quarterToDelete);
			setActionMessage('Item analysis deleted successfully.');
			setAppliedClass('');
			setAppliedSubject('');
			setAppliedQuarter('');
			setSelectedClass('');
			setSelectedSubject('');
			setSelectedQuarter('');
		} catch (deleteError) {
			setActionMessage(deleteError instanceof Error ? deleteError.message : 'Unable to delete item analysis.');
		} finally {
			setDeletingRecord(false);
		}
	};

	return (
		<TeacherLayout title={data?.title ?? 'Item Analysis'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'COMPREHENSIVE ITEM ANALYSIS'}</p>
				<div className="teacher-heading-row">
					<div className="teacher-heading-title-group">
						<h2>{data?.title ?? 'Item Analysis'}</h2>
					</div>
				</div>
			</section>

			<div className="teacher-content-toggle-bar" role="tablist" aria-label="Analysis tools">
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
					TOS Builder
				</NavLink>
			</div>

			{loading ? <p className="teacher-status">Loading item analysis...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}
			{actionMessage ? <p className="teacher-status">{actionMessage}</p> : null}

			{showEditModal ? (
				<div className="teacher-item-analysis-modal-backdrop" onClick={() => !savingEdit && setShowEditModal(false)}>
					<section className="teacher-item-analysis-modal" onClick={(event) => event.stopPropagation()}>
						<div className="teacher-item-analysis-modal-head">
							<h3>Edit Item Analysis</h3>
							<button type="button" onClick={() => !savingEdit && setShowEditModal(false)} aria-label="Close edit dialog">x</button>
						</div>

						<form className="teacher-item-analysis-modal-form" onSubmit={handleSaveEdit}>
							<label>
								Class
								<select value={editClass} onChange={(event) => {
									setEditClass(event.target.value);
									setEditSubject('');
								}} required>
									<option value="" disabled>Select class</option>
									{(uploadMeta?.gradeLevels ?? data?.classOptions ?? []).map((classOption) => (
										<option key={classOption} value={classOption}>{classOption}</option>
									))}
								</select>
							</label>

							<label>
								Subject
								<select value={editSubject} onChange={(event) => setEditSubject(event.target.value)} required>
									<option value="" disabled>Select subject</option>
									{availableEditSubjects.map((subjectOption) => (
										<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
									))}
								</select>
							</label>

							<label>
								Quarter
								<select value={editQuarter} onChange={(event) => setEditQuarter(event.target.value)} required>
									<option value="" disabled>Select quarter</option>
									{(uploadMeta?.quarters ?? ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4']).map((quarterOption) => (
										<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
									))}
								</select>
							</label>

							<label>
								Upload CSV/Excel File
								<input
									type="file"
									onChange={(event) => setEditFile(event.target.files?.[0] ?? null)}
									required
								/>
							</label>

							<button type="submit" className="teacher-primary-btn" disabled={savingEdit}>
								{savingEdit ? 'Saving...' : 'Save Changes'}
							</button>
						</form>
					</section>
				</div>
			) : null}

			<section className="teacher-filter-row">
				<select value={selectedClass} onChange={(event) => {
					const nextClass = event.target.value;
					setSelectedClass(nextClass);
					setAppliedClass(nextClass);
					setSelectedSubject('');
					setAppliedSubject('');
					setSelectedQuarter('');
					setAppliedQuarter('');
					setSelectedStudentId('');
					setSelectedIndividualResultFilter('all');
					setSelectedIndividualSortBy('name');
				}}>
					<option value="">Select Class</option>
					{availableClassOptions.map((classOption) => (
						<option key={classOption} value={classOption}>{classOption}</option>
					))}
				</select>
				<select value={selectedSubject} onChange={(event) => {
					const nextSubject = event.target.value;
					setSelectedSubject(nextSubject);
					setAppliedSubject(nextSubject);
					setSelectedQuarter('');
					setAppliedQuarter('');
					setSelectedStudentId('');
					setSelectedIndividualResultFilter('all');
					setSelectedIndividualSortBy('name');
				}} disabled={!selectedClass}>
					<option value="">Select Subject</option>
					{availableSubjectOptions.map((subjectOption) => (
						<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(event) => {
					const nextQuarter = event.target.value;
					setSelectedQuarter(nextQuarter);
					setAppliedQuarter(nextQuarter);
					setSelectedStudentId('');
					setSelectedIndividualResultFilter('all');
					setSelectedIndividualSortBy('name');
				}} disabled={!selectedSubject}>
					<option value="">Select Quarter</option>
					{availableQuarterOptions.map((quarterOption) => (
						<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
					))}
				</select>
			</section>

			<div className="teacher-stats-row">
				<div className="teacher-kpis teacher-kpis-3">
					<article className="teacher-card">
						<p>Average Score</p>
						<strong>{data?.classAverage}</strong>
					</article>
					<article className="teacher-card">
						<p>Average Index</p>
						<strong>{data?.averageIndex}</strong>
					</article>
					<article className="teacher-card">
						<p>Total Students</p>
						<strong>{data?.totalStudents}</strong>
					</article>
				</div>
			</div>

			<div className="teacher-tabs-stack">
				<div className="teacher-tabs-row">
				<div className="teacher-tabs-wrap">
					<div className="teacher-tabs teacher-tabs-primary">
						<button type="button" className={selectedScope === 'all' ? 'active' : ''} onClick={() => setSelectedScope('all')}>All Students</button>
						<button type="button" className={selectedScope === 'individual' ? 'active' : ''} onClick={() => setSelectedScope('individual')}>Individual</button>
					</div>
				</div>
				</div>
			</div>

			{selectedScope === 'individual' ? (
				<section className="teacher-panel teacher-item-analysis-linked-panel">
					<div className="teacher-panel-head">
						<h2>Individual</h2>
						<label className="teacher-sort-control" aria-label="Sort individual students">
							<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
								<path d="M4 6h12" />
								<path d="M4 12h8" />
								<path d="M4 18h14" />
								<path d="M18 8l2-2 2 2" />
								<path d="M20 6v12" />
							</svg>
							<select
								value={selectedIndividualSortBy}
								onChange={(event) => {
									setSelectedIndividualSortBy(event.target.value as IndividualSortBy);
									setSelectedStudentId('');
								}}
							>
								<option value="name">Sort by: Name</option>
								<option value="ranking">Sort by: Ranking</option>
								<option value="score">Sort by: Score</option>
							</select>
						</label>
					</div>
					{sortedIndividualStudents.length > 0 ? (
						<div className="teacher-individual-filter-nav">
							<button
								type="button"
								className="teacher-nav-arrow-btn teacher-nav-arrow-prev"
								onClick={() => {
									const currentIndex = sortedIndividualStudents.findIndex((s) => s.id === selectedStudentId);
									const nextIndex = currentIndex > 0 ? currentIndex - 1 : sortedIndividualStudents.length - 1;
									setSelectedStudentId(sortedIndividualStudents[nextIndex]?.id ?? '');
								}}
								disabled={sortedIndividualStudents.length === 0}
								aria-label="Previous student"
							>
								‹
							</button>
							<div className="teacher-individual-filter-display">
								{selectedStudent ? (
									<>
										<div className="teacher-individual-student-name">
											{selectedStudent.studentName}
										</div>
										<div className="teacher-individual-student-counter">
											{selectedStudent.notFound ? (
												<span style={{ color: '#e74c3c' }}>Student is not found in the analysis</span>
											) : (
												<>Rank {selectedStudent.rank} | Score {selectedStudent.totalScore}</>
											)}
										</div>
									</>
								) : (
									<div className="teacher-individual-student-name">No students available</div>
								)}
							</div>
							<button
								type="button"
								className="teacher-nav-arrow-btn teacher-nav-arrow-next"
								onClick={() => {
									const currentIndex = sortedIndividualStudents.findIndex((s) => s.id === selectedStudentId);
									const nextIndex = currentIndex < sortedIndividualStudents.length - 1 ? currentIndex + 1 : 0;
									setSelectedStudentId(sortedIndividualStudents[nextIndex]?.id ?? '');
								}}
								disabled={sortedIndividualStudents.length === 0}
								aria-label="Next student"
							>
								›
							</button>
						</div>
					) : (
						<p className="teacher-status">No students available for the selected class.</p>
					)}
					{!selectedStudentId && sortedIndividualStudents.length > 0 ? (
						<p className="teacher-panel-copy">Click the arrow to view each student's item analysis table.</p>
					) : null}
				</section>
			) : null}

			<section className="teacher-panel teacher-item-analysis-panel">
				<div className="teacher-panel-head teacher-item-analysis-panel-head">
					<div className="teacher-item-analysis-panel-title-group">
						<h2>Item Analysis</h2>
						{selectedScope === 'all' ? (
							<select
								className="teacher-item-analysis-dropdown"
								value={selectedPerformance}
								onChange={(event) => setSelectedPerformance(event.target.value as ItemPerformanceFilter)}
								aria-label="Filter item analysis by performance"
							>
								<option value="all">All Items</option>
								{allInterpretationFilterOptions.map((option) => (
									<option key={`all-interpretation-${option.value}`} value={option.value}>{option.label}</option>
								))}
							</select>
						) : selectedScope === 'individual' ? (
							<select
								className="teacher-item-analysis-dropdown"
								value={selectedIndividualResultFilter}
								onChange={(event) => setSelectedIndividualResultFilter(event.target.value as IndividualResultFilter)}
								aria-label="Filter selected student item results"
							>
								<option value="all">All Items</option>
								{individualInterpretationFilterOptions.map((option) => (
									<option key={`individual-interpretation-${option.value}`} value={option.value}>{option.label}</option>
								))}
							</select>
						) : null}
					</div>
					<div className="teacher-heading-inline-actions teacher-item-analysis-panel-actions">
						<button
							type="button"
							className="teacher-item-analysis-create-btn teacher-item-analysis-create-btn-inline"
							onClick={() => navigate('/teacher/upload-results')}
						>
							<PlusIcon className="teacher-item-analysis-create-icon" />
							Create
						</button>
					</div>
				</div>

				{selectedScope === 'individual' ? (
					selectedStudent?.notFound ? (
						<p className="teacher-status">Student is not found in the analysis.</p>
					) : filteredIndividualRows.length ? (
						<div className="teacher-table-wrap">
							<table className="teacher-table">
								<thead>
									<tr>
										<th>Item #</th>
										<th>Correct</th>
										<th>Difficulty</th>
										<th>Result</th>
										<th>Interpretation</th>
									</tr>
								</thead>
								<tbody>
									{filteredIndividualRows.map((row) => {
										const analysisRow = analysisRowByItemNo.get(row.itemNo);
										const isCorrect = row.interpretation === 'Correct';
										const itemResultStats = itemResultStatsByItemNo.get(row.itemNo);
										const difficultyLabel = getDifficultyLabel(analysisRow?.difficultyIndex ?? '');

										return (
										<tr key={`individual-row-${selectedStudent?.id}-${row.itemNo}`}>
											<td>{row.itemNo}</td>
											<td>{isCorrect ? '✓' : '✗'}</td>
											<td>
												<span className={`teacher-badge difficulty-${getDifficultyLevel(analysisRow?.difficultyIndex ?? '')}`}>
													{difficultyLabel}
												</span>
											</td>
											<td>{`${itemResultStats?.correctCount ?? 0}/${itemResultStats?.totalCount ?? 0}`}</td>
											<td>
												<span className={`teacher-badge ${row.interpretation === 'Correct' ? 'excellent' : row.interpretation === 'Partially Correct' ? 'fair' : 'poor'}`}>
													{row.interpretation}
												</span>
											</td>
										</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<p className="teacher-status">No item results found for this student and selected filter.</p>
					)
				) : displayedRows.length ? (
					<div className="teacher-table-wrap">
						<table className="teacher-table">
							<thead>
								<tr>
									<th>Item #</th>
									<th>Difficulty Index</th>
									<th>Difficulty</th>
									<th>Discrimination Index</th>
									<th>Result</th>
									<th>Interpretation</th>
								</tr>
							</thead>
							<tbody>
								{displayedRows.map((row) => {
									const itemNo = Number(row.itemNo);
									const itemResultStats = Number.isFinite(itemNo) ? itemResultStatsByItemNo.get(itemNo) : null;
									return (
										<tr key={`${row.itemNo}-${row.interpretation}`}>
											<td>{row.itemNo}</td>
											<td>{row.difficultyIndex}</td>
											<td>
												<span className={`teacher-badge difficulty-${getDifficultyLevel(row.difficultyIndex)}`}>
													{getDifficultyLabel(row.difficultyIndex)}
												</span>
											</td>
											<td>{row.discriminationIndex}</td>
											<td>{`${itemResultStats?.correctCount ?? 0}/${itemResultStats?.totalCount ?? 0}`}</td>
											<td>
												<span className={`teacher-badge ${getInterpretationClass(row.interpretation)}`}>
													{row.interpretation}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<p className="teacher-status">No item analysis entries found.</p>
				)}
			</section>

			<section className="teacher-panel teacher-item-analysis-linked-panel">
				<div className="teacher-panel-head teacher-dash-heading-divider">
					<h2>Analysis Summary & Interventions</h2>
					<span>{(appliedSubject || selectedSubject) || 'Select Subject'} | {(appliedClass || selectedClass) || 'Select Class'} | {(appliedQuarter || selectedQuarter) || 'Select Quarter'}</span>
				</div>
				
				<div className="teacher-item-analysis-summary-box">
					<h3>Summary of Interpretations</h3>
					<div className="teacher-summary-grid">
						{interpretationSummary.map(item => (
							<div key={`summary-${item.label}`} className="teacher-summary-card">
								<span className="teacher-summary-count">{item.count}</span>
								<span className="teacher-summary-label">{item.label}</span>
							</div>
						))}
						{interpretationSummary.length === 0 && (
							<p className="teacher-status">No summary available.</p>
						)}
					</div>
				</div>

				<div className="teacher-item-analysis-top10-container">
					<div className="teacher-table-wrap teacher-item-analysis-analysis-wrap">
						<h3>TOP 10 MOST LEARNED TEST ITEMS</h3>
						<table className="teacher-table teacher-item-analysis-analysis-table">
							<thead>
								<tr>
									<th>ITEM NUMBER</th>
									<th>CONTENT AREA</th>
								</tr>
							</thead>
							<tbody>
								{mostLearnedItems.map((item) => {
									const entry = analysisEntries.find(e => e.itemNumber === item.itemNo) || createAnalysisEntry(item.itemNo);
									return (
										<tr key={`most-learned-${item.itemNo}`}>
											<td>{item.itemNo}</td>
											<td>
												<input
													value={entry.contentArea}
													onChange={(event) => updateAnalysisEntryByItemNo(item.itemNo, { contentArea: event.target.value })}
													placeholder="Enter content area"
												/>
											</td>
										</tr>
									);
								})}
								{mostLearnedItems.length === 0 && (
									<tr><td colSpan={2} style={{ textAlign: 'center' }}>No items available.</td></tr>
								)}
							</tbody>
						</table>
					</div>

					<div className="teacher-table-wrap teacher-item-analysis-analysis-wrap" style={{ marginTop: '2rem' }}>
						<h3>TOP 10 LEAST LEARNED TEST ITEMS</h3>
						<table className="teacher-table teacher-item-analysis-analysis-table">
							<thead>
								<tr>
									<th>ITEM NUMBER</th>
									<th>CONTENT AREA</th>
									<th>INTERVENTION</th>
								</tr>
							</thead>
							<tbody>
								{leastLearnedItems.map((item) => {
									const entry = analysisEntries.find(e => e.itemNumber === item.itemNo) || createAnalysisEntry(item.itemNo);
									return (
										<tr key={`least-learned-${item.itemNo}`}>
											<td>{item.itemNo}</td>
											<td>
												<input
													value={entry.contentArea}
													onChange={(event) => updateAnalysisEntryByItemNo(item.itemNo, { contentArea: event.target.value })}
													placeholder="Enter content area"
												/>
											</td>
											<td>
												<input
													value={entry.intervention}
													onChange={(event) => updateAnalysisEntryByItemNo(item.itemNo, { intervention: event.target.value })}
													placeholder="Enter intervention plan"
												/>
											</td>
										</tr>
									);
								})}
								{leastLearnedItems.length === 0 && (
									<tr><td colSpan={3} style={{ textAlign: 'center' }}>No items available.</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<div className="teacher-item-analysis-page-actions">
				<button
					type="button"
					className="teacher-item-analysis-delete-btn"
					onClick={() => void handleDelete()}
					disabled={deletingRecord}
				>
					{deletingRecord ? 'Deleting...' : 'Delete'}
				</button>
				<button
					type="button"
					className="teacher-filter-apply-btn"
					onClick={handleSaveAnalysisEntries}
					disabled={savingLinkedAnalysis}
				>
					{savingLinkedAnalysis ? 'Saving...' : 'Save Analysis'}
				</button>
			</div>

		</TeacherLayout>
	);
}

export default ItemAnalysis;
