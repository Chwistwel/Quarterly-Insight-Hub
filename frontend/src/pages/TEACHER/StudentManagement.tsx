import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { getStudentManagementData, type StudentManagementResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/StudentManagement.css';

function StudentManagement() {
	const [searchParams] = useSearchParams();
	const classId = searchParams.get('classId') ?? undefined;
	const [data, setData] = useState<StudentManagementResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		const load = async () => {
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

		void load();
	}, [classId]);

	const filteredStudents = useMemo(() => {
		const students = data?.students ?? [];
		if (!searchTerm.trim()) {
			return [...students].sort((a, b) => a.name.localeCompare(b.name));
		}

		const query = searchTerm.toLowerCase();
		const matches = students.filter((student) => (
			student.name.toLowerCase().includes(query)
			|| student.grade.toLowerCase().includes(query)
			|| student.section.toLowerCase().includes(query)
			|| student.subject.toLowerCase().includes(query)
		));

		return matches.sort((a, b) => a.name.localeCompare(b.name));
	}, [data?.students, searchTerm]);

	return (
		<TeacherLayout title={data?.title ?? 'Student Management'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'MANAGE YOUR STUDENTS'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'Student Management'}</h2>
				</div>
			</section>

			<div className="student-toolbar">
				<label className="student-search-field">
					<input
						type="search"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Search students by name, grade, or section..."
					/>
				</label>
				<button type="button" className="student-filter-btn" aria-label="Filter students">
					<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
						<path d="M4 6h16" />
						<path d="M7 12h10" />
						<path d="M10 18h4" />
					</svg>
				</button>
				<button type="button" className="teacher-primary-btn student-add-btn">+ Add Student</button>
			</div>

			{data?.classLabel ? <p className="student-class-label">{data.classLabel}</p> : null}

			{loading ? <p className="teacher-status">Loading students...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<section className="teacher-panel student-table-panel">
				<h2>{`All Students (${filteredStudents.length})`}</h2>
				<div className="teacher-table-wrap">
					<table className="teacher-table student-table">
						<thead>
							<tr>
								<th>Student Name</th>
								<th>Q1</th>
								<th>Q2</th>
								<th>Q3</th>
								<th>Q4</th>
								<th>Average</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filteredStudents.map((student) => (
								<tr key={student.id}>
									<td>{student.name}</td>
									<td>{student.q1Score}</td>
									<td>{student.q2Score}</td>
									<td>{student.q3Score}</td>
									<td>{student.q4Score}</td>
									<td className="student-average-cell">{student.average}</td>
									<td>
										<div className="student-actions">
											<button type="button" aria-label="Edit student">✎</button>
											<button type="button" aria-label="Delete student">🗑</button>
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
