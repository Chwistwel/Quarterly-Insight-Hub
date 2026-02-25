import '../styles/Dashboard.css';
import '../styles/Buttons.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type MetricData = {
	totalStudents: number;
	averageScore: number;
	subjectsAssessed: number;
	highPerformers: number;
	trends: {
		students: string;
		score: string;
		subjects: string;
		performers: string;
	};
};

type GradeDistribution = {
	a: number;
	b: number;
	c: number;
	d: number;
	f: number;
};

type SubjectPerformance = {
	subject: string;
	score: number;
};

type Activity = {
	id: string;
	message: string;
	time: string;
	type: 'success' | 'info' | 'warning';
};

function Dashboard() {
	const [metrics, setMetrics] = useState<MetricData>({
		totalStudents: 0,
		averageScore: 0,
		subjectsAssessed: 0,
		highPerformers: 0,
		trends: { students: '', score: '', subjects: '', performers: '' }
	});

	const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution>({
		a: 0, b: 0, c: 0, d: 0, f: 0
	});

	const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
	const [activities, setActivities] = useState<Activity[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Simulate fetching data from API
		const fetchDashboardData = async () => {
			setIsLoading(true);
			
			// Simulate API call delay
			await new Promise(resolve => setTimeout(resolve, 500));

			// Mock data - In production, this would come from backend API
			setMetrics({
				totalStudents: 1248,
				averageScore: 82.4,
				subjectsAssessed: 24,
				highPerformers: 412,
				trends: {
					students: '↑ +12% from last quarter',
					score: '↑ +5.2% from last quarter',
					subjects: '0% from last quarter',
					performers: '↑ +8% from last quarter'
				}
			});

			setGradeDistribution({ a: 33, b: 42, c: 18, d: 6, f: 1 });

			setSubjectPerformance([
				{ subject: 'Math', score: 86 },
				{ subject: 'Science', score: 83 },
				{ subject: 'English', score: 89 },
				{ subject: 'History', score: 80 },
				{ subject: 'Physics', score: 76 },
				{ subject: 'Chemistry', score: 82 }
			]);

			setActivities([
				{ id: '1', message: 'Q4 2025 Mathematics assessment completed', time: '2 hours ago', type: 'success' },
				{ id: '2', message: 'Item analysis report generated for Science', time: '5 hours ago', type: 'info' },
				{ id: '3', message: 'Student performance data consolidated', time: '1 day ago', type: 'success' },
				{ id: '4', message: 'Low performance alert: Chemistry - Grade 10B', time: '2 days ago', type: 'warning' }
			]);

			setIsLoading(false);
		};

		fetchDashboardData();
	}, []);

	if (isLoading) {
		return (
			<div className="dashboard-page">
				<header className="dash-topbar">
					<div className="dash-brand">
						<span className="dash-brand-mark">QIH</span>
						<div className="dash-brand-text">
							<strong>QUARTERLY INSIGHT</strong>
							<span>HUB</span>
						</div>
					</div>
					<nav className="dash-topnav">
						<Link to="/dashboard">MODULES</Link>
						<Link to="/performance-metrics">WORKFLOW</Link>
						<Link to="/quarterly-reports">REPORTS</Link>
					</nav>
					<button className="dash-demo-btn">Request Demo</button>
				</header>
				<div className="dash-layout">
					<aside className="dash-sidebar">
						<Link className="side-item active" to="/dashboard">Dashboard</Link>
						<Link className="side-item" to="/item-analysis">Item Analysis</Link>
						<Link className="side-item" to="/performance-metrics">Performance Metrics</Link>
						<Link className="side-item" to="/student-records">Student Records</Link>
						<Link className="side-item" to="/quarterly-reports">Quarterly Reports</Link>
						<Link className="side-item" to="/analytics">Analytics</Link>
						<Link className="side-item" to="/quarterly-reports">Academic Calendar</Link>
						<Link className="side-item" to="/quarterly-reports">Export Data</Link>
					</aside>
					<main className="dash-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
						<div style={{ textAlign: 'center', color: '#64748b' }}>
							<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
							<p>Loading dashboard data...</p>
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="dashboard-page">
			<header className="dash-topbar">
				<div className="dash-brand">
					<span className="dash-brand-mark">QIH</span>
					<div className="dash-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="dash-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="dash-demo-btn">Request Demo</button>
			</header>

			<div className="dash-layout">
				<aside className="dash-sidebar">
					<Link className="side-item active" to="/dashboard">Dashboard</Link>
					<Link className="side-item" to="/item-analysis">Item Analysis</Link>
					<Link className="side-item" to="/performance-metrics">Performance Metrics</Link>
					<Link className="side-item" to="/student-records">Student Records</Link>
					<Link className="side-item" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="side-item" to="/analytics">Analytics</Link>
					<Link className="side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="dash-main" id="dashboard">
					<section className="metrics-grid">
						<article className="metric-card">
							<p>Total Students</p>
							<h3>{metrics.totalStudents.toLocaleString()}</h3>
							<span>{metrics.trends.students}</span>
						</article>
						<article className="metric-card">
							<p>Average Score</p>
							<h3>{metrics.averageScore}%</h3>
							<span>{metrics.trends.score}</span>
						</article>
						<article className="metric-card">
							<p>Subjects Assessed</p>
							<h3>{metrics.subjectsAssessed}</h3>
							<span className="neutral">{metrics.trends.subjects}</span>
						</article>
						<article className="metric-card">
							<p>High Performers</p>
							<h3>{metrics.highPerformers}</h3>
							<span>{metrics.trends.performers}</span>
						</article>
					</section>

					<section className="charts-two-col" id="performance">
						<article className="chart-card">
							<h2>Quarterly Performance Trends</h2>
							<div className="line-chart">
								<div className="line line-a" />
								<div className="line line-b" />
								<div className="line line-c" />
							</div>
							<div className="chart-legend">
								<span>Pass Rate</span>
								<span>Average Score</span>
								<span>Excellence Rate</span>
							</div>
						</article>

						<article className="chart-card" id="reports">
							<h2>Grade Distribution</h2>
							<div className="grade-distribution">
								<div className="pie" />
								<ul>
									<li>A (90-100): {gradeDistribution.a}%</li>
									<li>B (80-89): {gradeDistribution.b}%</li>
									<li>C (70-79): {gradeDistribution.c}%</li>
									<li>D (60-69): {gradeDistribution.d}%</li>
									<li>F (0-59): {gradeDistribution.f}%</li>
								</ul>
							</div>
						</article>
					</section>

					<section className="chart-card wide" id="modules">
						<h2>Subject Performance Overview</h2>
						<div className="bar-chart">
							{subjectPerformance.map(({ subject, score }) => (
								<div key={subject}>
									<span style={{ height: `${score}%` }} />
									{subject}
								</div>
							))}
						</div>
						<p className="bar-label">Average Score %</p>
					</section>

					<section className="chart-card wide" id="workflow">
						<h2>Recent Activity</h2>
						<div className="activity-list">
							{activities.map((activity) => (
								<div className={`activity-item ${activity.type}`} key={activity.id}>
									<p>{activity.message}</p>
									<span>{activity.time}</span>
								</div>
							))}
						</div>
					</section>

					<section className="footer-links-row" id="quarterly">
						<Link to="/item-analysis">Item Analysis</Link>
						<Link to="/student-records" id="calendar">Student Records</Link>
						<Link to="/quarterly-reports" id="export">Export Data</Link>
					</section>
				</main>
			</div>
		</div>
	);
}

export default Dashboard;
