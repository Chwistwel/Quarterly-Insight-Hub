import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
type ItemPerformanceFilter = 'all' | 'excellent' | 'good' | 'needs';
type IndividualResultFilter = 'all' | 'correct' | 'incorrect';
type IndividualSortBy = 'name' | 'ranking' | 'score';

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

function buildNameCandidates(student: { name: string; firstName?: string; lastName?: string }): string[] {
	const candidates = new Set<string>();
	const fullName = normalizeStudentToken(student.name ?? '');
	const firstLast = normalizeStudentToken(`${student.firstName ?? ''} ${student.lastName ?? ''}`);
	const lastName = normalizeStudentToken(student.lastName ?? '');

	if (fullName) {
		candidates.add(fullName);
	}
	if (firstLast) {
		candidates.add(firstLast);
	}
	if (lastName) {
		candidates.add(lastName);
	}

	return Array.from(candidates);
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
		const options = new Set<string>(data?.classOptions ?? []);
		linkedRecords.forEach((record) => options.add(record.classValue));
		return Array.from(options);
	}, [data?.classOptions, linkedRecords]);

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

		if (selectedPerformance === 'excellent') {
			return rows.filter((row) => row.interpretation.toLowerCase().includes('excellent'));
		}

		if (selectedPerformance === 'good') {
			return rows.filter((row) => row.interpretation.toLowerCase().includes('good'));
		}

		return rows.filter((row) => {
			const normalized = row.interpretation.toLowerCase();
			return normalized.includes('poor') || normalized.includes('needs') || normalized.includes('fair');
		});
	}, [data?.rows, selectedPerformance]);

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

		const uploadedByName = new Map<string, (typeof studentItemResults)[number]>();
		const uploadedByLastName = new Map<string, Array<(typeof studentItemResults)[number]>>();

		studentItemResults.forEach((entry) => {
			const normalizedName = normalizeStudentToken(entry.studentName ?? '');
			if (normalizedName) {
				uploadedByName.set(normalizedName, entry);
				const nameTokens = normalizedName.split(' ').filter(Boolean);
				const lastName = nameTokens[nameTokens.length - 1] ?? normalizedName;
				const current = uploadedByLastName.get(lastName) ?? [];
				current.push(entry);
				uploadedByLastName.set(lastName, current);
			}
		});

		return classStudentsList.map((classStudent) => {
			const candidates = buildNameCandidates({
				name: classStudent.name,
				firstName: classStudent.firstName,
				lastName: classStudent.lastName
			});

			let matchedResult: (typeof studentItemResults)[number] | undefined;
			for (const candidate of candidates) {
				const fullNameMatch = uploadedByName.get(candidate);
				if (fullNameMatch) {
					matchedResult = fullNameMatch;
					break;
				}
			}

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
	}, [data?.classStudents, data?.studentItemResults]);

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

		if (selectedIndividualResultFilter === 'correct') {
			return individualRows.filter((row) => row.interpretation === 'Correct');
		}

		return individualRows.filter((row) => row.interpretation !== 'Correct');
	}, [individualRows, selectedIndividualResultFilter]);

	const getInterpretationClass = (interpretation: string) => {
		const normalized = interpretation.toLowerCase();
		if (normalized.includes('excellent')) return 'excellent';
		if (normalized.includes('good')) return 'good';
		if (normalized.includes('fair')) return 'fair';
		if (normalized.includes('poor') || normalized.includes('needs')) return 'poor';
		return 'neutral';
	};

	const updateAnalysisEntry = (index: number, patch: Partial<TosAnalysisEntry>) => {
		setAnalysisEntries((current) => {
			const copy = [...current];
			copy[index] = { ...copy[index], ...patch, itemNumber: index + 1 };
			return copy;
		});
	};

	const handleAddAnalysisEntry = () => {
		setAnalysisEntries((current) => [...current, createAnalysisEntry(current.length + 1)]);
	};

	const handleDeleteAnalysisEntry = (index: number) => {
		setAnalysisEntries((current) => {
			const next = current.filter((_, currentIndex) => currentIndex !== index);
			if (next.length === 0) {
				return [createAnalysisEntry(1)];
			}
			return next.map((entry, entryIndex) => ({ ...entry, itemNumber: entryIndex + 1 }));
		});
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getItemAnalysisData(appliedClass, appliedSubject);
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
				Array.from({ length: Math.max(5, linkedRecord.analysisEntries.length) }, (_, index) => ({
					itemNumber: index + 1,
					contentArea: linkedRecord.analysisEntries[index]?.contentArea ?? '',
					intervention: linkedRecord.analysisEntries[index]?.intervention ?? ''
				}))
			);
			return;
		}

		setAnalysisEntries((current) => {
			const targetCount = 5;
			if (current.length === targetCount) {
				return current;
			}
			return Array.from({ length: targetCount }, (_, index) => current[index] ?? createAnalysisEntry(index + 1));
		});
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

	const handleApplyFilters = () => {
		setAppliedClass(selectedClass);
		setAppliedSubject(selectedSubject);
		setAppliedQuarter(selectedQuarter);
		setSelectedStudentId('');
		setSelectedIndividualResultFilter('all');
		setSelectedIndividualSortBy('name');
	};

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
			analysisEntries
		});
		setSavingLinkedAnalysis(false);
		setLinkedRecordsVersion((value) => value + 1);
		setActionMessage('Analysis entries saved and linked to this Class, Subject, and Quarter.');
	};

	const availableEditSubjects = editClass
		? (uploadMeta?.classSubjectMap?.[editClass] ?? uploadMeta?.subjects ?? [])
		: (uploadMeta?.subjects ?? []);

	const handleOpenEditModal = () => {
		setActionMessage(null);
		setEditClass(appliedClass || selectedClass || data?.selectedClass || '');
		setEditSubject(appliedSubject || selectedSubject || data?.selectedSubject || '');
		setEditQuarter(appliedQuarter || selectedQuarter || data?.selectedQuarter || uploadMeta?.quarters?.[0] || '');
		setEditFile(null);
		setShowEditModal(true);
	};

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
			const changedIdentity = Boolean(originalClass && originalSubject)
				&& (originalClass !== editClass || originalSubject !== editSubject);

			if (changedIdentity) {
				await deleteTeacherItemAnalysis(originalClass, originalSubject);
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
			await deleteTeacherItemAnalysis(classToDelete, subjectToDelete);
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
					<h2>{data?.title ?? 'Item Analysis'}</h2>
					<div className="teacher-heading-actions">
						<button
							type="button"
							className="teacher-item-analysis-edit-btn"
							onClick={handleOpenEditModal}
							disabled={loading || !data?.selectedClass || !data?.selectedSubject}
						>
							Edit
						</button>
						<button
							type="button"
							className="teacher-item-analysis-delete-btn"
							onClick={handleDelete}
							disabled={loading || deletingRecord || !data?.selectedClass || !data?.selectedSubject}
						>
							{deletingRecord ? 'Deleting...' : 'Delete'}
						</button>
						<button
							type="button"
							className="teacher-item-analysis-upload-btn"
							onClick={() => navigate('/teacher/upload-results')}
						>
							Upload Results
						</button>
					</div>
				</div>
			</section>

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
					setSelectedClass(event.target.value);
					setSelectedSubject('');
					setSelectedQuarter('');
				}}>
					<option value="">Select Class</option>
					{availableClassOptions.map((classOption) => (
						<option key={classOption} value={classOption}>{classOption}</option>
					))}
				</select>
				<select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} disabled={!selectedClass}>
					<option value="">Select Subject</option>
					{availableSubjectOptions.map((subjectOption) => (
						<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)} disabled={!selectedSubject}>
					<option value="">Select Quarter</option>
					{availableQuarterOptions.map((quarterOption) => (
						<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
					))}
				</select>
				<button type="button" className="teacher-filter-apply-btn" onClick={handleApplyFilters} disabled={loading}>Apply</button>
			</section>

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

			<div className="teacher-tabs-stack">
				<div className="teacher-tabs-wrap">
					<div className="teacher-tabs teacher-tabs-primary">
						<button type="button" className={selectedScope === 'all' ? 'active' : ''} onClick={() => setSelectedScope('all')}>All Students</button>
						<button type="button" className={selectedScope === 'individual' ? 'active' : ''} onClick={() => setSelectedScope('individual')}>Individual</button>
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
								onChange={(event) => setSelectedIndividualSortBy(event.target.value as IndividualSortBy)}
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
					<div>
						<h2>Item Analysis</h2>
					</div>
					{selectedScope === 'all' ? (
						<select
							className="teacher-item-analysis-dropdown"
							value={selectedPerformance}
							onChange={(event) => setSelectedPerformance(event.target.value as ItemPerformanceFilter)}
							aria-label="Filter item analysis by performance"
						>
							<option value="all">All Items</option>
							<option value="excellent">Excellent</option>
							<option value="good">Good</option>
							<option value="needs">Needs Improvement</option>
						</select>
					) : selectedScope === 'individual' ? (
						<select
							className="teacher-item-analysis-dropdown"
							value={selectedIndividualResultFilter}
							onChange={(event) => setSelectedIndividualResultFilter(event.target.value as IndividualResultFilter)}
							aria-label="Filter selected student item results"
						>
							<option value="all">All Items</option>
							<option value="correct">Correct</option>
							<option value="incorrect">Incorrect</option>
						</select>
					) : null}
				</div>

				{selectedScope === 'individual' ? (
					selectedStudent?.notFound ? (
						<p className="teacher-status">Student is not found in the analysis.</p>
					) : filteredIndividualRows.length ? (
						<div className="teacher-table-wrap">
							<table className="teacher-table">
								<thead>
									<tr>
										<th>Item No.</th>
										<th>Item</th>
										<th>Score</th>
										<th>Result</th>
									</tr>
								</thead>
								<tbody>
									{filteredIndividualRows.map((row) => (
										<tr key={`individual-row-${selectedStudent?.id}-${row.itemNo}`}>
											<td>{row.itemNo}</td>
											<td>{row.item}</td>
											<td>{row.score}</td>
											<td>
												<span className={`teacher-badge ${row.interpretation === 'Correct' ? 'excellent' : row.interpretation === 'Partially Correct' ? 'fair' : 'poor'}`}>
													{row.interpretation}
												</span>
											</td>
										</tr>
									))}
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
									<th>Item No.</th>
									<th>Difficulty Index</th>
									<th>Discrimination Index</th>
									<th>Interpretation</th>
								</tr>
							</thead>
							<tbody>
								{displayedRows.map((row) => (
									<tr key={`${row.itemNo}-${row.interpretation}`}>
										<td>{row.itemNo}</td>
										<td>{row.difficultyIndex}</td>
										<td>{row.discriminationIndex}</td>
										<td>
											<span className={`teacher-badge ${getInterpretationClass(row.interpretation)}`}>
												{row.interpretation}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="teacher-status">No item analysis entries found.</p>
				)}
			</section>

			<section className="teacher-panel teacher-item-analysis-linked-panel">
				<div className="teacher-panel-head">
					<h2>Analysis</h2>
					<span>{(appliedSubject || selectedSubject) || 'Select Subject'} | {(appliedClass || selectedClass) || 'Select Class'} | {(appliedQuarter || selectedQuarter) || 'Select Quarter'}</span>
				</div>
				<p className="teacher-panel-copy">Type the content area from your T.O.S. and your intervention to meet the gap.</p>
				<div className="teacher-item-analysis-analysis-actions teacher-item-analysis-analysis-actions-left">
					<button type="button" className="teacher-secondary-btn" onClick={handleAddAnalysisEntry}>+ Add Item</button>
				</div>
				<div className="teacher-table-wrap teacher-item-analysis-analysis-wrap">
					<table className="teacher-table teacher-item-analysis-analysis-table">
						<thead>
							<tr>
								<th>Item Number</th>
								<th>Content Area Gap</th>
								<th>Intervention</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{analysisEntries.map((entry, index) => (
								<tr key={`analysis-entry-${entry.itemNumber}`}>
									<td>{entry.itemNumber}</td>
									<td>
										<input
											value={entry.contentArea}
											onChange={(event) => updateAnalysisEntry(index, { contentArea: event.target.value })}
											placeholder="Enter content area needing support"
										/>
									</td>
									<td>
										<input
											value={entry.intervention}
											onChange={(event) => updateAnalysisEntry(index, { intervention: event.target.value })}
											placeholder="Enter intervention plan"
										/>
									</td>
									<td>
										<button type="button" className="teacher-item-analysis-row-delete-btn" onClick={() => handleDeleteAnalysisEntry(index)}>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="teacher-item-analysis-analysis-actions">
					<button
						type="button"
						className="teacher-filter-apply-btn"
						onClick={handleSaveAnalysisEntries}
						disabled={savingLinkedAnalysis}
					>
						{savingLinkedAnalysis ? 'Saving...' : 'Save Analysis'}
					</button>
				</div>
			</section>
		</TeacherLayout>
	);
}

export default ItemAnalysis;
