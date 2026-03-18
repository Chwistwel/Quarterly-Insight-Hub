import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { getMyClassesData, type TeacherClassSummary } from '../../services/teacherPortalApi';
import { TrashIcon } from '../../components/icons';
import '../../styles/TEACHER/MyClasses.css';

function MyClasses() {
	const navigate = useNavigate();
	const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getMyClassesData();
				setClasses(response);
			} catch (loadError) {
				setClasses([]);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load class sections.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	const handleViewClass = (classId: string) => {
		navigate(`/teacher/student-management?classId=${encodeURIComponent(classId)}`);
	};

	return (
		<TeacherLayout title="My Classes">
			<section className="teacher-dash-heading teacher-page-heading">
				<p>MANAGE CLASS SECTIONS</p>
				<div className="teacher-heading-row">
					<h2>My Classes</h2>
				</div>
			</section>

			{loading ? <p className="teacher-status">Loading classes...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<div className="my-classes-grid">
				{classes.map((item) => (
					<article key={item.id} className="teacher-panel my-class-card">
						<div className="my-class-head">
							<div>
								<h3>{`${item.grade} - ${item.section}`}</h3>
								<p>{item.subject}</p>
							</div>
							<span>{item.gradeTag}</span>
						</div>

						<ul className="my-class-meta">
							<li>{`${item.studentCount} Students`}</li>
							<li>{item.teacher}</li>
						</ul>

						<div className="my-class-actions">
							<button type="button" className="my-class-view-btn" onClick={() => handleViewClass(item.id)}>
								View
							</button>
							<button type="button" className="my-class-delete-btn" aria-label="Delete class"><TrashIcon className="ui-inline-icon" /></button>
						</div>
					</article>
				))}
			</div>
		</TeacherLayout>
	);
}

export default MyClasses;
