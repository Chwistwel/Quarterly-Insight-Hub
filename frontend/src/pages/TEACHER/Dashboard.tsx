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
	const [appliedGrade, setAppliedGrade] = useState('');
	const [appliedQuarter, setAppliedQuarter] = useState('');

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getDashboardData(appliedGrade, appliedQuarter);
				setData(response);
				const nextGrade = response.selectedGrade ?? response.filters?.grades?.[0] ?? '';
				const nextQuarter = response.selectedQuarter ?? response.filters?.quarters?.[0] ?? '';
				setSelectedGrade(nextGrade);
				setSelectedQuarter(nextQuarter);
				setAppliedGrade(nextGrade);
				setAppliedQuarter(nextQuarter);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [appliedGrade, appliedQuarter]);

	const peakTrend = useMemo(() => {
		if (!data?.trend?.length) {
			return null;
		}

		const maxPoint = data.trend.reduce((highest, point) => (point.value > highest.value ? point : highest));
		return `${maxPoint.value}% (${maxPoint.label})`;
	}, [data]);


	return (
		<TeacherLayout title={data?.title ?? 'Dashboard'}>
			<section className="teacher-dash-heading teacher-dash-heading-divider">
				<p>{data?.systemLabel ?? 'QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM'}</p>
				<div>
					<h2>{data?.title ?? 'Dashboard'}</h2>
				</div>
			</section>

			<section className="teacher-filter-row">
				<select value={selectedGrade} onChange={(event) => {
					const nextGrade = event.target.value;
					setSelectedGrade(nextGrade);
					setAppliedGrade(nextGrade);
				}}>
					<option value="">All Grades</option>
					{(data?.filters?.grades ?? []).map((grade) => (
						<option key={grade} value={grade}>{grade}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(event) => {
					const nextQuarter = event.target.value;
					setSelectedQuarter(nextQuarter);
					setAppliedQuarter(nextQuarter);
				}}>
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

			<div className="teacher-dashboard-content-grid">
				<section className="teacher-panel teacher-dashboard-trend-panel">
					<div className="teacher-panel-head">
						<h2>Class Performance Trend</h2>
						{peakTrend ? <span>Peak: {peakTrend}</span> : null}
					</div>
					{data?.trend?.length ? (
						<div className="teacher-line-chart" aria-label="Performance trend chart">
							<svg viewBox="0 0 760 220" preserveAspectRatio="none">
								{data.trend.map((point, index) => {
									const max = 100;
									const normalized = Math.min(100, Math.max(0, point.value));
									const barHeight = (normalized / max) * 220;
									const y = 220 - barHeight;
									const step = 760 / data.trend.length;
									const barWidth = Math.min(60, step * 0.6);
									const x = index * step + (step - barWidth) / 2;
									
									return (
										<rect 
											key={point.label}
											x={x} 
											y={y} 
											width={barWidth} 
											height={barHeight} 
											fill="var(--primary, #1e3a8a)" 
											rx="4"
										/>
									);
								})}
							</svg>
							<div className="teacher-line-labels" style={{ display: 'flex', justifyContent: 'space-around' }}>
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

				<div className="teacher-dashboard-side-panels">
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
			</div>

		</TeacherLayout>
	);
}

export default Dashboard;