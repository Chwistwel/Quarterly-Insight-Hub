import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/SchoolOverview.css';

type SchoolOverviewResponse = {
	kpis: {
		schoolAverage: number;
		overallPassRate: number;
		totalStudents: number;
		activeTeachers: number;
	};
	gradeOptions: Array<{ id: string; label: string }>;
	gradeBars: Array<{ label: string; value: number }>;
	subjectBars: Array<{ label: string; value: number }>;
	gradeSummary: Array<{
		gradeLevel: string;
		averageScore: number;
		students: number;
		passRate: number;
		status: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
	}>;
};

function SchoolOverview() {
	const [data, setData] = useState<SchoolOverviewResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedGradeLevel, setSelectedGradeLevel] = useState('All Grades');
	const [selectedQuarter, setSelectedQuarter] = useState('All Quarters');
	const [appliedGradeLevel, setAppliedGradeLevel] = useState('All Grades');
	const [appliedQuarter, setAppliedQuarter] = useState('All Quarters');

	const gradeOptions = useMemo(() => ([
		{ id: 'All Grades', label: 'All Grades' },
		...(data?.gradeOptions ?? [])
	]), [data?.gradeOptions]);

	const quarterOptions = ['All Quarters', 'Q1', 'Q2', 'Q3', 'Q4'];

	const parseGradeOrder = (label: string): number => {
		const match = label.match(/\d+/);
		return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
	};

	const sortedGradeBars = useMemo(() => {
		return [...(data?.gradeBars ?? [])].sort((first, second) => {
			const byGrade = parseGradeOrder(first.label) - parseGradeOrder(second.label);
			if (byGrade !== 0) {
				return byGrade;
			}

			return first.label.localeCompare(second.label);
		});
	}, [data?.gradeBars]);

	const sortedSubjectBars = useMemo(() => {
		return [...(data?.subjectBars ?? [])].sort((first, second) => second.value - first.value || first.label.localeCompare(second.label));
	}, [data?.subjectBars]);

	const sortedGradeSummary = useMemo(() => {
		return [...(data?.gradeSummary ?? [])].sort((first, second) => {
			const byGrade = parseGradeOrder(first.gradeLevel) - parseGradeOrder(second.gradeLevel);
			if (byGrade !== 0) {
				return byGrade;
			}

			return first.gradeLevel.localeCompare(second.gradeLevel);
		});
	}, [data?.gradeSummary]);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const role = localStorage.getItem('userRole') ?? '';
				const email = localStorage.getItem('userEmail') ?? '';
				const params = new URLSearchParams();
				if (appliedGradeLevel) {
					params.set('gradeLevel', appliedGradeLevel);
				}
				if (appliedQuarter) {
					params.set('quarter', appliedQuarter);
				}

				const query = params.toString();
				const response = await fetchJson<SchoolOverviewResponse>(`/api/admin/school-overview${query ? `?${query}` : ''}`, {
					method: 'GET',
					headers: {
						'x-user-role': role,
						'x-user-email': email
					}
				});

				setData(response);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load school overview data.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [appliedGradeLevel, appliedQuarter]);

	const handleApplyFilters = () => {
		setAppliedGradeLevel(selectedGradeLevel);
		setAppliedQuarter(selectedQuarter);
	};

	const getStatusBadgeClass = (status: 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement'): string => {
		if (status === 'Excellent') {
			return 'excellent';
		}

		if (status === 'Good') {
			return 'good';
		}

		if (status === 'Fair') {
			return 'fair';
		}

		return 'poor';
	};

	return (
		<AdminLayout
			kicker="QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM"
			title="School Overview"
		>
			{loading ? <p className="admin-subcopy">Loading school overview...</p> : null}
			{error ? <p className="admin-subcopy" style={{ color: '#c43d3d' }}>{error}</p> : null}

			<section className="admin-filter-row">
				<select value={selectedGradeLevel} onChange={(event) => setSelectedGradeLevel(event.target.value)}>
					{gradeOptions.map((gradeOption) => (
						<option key={gradeOption.id} value={gradeOption.id}>{gradeOption.label}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>
					{quarterOptions.map((quarter) => (
						<option key={quarter} value={quarter}>{quarter}</option>
					))}
				</select>
				<button type="button" className="admin-filter-apply-btn" onClick={handleApplyFilters} disabled={loading}>
					Apply
				</button>
			</section>

			<section className="admin-kpis admin-kpis-2">
				<article className="admin-card">
					<p>TOTAL STUDENTS</p>
					<strong>{data?.kpis.totalStudents ?? 0}</strong>
					<span>Across all grades</span>
				</article>
				<article className="admin-card">
					<p>ACTIVE TEACHERS</p>
					<strong>{data?.kpis.activeTeachers ?? 0}</strong>
					<span>Teaching staff</span>
				</article>
			</section>

			<section className="admin-chart-grid">
				<article className="admin-panel">
					<h2>Performance by Grade Level</h2>
					<div className="admin-vertical-bars" aria-label="Grade performance bar chart">
						{sortedGradeBars.map((bar) => (
							<div key={bar.label} className="admin-vbar-item">
								<div className="admin-vbar-track" aria-label={`${bar.label}: ${bar.value}%`}>
									<div className="admin-vbar-fill" style={{ height: `${bar.value}%` }} />
								</div>
								<span className="admin-vbar-value">{`${bar.value}%`}</span>
								<span>{bar.label}</span>
							</div>
						))}
						{!sortedGradeBars.length && !loading ? <p className="admin-subcopy">No grade performance data yet.</p> : null}
					</div>
				</article>

				<article className="admin-panel">
					<h2>Performance by Subject</h2>
					<div className="admin-horizontal-bars" aria-label="Subject performance bar chart">
						{sortedSubjectBars.map((bar) => (
							<div key={bar.label} className="admin-hbar-row">
								<span>{bar.label}</span>
								<div className="admin-hbar-track">
									<div className="admin-hbar-fill" style={{ width: `${bar.value}%` }} />
								</div>
								<span className="admin-hbar-value">{`${bar.value}%`}</span>
							</div>
						))}
						{!sortedSubjectBars.length && !loading ? <p className="admin-subcopy">No subject performance data yet.</p> : null}
					</div>
				</article>
			</section>

			<section className="admin-panel">
				<h2>Grade Level Summary</h2>
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>GRADE LEVEL</th>
								<th>AVERAGE SCORE</th>
								<th>STUDENTS</th>
								<th>PASS RATE</th>
								<th>STATUS</th>
							</tr>
						</thead>
						<tbody>
							{sortedGradeSummary.map((row) => (
								<tr key={row.gradeLevel}>
									<td>{row.gradeLevel}</td>
									<td>{`${Math.round(row.averageScore)}%`}</td>
									<td>{row.students}</td>
									<td>{`${Math.round(row.passRate)}%`}</td>
									<td><span className={`admin-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
								</tr>
							))}
							{!sortedGradeSummary.length && !loading ? (
								<tr>
									<td colSpan={5}>No grade summary data yet.</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</section>
		</AdminLayout>
	);
}

export default SchoolOverview;
