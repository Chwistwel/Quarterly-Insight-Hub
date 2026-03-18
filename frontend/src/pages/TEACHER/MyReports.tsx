import { useEffect, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { getReportsData, type ReportsResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/MyReports.css';

function MyReports() {
	const [data, setData] = useState<ReportsResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getReportsData();
				setData(response);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	return (
		<TeacherLayout title={data?.title ?? 'My Reports'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'REPORT GENERATION CENTER'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'My Reports'}</h2>
					<span>{data?.viewLabel ?? 'Teacher View'}</span>
				</div>
			</section>

			<p className="teacher-page-subtitle">
				{data?.subtitle ?? 'Generate and download reports for your classes and student performance'}
			</p>

			{loading ? <p className="teacher-status">Loading reports...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<div className="reports-action-grid">
				{data?.actions?.length ? (
					data.actions.map((action, index) => (
						<article
							key={action.id}
							className={`reports-action-card${index === 1 ? ' blue' : ''}${index === 2 ? ' green' : ''}`}
						>
							<h3>{action.title}</h3>
							<p>{action.description}</p>
							<button type="button">{action.buttonLabel}</button>
						</article>
					))
				) : (
					<p className="teacher-status">No report actions available.</p>
				)}
			</div>

			<section className="teacher-panel">
				<h2>Available Reports</h2>
				{data?.summary ? <p className="teacher-panel-copy">{data.summary}</p> : null}
				{data?.reports?.length ? (
					<div className="reports-grid">
						{data.reports.map((report) => (
							<article key={report.id} className="reports-card">
								<strong>{report.title}</strong>
								<p>{report.category}</p>
								<div className="reports-card-meta">
									<span>{report.updatedAt}</span>
									<button type="button">Download</button>
								</div>
							</article>
						))}
					</div>
				) : (
					<p className="teacher-status">No reports available.</p>
				)}
			</section>
		</TeacherLayout>
	);
}

export default MyReports;
