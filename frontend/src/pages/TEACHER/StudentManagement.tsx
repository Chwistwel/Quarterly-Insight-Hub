import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import {
	addStudentToClass,
	deleteStudentRecord,
	getMyClassesData,
	getStudentManagementData,
	uploadStudentClassList,
	updateStudentRecord,
	type StudentManagementResponse,
	type StudentRecord,
	type TeacherClassSummary
} from '../../services/teacherPortalApi';
import { CloseIcon, EditIcon, TrashIcon } from '../../components/icons';
import '../../styles/TEACHER/StudentManagement.css';

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
	const activeClass = useMemo(() => classOptions.find((classItem) => classItem.id === classId), [classOptions, classId]);

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

	const rankedStudents = useMemo(() => {
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

		const byName = students.sort((first, second) => {
			const firstName = extractSortableName(first);
			const secondName = extractSortableName(second);

			return firstName.lastName.localeCompare(secondName.lastName)
				|| firstName.firstName.localeCompare(secondName.firstName)
				|| firstName.middleInitial.localeCompare(secondName.middleInitial)
				|| firstName.fullName.localeCompare(secondName.fullName);
		});

		return byName.map((student, index) => {
			const parts = getNameParts(student);
			return {
				...student,
				studentNumberDisplay: String(index + 1).padStart(2, '0'),
				firstNameDisplay: parts.firstName || student.firstName || '-',
				lastNameDisplay: parts.lastName || student.lastName || '-',
				ranking: Number.isFinite(student.ranking) ? Number(student.ranking) : 0
			};
		});
	}, [data?.students]);

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

			<section className="teacher-panel student-table-panel">
				<h2>{`All Students (${rankedStudents.length})`}</h2>
				<div className="teacher-table-wrap">
					<table className="teacher-table student-table">
						<thead>
							<tr>
								<th>Student No.</th>
								<th>Last Name</th>
								<th>First Name</th>
								<th>Gender</th>
								<th>Ranking</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{rankedStudents.map((student) => (
								<tr key={student.id}>
									<td>{student.studentNumberDisplay}</td>
									<td>{student.lastNameDisplay}</td>
									<td>{student.firstNameDisplay}</td>
									<td>{student.gender || '-'}</td>
									<td className="student-average-cell">{student.ranking}</td>
									<td>
										<div className="student-actions">
											<button type="button" aria-label="Edit student" onClick={() => openEditModal(student)}><EditIcon className="ui-inline-icon" /></button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</TeacherLayout>
	);
}

export default StudentManagement;
