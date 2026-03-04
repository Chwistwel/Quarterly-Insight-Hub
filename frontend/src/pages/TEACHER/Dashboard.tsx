import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { getDashboardData, type DashboardResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/Dashboard.css';

function Dashboard() {
	const [data, setData] = useState<DashboardResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGrade, setSelectedGrade] = useState('');
	const [selectedQuarter, setSelectedQuarter] = useState('');

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getDashboardData();
				setData(response);
				setSelectedGrade(response.filters?.grades?.[0] ?? '');
				setSelectedQuarter(response.filters?.quarters?.[0] ?? '');
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	const peakTrend = useMemo(() => {
		if (!data?.trend?.length) {
			return null;
		}

		const maxPoint = data.trend.reduce((highest, point) => (point.value > highest.value ? point : highest));
		return `${maxPoint.value}% (${maxPoint.label})`;
	}, [data]);

	const trendPoints = useMemo(() => {
		if (!data?.trend?.length) {
			return '';
		}

		const max = 100;
		const width = 760;
		const height = 220;
		const step = data.trend.length > 1 ? width / (data.trend.length - 1) : width;

		return data.trend
			.map((point, index) => {
				const x = index * step;
				const normalized = Math.min(100, Math.max(0, point.value));
				const y = height - (normalized / max) * height;
				return `${x},${y}`;
			})
			.join(' ');
	}, [data]);

	return (
		<TeacherLayout title={data?.title ?? 'My Dashboard'}>
			<section className="teacher-dash-heading">
				<p>{data?.systemLabel ?? 'QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM'}</p>
				<div>
					<h2>{data?.title ?? 'My Dashboard'}</h2>
					<span>{data?.viewLabel ?? 'Teacher View'}</span>
				</div>
			</section>

			<section className="teacher-filter-row">
				<select value={selectedGrade} onChange={(event) => setSelectedGrade(event.target.value)}>
					<option value="">All Grades</option>
					{(data?.filters?.grades ?? []).map((grade) => (
						<option key={grade} value={grade}>{grade}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>
					<option value="">All Quarters</option>
					{(data?.filters?.quarters ?? []).map((quarter) => (
						<option key={quarter} value={quarter}>{quarter}</option>
					))}
				</select>
			</section>

			{loading ? <p className="teacher-status">Loading dashboard...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<div className="teacher-kpis">
				{data?.kpis?.length ? (
					data.kpis.map((kpi) => (
						<article key={kpi.label} className="teacher-card">
							<p>{kpi.label}</p>
							<strong>{kpi.value}</strong>
							{kpi.description ? <span>{kpi.description}</span> : null}
						</article>
					))
				) : (
					<p className="teacher-status">No KPI data yet.</p>
				)}
			</div>

			<section className="teacher-panel">
				<div className="teacher-panel-head">
					<h2>My Class Performance Trend</h2>
					{peakTrend ? <span>Peak: {peakTrend}</span> : null}
				</div>
				{data?.trend?.length && trendPoints ? (
					<div className="teacher-line-chart" aria-label="Performance trend chart">
						<svg viewBox="0 0 760 220" preserveAspectRatio="none">
							<polyline points={trendPoints} />
						</svg>
						<div className="teacher-line-labels">
							{data.trend.map((point) => (
								<span key={point.label}>{point.label}</span>
							))}
						</div>
					</div>
				) : (
					<p className="teacher-status">No trend data available.</p>
				)}
				{data?.trendSubtitle ? <p className="teacher-panel-copy">{data.trendSubtitle}</p> : null}
			</section>

			<div className="teacher-bottom-grid">
				<section className="teacher-panel">
					<h2>Top Performing Students</h2>
					{data?.topStudents?.length ? (
						<ul className="teacher-highlight-list">
							{data.topStudents.map((item) => (
								<li key={item.name}>
									<div>
										<span>{item.name}</span>
										<small>{item.improvement}</small>
									</div>
									<strong>{item.score}</strong>
								</li>
							))}
						</ul>
					) : (
						<p className="teacher-status">No student performance records yet.</p>
					)}
				</section>

				<section className="teacher-panel">
					<h2>Areas for Improvement</h2>
					{data?.improvementAreas?.length ? (
						<ul className="teacher-progress-list">
							{data.improvementAreas.map((item) => (
								<li key={item.area}>
									<div>
										<span>{item.area}</span>
										<strong>{item.value}</strong>
									</div>
									<div className="teacher-progress-track">
										<div className="teacher-progress-fill" style={{ width: typeof item.value === 'number' ? `${Math.min(100, Math.max(0, item.value))}%` : item.value.toString() }} />
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="teacher-status">No improvement metrics yet.</p>
					)}
				</section>
			</div>

			<section className="teacher-panel">
				<h2>Additional Highlights</h2>
				{data?.highlights?.length ? (
					<ul className="teacher-highlight-list">
						{data.highlights.map((item) => (
							<li key={item.label}>
								<span>{item.label}</span>
								<strong>{item.value}</strong>
							</li>
						))}
					</ul>
				) : (
					<p className="teacher-status">No highlights available.</p>
				)}
			</section>
		</TeacherLayout>
	);
}

export default Dashboard;