import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import {
	addStudentToClass,
	deleteStudentRecord,
	getItemAnalysisData,
	getMyClassesData,
	getTeacherTosBlueprint,
	getStudentManagementData,
	uploadStudentClassList,
	updateStudentRecord,
	type ItemAnalysisResponse,
	type TosBlueprintRecord,
	type StudentManagementResponse,
	type StudentRecord,
	type TeacherClassSummary
} from '../../services/teacherPortalApi';
import { CloseIcon, EditIcon, TrashIcon } from '../../components/icons';
import '../../styles/TEACHER/StudentManagement.css';

type StudentCardView = 'students' | 'analysis';
type StudentSortBy = 'name' | 'ranking' | 'score';
type TosBloomKey = 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating';

const ANALYSIS_QUARTERS = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];

const BLOOM_ORDER: TosBloomKey[] = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
const BLOOM_LABELS: Record<TosBloomKey, string> = {
	remembering: 'Remembering',
	understanding: 'Understanding',
	applying: 'Applying',
	analyzing: 'Analyzing',
	evaluating: 'Evaluating',
	creating: 'Creating'
};

function getCurrentSchoolYear(): string {
	const currentYear = new Date().getFullYear();
	const startYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;
	return `${startYear}-${startYear + 1}`;
}

function getSimpleStudentId(studentId: string): string {
	const normalized = String(studentId ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
	if (!normalized) {
		return '-';
	}

	return `SID-${normalized.slice(-6)}`;
}

function StudentManagement() {
	const [searchParams] = useSearchParams();
	const classId = searchParams.get('classId') ?? undefined;
	const [data, setData] = useState<StudentManagementResponse | null>(null);
	const [classOptions, setClassOptions] = useState<TeacherClassSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [addingStudent, setAddingStudent] = useState(false);
	const [updatingStudent, setUpdatingStudent] = useState(false);
	const [deletingStudent, setDeletingStudent] = useState(false);
	const [uploadingClassList, setUploadingClassList] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);
	const [editingStudentId, setEditingStudentId] = useState('');
	const [addFirstName, setAddFirstName] = useState('');
	const [addMiddleName, setAddMiddleName] = useState('');
	const [addLastName, setAddLastName] = useState('');
	const [addGender, setAddGender] = useState('');
	const [addClassId, setAddClassId] = useState('');
	const [uploadClassId, setUploadClassId] = useState('');
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadFileName, setUploadFileName] = useState('');
	const [editFirstName, setEditFirstName] = useState('');
	const [editMiddleInitial, setEditMiddleInitial] = useState('');
	const [editLastName, setEditLastName] = useState('');
	const [editGender, setEditGender] = useState('');
	const [editQ1, setEditQ1] = useState('0');
	const [editQ2, setEditQ2] = useState('0');
	const [editQ3, setEditQ3] = useState('0');
	const [editQ4, setEditQ4] = useState('0');
	const [selectedStudentCardView, setSelectedStudentCardView] = useState<StudentCardView>('students');
	const [studentSortBy, setStudentSortBy] = useState<StudentSortBy>('name');
	const [selectedAnalysisQuarter, setSelectedAnalysisQuarter] = useState('Quarter 1');
	const [studentEditMode, setStudentEditMode] = useState(false);
	const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
	const [analysisLoading, setAnalysisLoading] = useState(false);
	const [analysisError, setAnalysisError] = useState<string | null>(null);
	const [itemAnalysisData, setItemAnalysisData] = useState<ItemAnalysisResponse | null>(null);
	const [tosBlueprint, setTosBlueprint] = useState<TosBlueprintRecord | null>(null);
	const activeClass = useMemo(() => classOptions.find((classItem) => classItem.id === classId), [classOptions, classId]);

	const tosRows = tosBlueprint?.rows || [];
	const rowTotals = useMemo(
		() => tosRows.map((row) => BLOOM_ORDER.reduce((sum, key) => sum + row.counts[key], 0)),
		[tosRows]
	);

	const bloomTotals = useMemo(() => {
		const totals: Record<TosBloomKey, number> = {
			remembering: 0,
			understanding: 0,
			applying: 0,
			analyzing: 0,
			evaluating: 0,
			creating: 0
		};
		tosRows.forEach((row) => {
			BLOOM_ORDER.forEach((key) => {
				totals[key] += row.counts[key];
			});
		});
		return totals;
	}, [tosRows]);

	const totalAllocatedItems = useMemo(
		() => rowTotals.reduce((sum, value) => sum + value, 0),
		[rowTotals]
	);

	const totalAllocatedPercentage = useMemo(
		() => tosRows.reduce((sum, row) => sum + row.percentage, 0),
		[tosRows]
	);

	const itemPlacements = useMemo(() => {
		let pointer = 1;
		const placementRows: Record<TosBloomKey, string>[] = tosRows.map(() => ({
			remembering: '',
			understanding: '',
			applying: '',
			analyzing: '',
			evaluating: '',
			creating: ''
		}));

		tosRows.forEach((row, rowIndex) => {
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
	}, [tosRows]);

	const loadData = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await getStudentManagementData(classId);
			setData(response);
		} catch (loadError) {
			setData(null);
			setError(loadError instanceof Error ? loadError.message : 'Unable to load student records.');
		} finally {
			setLoading(false);
		}
	};

	const loadClassOptions = async () => {
		try {
			const classes = await getMyClassesData();
			setClassOptions(classes);
		} catch {
			setClassOptions([]);
		}
	};

	useEffect(() => {
		void loadData();
	}, [classId]);

	useEffect(() => {
		void loadClassOptions();
	}, []);

	useEffect(() => {
		const loadAnalysisData = async () => {
			if (!activeClass) {
				setItemAnalysisData(null);
				setTosBlueprint(null);
				setAnalysisError(null);
				return;
			}

			setAnalysisLoading(true);
			setAnalysisError(null);

			try {
				const schoolYear = getCurrentSchoolYear();
				const classValue = `${activeClass.grade} - ${activeClass.section}`;
				const [analysisResponse, tosResponse] = await Promise.all([
					getItemAnalysisData(classValue, activeClass.subject, selectedAnalysisQuarter),
					getTeacherTosBlueprint({
						schoolYear,
						classValue,
						subject: activeClass.subject,
						quarter: selectedAnalysisQuarter
					})
				]);

				setItemAnalysisData(analysisResponse);
				setTosBlueprint(tosResponse);
			} catch (loadError) {
				setItemAnalysisData(null);
				setTosBlueprint(null);
				setAnalysisError(loadError instanceof Error ? loadError.message : 'Unable to load analysis data.');
			} finally {
				setAnalysisLoading(false);
			}
		};

		void loadAnalysisData();
	}, [activeClass, selectedAnalysisQuarter]);

	const openAddModal = () => {
		setActionMessage(null);
		setAddFirstName('');
		setAddMiddleName('');
		setAddLastName('');
		setAddGender('');
		setAddClassId(activeClass?.id ?? classOptions[0]?.id ?? '');

		setShowAddModal(true);
	};

	const closeAddModal = () => {
		if (!addingStudent) {
			setShowAddModal(false);
		}
	};

	const openUploadModal = () => {
		setActionMessage(null);
		setUploadClassId(activeClass?.id ?? classOptions[0]?.id ?? '');
		setUploadFile(null);
		setUploadFileName('');
		setShowUploadModal(true);
	};

	const closeUploadModal = () => {
		if (!uploadingClassList) {
			setShowUploadModal(false);
		}
	};

	const getNameParts = (student: StudentRecord): { firstName: string; middleInitial: string; lastName: string } => {
		if (student.firstName || student.lastName) {
			return {
				firstName: student.firstName ?? '',
				middleInitial: student.middleInitial ?? '',
				lastName: student.lastName ?? ''
			};
		}

		const tokens = student.name.trim().split(/\s+/).filter(Boolean);
		if (tokens.length === 0) {
			return { firstName: '', middleInitial: '', lastName: '' };
		}

		if (tokens.length === 1) {
			return { firstName: tokens[0], middleInitial: '', lastName: '' };
		}

		const firstName = tokens.slice(0, -1).join(' ');
		const lastName = tokens[tokens.length - 1] ?? '';
		const middleInitial = '';

		return { firstName, middleInitial, lastName };
	};

	const openEditModal = (student: StudentRecord) => {
		setActionMessage(null);
		const parts = getNameParts(student);
		setEditingStudentId(student.id);
		setEditFirstName(parts.firstName);
		setEditMiddleInitial(parts.middleInitial);
		setEditLastName(parts.lastName);
		setEditGender(student.gender ?? '');
		setEditQ1(String(student.q1Score ?? 0));
		setEditQ2(String(student.q2Score ?? 0));
		setEditQ3(String(student.q3Score ?? 0));
		setEditQ4(String(student.q4Score ?? 0));
		setShowEditModal(true);
	};

	const closeEditModal = () => {
		if (!updatingStudent && !deletingStudent) {
			setShowEditModal(false);
		}
	};

	const handleDeleteStudent = async () => {
		setActionMessage(null);

		if (!editingStudentId) {
			setActionMessage('No student selected for deletion.');
			return;
		}

		const confirmed = window.confirm('Delete this student record? This action cannot be undone.');
		if (!confirmed) {
			return;
		}

		try {
			setDeletingStudent(true);
			await deleteStudentRecord(editingStudentId);
			setShowEditModal(false);
			setActionMessage('Student deleted successfully.');
			await loadData();
		} catch (deleteError) {
			setActionMessage(deleteError instanceof Error ? deleteError.message : 'Unable to delete student.');
		} finally {
			setDeletingStudent(false);
		}
	};

	const parseScore = (value: string): number | null => {
		const parsed = Number.parseFloat(value);
		if (!Number.isFinite(parsed)) {
			return null;
		}

		return Math.max(0, Math.min(100, Math.round(parsed)));
	};

	const handleEditStudent = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setActionMessage(null);

		if (!editingStudentId) {
			setActionMessage('No student selected for update.');
			return;
		}

		if (!editFirstName.trim() || !editLastName.trim()) {
			setActionMessage('Firstname and Lastname are required.');
			return;
		}

		const normalizedQ1 = parseScore(editQ1);
		const normalizedQ2 = parseScore(editQ2);
		const normalizedQ3 = parseScore(editQ3);
		const normalizedQ4 = parseScore(editQ4);

		if (normalizedQ1 === null || normalizedQ2 === null || normalizedQ3 === null || normalizedQ4 === null) {
			setActionMessage('Q1 to Q4 grades must be valid numbers.');
			return;
		}

		try {
			setUpdatingStudent(true);
			await updateStudentRecord(editingStudentId, {
				firstName: editFirstName.trim(),
				middleInitial: editMiddleInitial.trim().slice(0, 1),
				lastName: editLastName.trim(),
				gender: editGender.trim(),
				q1Score: normalizedQ1,
				q2Score: normalizedQ2,
				q3Score: normalizedQ3,
				q4Score: normalizedQ4
			});

			setShowEditModal(false);
			setActionMessage('Student updated successfully.');
			await loadData();
		} catch (updateError) {
			setActionMessage(updateError instanceof Error ? updateError.message : 'Unable to update student.');
		} finally {
			setUpdatingStudent(false);
		}
	};

	const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setActionMessage(null);

		if (!addFirstName.trim() || !addLastName.trim()) {
			setActionMessage('Firstname and Lastname are required.');
			return;
		}

		if (!addGender.trim()) {
			setActionMessage('Gender is required.');
			return;
		}

		const matchedClassId = activeClass?.id ?? addClassId;
		if (!matchedClassId) {
			setActionMessage('Select a class.');
			return;
		}

		try {
			setAddingStudent(true);
			await addStudentToClass(matchedClassId, {
				firstName: addFirstName.trim(),
				middleName: addMiddleName.trim(),
				lastName: addLastName.trim(),
				gender: addGender.trim()
			});
			setActionMessage('Student added successfully.');
			setShowAddModal(false);
			setAddFirstName('');
			setAddMiddleName('');
			setAddLastName('');
			setAddGender('');
			await loadData();
			await loadClassOptions();
		} catch (addError) {
			setActionMessage(addError instanceof Error ? addError.message : 'Unable to add student.');
		} finally {
			setAddingStudent(false);
		}
	};

	const handleUploadClassList = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setActionMessage(null);

		const matchedClassId = activeClass?.id ?? uploadClassId;
		if (!matchedClassId) {
			setActionMessage('Select a class for class-list upload.');
			return;
		}

		if (!uploadFile) {
			setActionMessage('Please choose a CSV or Excel class list file.');
			return;
		}

		try {
			setUploadingClassList(true);
			const result = await uploadStudentClassList(matchedClassId, uploadFile);
			setActionMessage(`${result.message} Added: ${result.addedCount}, Skipped: ${result.skippedCount}.`);
			setShowUploadModal(false);
			setUploadFile(null);
			setUploadFileName('');
			await loadData();
			await loadClassOptions();
		} catch (uploadError) {
			setActionMessage(uploadError instanceof Error ? uploadError.message : 'Unable to upload class list.');
		} finally {
			setUploadingClassList(false);
		}
	};

	const sortedStudents = useMemo(() => {
		const students = [...(data?.students ?? [])];

		const extractSortableName = (student: StudentRecord): { lastName: string; firstName: string; middleInitial: string; fullName: string } => {
			const parts = getNameParts(student);
			return {
				lastName: parts.lastName.trim().toLowerCase(),
				firstName: parts.firstName.trim().toLowerCase(),
				middleInitial: parts.middleInitial.trim().toLowerCase(),
				fullName: student.name.trim().toLowerCase()
			};
		};

		const compareByName = (first: StudentRecord, second: StudentRecord) => {
			const firstName = extractSortableName(first);
			const secondName = extractSortableName(second);

			return firstName.lastName.localeCompare(secondName.lastName)
				|| firstName.firstName.localeCompare(secondName.firstName)
				|| firstName.middleInitial.localeCompare(secondName.middleInitial)
				|| firstName.fullName.localeCompare(secondName.fullName);
		};

		const compareByRanking = (first: StudentRecord, second: StudentRecord) => (first.ranking ?? 0) - (second.ranking ?? 0);
		const compareByScore = (first: StudentRecord, second: StudentRecord) => {
			const firstScore = Number.parseFloat(String(first.average ?? '0')) || 0;
			const secondScore = Number.parseFloat(String(second.average ?? '0')) || 0;
			return secondScore - firstScore;
		};

		const sorted = [...students].sort((first, second) => {
			switch (studentSortBy) {
				case 'ranking':
					return compareByRanking(first, second) || compareByName(first, second);
				case 'score':
					return compareByScore(first, second) || compareByName(first, second);
				case 'name':
				default:
					return compareByName(first, second);
			}
		});

		return sorted.map((student, index) => {
			const parts = getNameParts(student);
			const persistedStudentNo = String(student.studentNo ?? '').trim();
			return {
				...student,
				studentNumberDisplay: String(index + 1).padStart(2, '0'),
				studentSimpleId: persistedStudentNo || getSimpleStudentId(student.id),
				firstNameDisplay: parts.firstName || student.firstName || '-',
				lastNameDisplay: parts.lastName || student.lastName || '-',
				ranking: Number.isFinite(student.ranking) ? Number(student.ranking) : 0
			};
		});
	}, [data?.students, studentSortBy]);

	const allStudentsSelected = sortedStudents.length > 0 && selectedStudentIds.length === sortedStudents.length;

	const handleToggleStudentSelection = (studentId: string) => {
		setSelectedStudentIds((previous) => (
			previous.includes(studentId)
				? previous.filter((id) => id !== studentId)
				: [...previous, studentId]
		));
	};

	const handleSelectAllStudents = () => {
		setSelectedStudentIds((previous) => (
			previous.length === sortedStudents.length
				? []
				: sortedStudents.map((student) => student.id)
		));
	};

	const handleEnterEditMode = () => {
		setActionMessage(null);
		setStudentEditMode(true);
	};

	const handleCancelEditMode = () => {
		setSelectedStudentIds([]);
		setStudentEditMode(false);
	};

	const handleDeleteSelectedStudents = async () => {
		setActionMessage(null);

		if (selectedStudentIds.length === 0) {
			setActionMessage('Select at least one student to delete.');
			return;
		}

		const confirmed = window.confirm(`Delete ${selectedStudentIds.length} selected student record(s)? This action cannot be undone.`);
		if (!confirmed) {
			return;
		}

		try {
			setDeletingStudent(true);
			const results = await Promise.allSettled(selectedStudentIds.map((studentId) => deleteStudentRecord(studentId)));

			const deletedCount = results.filter((result) => result.status === 'fulfilled').length;
			const failedCount = results.length - deletedCount;

			if (failedCount > 0) {
				setActionMessage(`Deleted ${deletedCount} student(s). ${failedCount} could not be deleted.`);
			} else {
				setActionMessage(`${deletedCount} student(s) deleted successfully.`);
			}

			setSelectedStudentIds([]);
			setStudentEditMode(false);
			await loadData();
		} catch (deleteError) {
			setActionMessage(deleteError instanceof Error ? deleteError.message : 'Unable to delete selected students.');
		} finally {
			setDeletingStudent(false);
		}
	};

	return (
		<TeacherLayout title={data?.title ?? 'Student Management'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'MANAGE YOUR STUDENTS'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'Student Management'}</h2>
				</div>
			</section>

			<div className="student-toolbar">
				<button type="button" className="teacher-secondary-btn student-upload-btn" onClick={openUploadModal}>
					Upload Class List
				</button>
				<button type="button" className="teacher-primary-btn student-add-btn" onClick={openAddModal}>
					+ Add Student
				</button>
			</div>

			{showUploadModal ? (
				<div className="teacher-modal-backdrop" onClick={closeUploadModal}>
					<section className="teacher-modal" onClick={(event) => event.stopPropagation()}>
						<div className="teacher-modal-head">
							<h3>Upload Class List</h3>
							<button type="button" className="teacher-modal-close" onClick={closeUploadModal} aria-label="Close upload form"><CloseIcon className="ui-inline-icon" /></button>
						</div>

						<form className="teacher-modal-form" onSubmit={handleUploadClassList}>
							{!activeClass ? (
								<label>
									Class
									<select value={uploadClassId} onChange={(event) => setUploadClassId(event.target.value)} required>
										{classOptions.length === 0 ? <option value="">No classes available</option> : null}
										{classOptions.map((classOption) => (
											<option key={classOption.id} value={classOption.id}>{`${classOption.grade} - ${classOption.section} (${classOption.subject})`}</option>
										))}
									</select>
								</label>
							) : (
								<p className="student-class-label">{`Class: ${activeClass.grade} - ${activeClass.section} (${activeClass.subject})`}</p>
							)}

							<label>
								Class List File
								<input
									type="file"
									accept=".csv,.xlsx,.xls"
									onChange={(event) => {
										const file = event.target.files?.[0] ?? null;
										setUploadFile(file);
										setUploadFileName(file?.name ?? '');
									}}
									required
								/>
							</label>

							{uploadFileName ? <p className="student-upload-file-name">Selected: {uploadFileName}</p> : null}
							<p className="student-upload-hint">Required columns: Firstname, Lastname. Optional: Gender, Student ID.</p>

							<button type="submit" className="teacher-primary-btn" disabled={uploadingClassList || (!activeClass && classOptions.length === 0)}>
								{uploadingClassList ? 'Uploading...' : 'Upload and Auto Add Students'}
							</button>
						</form>
					</section>
				</div>
			) : null}

			{showAddModal ? (
				<div className="teacher-modal-backdrop" onClick={closeAddModal}>
					<section className="teacher-modal" onClick={(event) => event.stopPropagation()}>
						<div className="teacher-modal-head">
							<h3>Add Student</h3>
							<button type="button" className="teacher-modal-close" onClick={closeAddModal} aria-label="Close add student form"><CloseIcon className="ui-inline-icon" /></button>
						</div>

						<form className="teacher-modal-form" onSubmit={handleAddStudent}>
							<label>
								Firstname
								<input
									type="text"
									value={addFirstName}
									onChange={(event) => setAddFirstName(event.target.value)}
									placeholder="Enter firstname"
									required
								/>
							</label>

							<label>
								MN
								<input
									type="text"
									value={addMiddleName}
									onChange={(event) => setAddMiddleName(event.target.value)}
									placeholder="Enter middle name"
								/>
							</label>

							<label>
								Lastname
								<input
									type="text"
									value={addLastName}
									onChange={(event) => setAddLastName(event.target.value)}
									placeholder="Enter lastname"
									required
								/>
							</label>

							<label>
								Gender
								<select value={addGender} onChange={(event) => setAddGender(event.target.value)} required>
									<option value="">Select gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
								</select>
							</label>

							{!activeClass ? (
								<label>
									Class
									<select value={addClassId} onChange={(event) => setAddClassId(event.target.value)} required>
										{classOptions.length === 0 ? <option value="">No classes available</option> : null}
										{classOptions.map((classOption) => (
											<option key={classOption.id} value={classOption.id}>{`${classOption.grade} - ${classOption.section} (${classOption.subject})`}</option>
										))}
									</select>
								</label>
							) : null}

							{activeClass ? <p className="student-class-label">{`Class: ${activeClass.grade} - ${activeClass.section} (${activeClass.subject})`}</p> : null}

							<button type="submit" className="teacher-primary-btn" disabled={addingStudent || (!activeClass && classOptions.length === 0)}>
								{addingStudent ? 'Adding...' : 'Add Student'}
							</button>
						</form>
					</section>
				</div>
			) : null}

			{showEditModal ? (
				<div className="teacher-modal-backdrop" onClick={closeEditModal}>
					<section className="teacher-modal" onClick={(event) => event.stopPropagation()}>
						<div className="teacher-modal-head">
							<h3>Edit Student</h3>
							<button type="button" className="teacher-modal-close" onClick={closeEditModal} aria-label="Close edit student form"><CloseIcon className="ui-inline-icon" /></button>
						</div>

						<form className="teacher-modal-form" onSubmit={handleEditStudent}>
							<label>
								Firstname
								<input type="text" value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} required />
							</label>

							<label>
								MI
								<input type="text" value={editMiddleInitial} onChange={(event) => setEditMiddleInitial(event.target.value)} maxLength={1} />
							</label>

							<label>
								Lastname
								<input type="text" value={editLastName} onChange={(event) => setEditLastName(event.target.value)} required />
							</label>

							<label>
								Gender
								<input type="text" value={editGender} onChange={(event) => setEditGender(event.target.value)} placeholder="Male/Female" />
							</label>

							<div className="student-modal-actions">
								<button
									type="button"
									className="student-delete-btn"
									onClick={handleDeleteStudent}
									disabled={updatingStudent || deletingStudent}
								>
									<TrashIcon className="ui-inline-icon" />
									{deletingStudent ? 'Deleting...' : 'Delete Student'}
								</button>

								<button type="submit" className="teacher-primary-btn" disabled={updatingStudent || deletingStudent}>
									{updatingStudent ? 'Saving...' : 'Save Changes'}
								</button>
							</div>
						</form>
					</section>
				</div>
			) : null}

			{actionMessage ? <p className="teacher-status">{actionMessage}</p> : null}

			{data?.classLabel ? <p className="student-class-label">{data.classLabel}</p> : null}

			{loading ? <p className="teacher-status">Loading students...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<div className="student-view-toggle-wrap">
				<div className="student-panel-toggle" role="tablist" aria-label="Student card views">
					<button
						type="button"
						className={selectedStudentCardView === 'students' ? 'active' : ''}
						onClick={() => setSelectedStudentCardView('students')}
						role="tab"
						aria-selected={selectedStudentCardView === 'students'}
					>
						All Students
					</button>
					<button
						type="button"
						className={selectedStudentCardView === 'analysis' ? 'active' : ''}
						onClick={() => setSelectedStudentCardView('analysis')}
						role="tab"
						aria-selected={selectedStudentCardView === 'analysis'}
					>
						Analysis
					</button>
				</div>
			</div>

			<section className="teacher-panel student-table-panel">
				<div className="teacher-panel-head student-panel-head">
					<div className="student-panel-title-group">
						<h2>{`All Students (${sortedStudents.length})`}</h2>
					</div>
					<div className="student-panel-controls">
						{selectedStudentCardView === 'students' ? (
							<div className="student-panel-student-controls">
								{studentEditMode ? (
									<div className="student-bulk-actions" role="group" aria-label="Bulk student actions">
										<button type="button" className="student-cancel-btn" onClick={handleCancelEditMode} disabled={deletingStudent}>
											Cancel
										</button>
										<button
											type="button"
											className="student-delete-btn"
											onClick={handleDeleteSelectedStudents}
											disabled={deletingStudent || selectedStudentIds.length === 0}
										>
											<TrashIcon className="ui-inline-icon" />
											{deletingStudent ? 'Deleting...' : `Delete (${selectedStudentIds.length})`}
										</button>
									</div>
								) : (
									<button
										type="button"
										className="student-edit-mode-btn"
										onClick={handleEnterEditMode}
										aria-label="Edit student information and select students"
									>
										<EditIcon className="ui-inline-icon" />
									</button>
								)}

								<label className="teacher-sort-control" aria-label="Sort students">
									<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
										<path d="M4 6h12" />
										<path d="M4 12h8" />
										<path d="M4 18h14" />
										<path d="M18 8l2-2 2 2" />
										<path d="M20 6v12" />
									</svg>
									<select value={studentSortBy} onChange={(event) => setStudentSortBy(event.target.value as StudentSortBy)}>
										<option value="name">Sort by: Name</option>
										<option value="ranking">Sort by: Ranking</option>
										<option value="score">Sort by: Score</option>
									</select>
								</label>
							</div>
						) : (
							<label className="teacher-sort-control" aria-label="Select analysis quarter">
								<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
									<path d="M4 6h12" />
									<path d="M4 12h8" />
									<path d="M4 18h14" />
									<path d="M18 8l2-2 2 2" />
									<path d="M20 6v12" />
								</svg>
								<select value={selectedAnalysisQuarter} onChange={(event) => setSelectedAnalysisQuarter(event.target.value)}>
									{ANALYSIS_QUARTERS.map((quarter) => (
										<option key={quarter} value={quarter}>{quarter}</option>
									))}
								</select>
							</label>
						)}
					</div>
				</div>

				{selectedStudentCardView === 'students' ? (
					<div className="teacher-table-wrap">
						<table className="teacher-table student-table">
							<thead>
								<tr>
									{studentEditMode ? <th className="student-select-header"><input type="checkbox" checked={allStudentsSelected} onChange={handleSelectAllStudents} aria-label="Select all students" /></th> : null}
									<th aria-label="Student No."></th>
									<th>Student ID</th>
									<th>Last Name</th>
									<th>First Name</th>
									<th>Gender</th>
									<th>Ranking</th>
									{studentEditMode ? <th>Actions</th> : null}
								</tr>
							</thead>
							<tbody>
								{sortedStudents.map((student) => (
									<tr key={student.id}>
										{studentEditMode ? (
											<td className="student-select-cell">
												<input
													type="checkbox"
													checked={selectedStudentIds.includes(student.id)}
													onChange={() => handleToggleStudentSelection(student.id)}
													aria-label={`Select ${student.firstNameDisplay} ${student.lastNameDisplay}`}
												/>
											</td>
										) : null}
										<td>{student.studentNumberDisplay}</td>
										<td>{student.studentSimpleId}</td>
										<td>{student.lastNameDisplay}</td>
										<td>{student.firstNameDisplay}</td>
										<td>{student.gender || '-'}</td>
										<td className="student-average-cell">{student.ranking}</td>
										{studentEditMode ? (
											<td>
												<button type="button" className="student-edit-info-btn" onClick={() => openEditModal(student)}>
													Edit Info
												</button>
											</td>
										) : null}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="student-analysis-stack">
						{analysisLoading ? <p className="teacher-status">Loading analysis for {selectedAnalysisQuarter}...</p> : null}
						{analysisError ? <p className="teacher-status teacher-status-error">{analysisError}</p> : null}
						{activeClass ? (
							<>
								<section className="student-analysis-card">
									<div className="student-analysis-card-head">
										<h3>Uploaded Analysis</h3>
										<span>{selectedAnalysisQuarter}</span>
									</div>
									{itemAnalysisData?.rows?.length ? (
										<div className="teacher-table-wrap student-analysis-table-wrap">
											<table className="teacher-table student-analysis-table">
												<thead>
													<tr>
														<th>Item No.</th>
														<th>Difficulty Index</th>
														<th>Discrimination Index</th>
														<th>Interpretation</th>
													</tr>
												</thead>
												<tbody>
													{itemAnalysisData.rows.map((row) => (
														<tr key={`student-analysis-${selectedAnalysisQuarter}-${row.itemNo}`}>
															<td>{row.itemNo}</td>
															<td>{row.difficultyIndex}</td>
															<td>{row.discriminationIndex}</td>
															<td>{row.interpretation}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="teacher-status">No uploaded analysis found for {selectedAnalysisQuarter}.</p>
									)}
								</section>

								<section className="student-analysis-card">
									<div className="student-analysis-card-head">
										<h3>Saved TOS</h3>
										<span>{selectedAnalysisQuarter}</span>
									</div>
									{tosBlueprint && tosRows.length > 0 ? (
										<div className="teacher-table-wrap student-analysis-table-wrap" style={{ overflowX: 'auto' }}>
											<table className="teacher-table student-analysis-table" style={{ minWidth: '1200px', borderCollapse: 'collapse' }}>
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
													{tosRows.map((row, rowIndex) => (
														<tr key={`student-tos-${selectedAnalysisQuarter}-${row.id}`}>
															<td style={{ border: '1px solid var(--border)', padding: '0.5rem' }}>{row.topic || `Topic ${row.id}`}</td>
															<td style={{ border: '1px solid var(--border)', padding: '0.5rem' }}>{row.competency}</td>
															<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>{row.days}</td>
															<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>{row.percentage}</td>
															{BLOOM_ORDER.map((key) => (
																<React.Fragment key={key}>
																	<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>
																		{row.counts[key]}
																	</td>
																	<td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
																		{itemPlacements[rowIndex]?.[key] ?? '-'}
																	</td>
																</React.Fragment>
															))}
															<td className="teacher-tos-total-cell" style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{rowTotals[rowIndex]}</td>
														</tr>
													))}
												</tbody>
												<tfoot>
													<tr>
														<td colSpan={2} style={{ border: '1px solid var(--border)', textAlign: 'right', paddingRight: '1rem', fontWeight: 'bold' }}>TOTAL</td>
														<td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{tosRows.reduce((sum, row) => sum + row.days, 0)}</td>
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
									) : (
										<p className="teacher-status">No saved TOS found for {selectedAnalysisQuarter}.</p>
									)}
									
									{tosBlueprint && tosRows.length > 0 ? (
										<div style={{ marginTop: '3rem' }}>
											<h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Cognitive Process Distribution</h4>
											<div className="teacher-tos-bars">
												{BLOOM_ORDER.map((key) => {
													const value = bloomTotals[key];
													const totalItemsVal = tosBlueprint.totalItems || 1;
													const height = totalItemsVal > 0 ? Math.min(100, (value / totalItemsVal) * 100) : 0;
						
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
										</div>
									) : null}
								</section>
							</>
						) : (
							<p className="teacher-status">Select a class to view its analysis and TOS content.</p>
						)}
					</div>
				)}
			</section>
		</TeacherLayout>
	);
}

export default StudentManagement;
