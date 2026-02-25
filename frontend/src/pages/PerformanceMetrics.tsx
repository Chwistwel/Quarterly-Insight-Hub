import '../styles/PerformanceMetrix.css';
import '../styles/Buttons.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type KPIMetrics = {
	overallAverage: number;
	passingRate: number;
	atRiskStudents: number;
	trends: {
		average: string;
		passing: string;
		atRisk: string;
	};
};

type SubjectQuarterlyData = {
	subject: string;
	values: number[];
};

type Performer = {
	id: string;
	name: string;
	grade: string;
	subjects: number;
	score: number;
	status: string;
};

type SupportStudent = {
	id: string;
	name: string;
	grade: string;
	subjects: string;
	rate: number;
};

type Insight = {
	id: string;
	type: 'positive' | 'alert' | 'info' | 'violet';
	title: string;
	message: string;
};

function PerformanceMetrics() {
	const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics>({
		overallAverage: 0,
		passingRate: 0,
		atRiskStudents: 0,
		trends: { average: '', passing: '', atRisk: '' }
	});

	const [subjectData, setSubjectData] = useState<SubjectQuarterlyData[]>([]);
	const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
	const [supportStudents, setSupportStudents] = useState<SupportStudent[]>([]);
	const [insights, setInsights] = useState<Insight[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchPerformanceData = async () => {
			setIsLoading(true);
			await new Promise(resolve => setTimeout(resolve, 400));

			setKpiMetrics({
				overallAverage: 84.2,
				passingRate: 89.4,
				atRiskStudents: 3.2,
				trends: {
					average: '+3.8% from last quarter',
					passing: '+2.4% improvement',
					atRisk: 'Needs intervention'
				}
			});

			setSubjectData([
				{ subject: 'Math', values: [78, 80, 82, 85] },
				{ subject: 'Science', values: [76, 78, 81, 83] },
				{ subject: 'English', values: [82, 84, 86, 89] },
				{ subject: 'History', values: [74, 76, 77, 79] },
				{ subject: 'Physics', values: [69, 71, 73, 75] }
			]);

			setTopPerformers([
				{ id: '1', name: 'Sarah Johnson', grade: 'Grade 12', subjects: 8, score: 96.8, status: 'Excellent' },
				{ id: '2', name: 'Michael Chen', grade: 'Grade 11', subjects: 8, score: 95.2, status: 'Excellent' },
				{ id: '3', name: 'Emily Davis', grade: 'Grade 12', subjects: 8, score: 94.7, status: 'Excellent' },
				{ id: '4', name: 'James Wilson', grade: 'Grade 10', subjects: 7, score: 93.5, status: 'Excellent' },
				{ id: '5', name: 'Lisa Anderson', grade: 'Grade 11', subjects: 8, score: 92.8, status: 'Excellent' }
			]);

			setSupportStudents([
				{ id: 's1', name: 'John Smith', grade: 'Grade 10', subjects: 'Math, Physics', rate: 58.2 },
				{ id: 's2', name: 'Maria Garcia', grade: 'Grade 11', subjects: 'Chemistry', rate: 61.5 },
				{ id: 's3', name: 'David Lee', grade: 'Grade 12', subjects: 'Math, Science', rate: 59.8 }
			]);

			setInsights([
				{
					id: 'i1',
					type: 'positive',
					title: 'Positive Trend',
					message: 'English and Mathematics show consistent improvement across all grade levels. Continue current teaching strategies.'
				},
				{
					id: 'i2',
					type: 'alert',
					title: 'Needs Attention',
					message: 'Physics performance in Grade 10 remains below target. Recommend additional tutoring sessions and practical labs.'
				},
				{
					id: 'i3',
					type: 'info',
					title: 'Excellence Rate Up',
					message: '64% of students achieving excellence (90%+) marks a 42% increase from Q1. Recognition program is effective.'
				},
				{
					id: 'i4',
					type: 'violet',
					title: 'Grade 12 Ready',
					message: 'Grade 12 students maintaining 88% average, indicating strong college readiness. Continue exam preparation focus.'
				}
			]);

			setIsLoading(false);
		};

		fetchPerformanceData();
	}, []);

	if (isLoading) {
		return (
			<div className="pm-page">
				<header className="pm-topbar">
					<div className="pm-brand">
						<span className="pm-brand-mark">QIH</span>
						<div className="pm-brand-text">
							<strong>QUARTERLY INSIGHT</strong>
							<span>HUB</span>
						</div>
					</div>
					<nav className="pm-topnav">
						<Link to="/dashboard">MODULES</Link>
						<Link to="/performance-metrics">WORKFLOW</Link>
						<Link to="/quarterly-reports">REPORTS</Link>
					</nav>
					<button className="pm-demo-btn">Request Demo</button>
				</header>
				<div className="pm-layout">
					<aside className="pm-sidebar">
						<Link className="pm-side-item" to="/dashboard">Dashboard</Link>
						<Link className="pm-side-item" to="/item-analysis">Item Analysis</Link>
						<Link className="pm-side-item active" to="/performance-metrics">Performance Metrics</Link>
						<Link className="pm-side-item" to="/student-records">Student Records</Link>
						<Link className="pm-side-item" to="/quarterly-reports">Quarterly Reports</Link>
						<Link className="pm-side-item" to="/analytics">Analytics</Link>
						<Link className="pm-side-item" to="/quarterly-reports">Academic Calendar</Link>
						<Link className="pm-side-item" to="/quarterly-reports">Export Data</Link>
					</aside>
					<main className="pm-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
						<div style={{ textAlign: 'center', color: '#64748b' }}>
							<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
							<p>Loading performance data...</p>
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="pm-page">
			<header className="pm-topbar">
				<div className="pm-brand">
					<span className="pm-brand-mark">QIH</span>
					<div className="pm-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="pm-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="pm-demo-btn">Request Demo</button>
			</header>

			<div className="pm-layout">
				<aside className="pm-sidebar">
					<Link className="pm-side-item" to="/dashboard">Dashboard</Link>
					<Link className="pm-side-item" to="/item-analysis">Item Analysis</Link>
					<Link className="pm-side-item active" to="/performance-metrics">Performance Metrics</Link>
					<Link className="pm-side-item" to="/student-records">Student Records</Link>
					<Link className="pm-side-item" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="pm-side-item" to="/analytics">Analytics</Link>
					<Link className="pm-side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="pm-side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="pm-main" id="performance">
					<section className="pm-kpi-grid">
						<article className="pm-kpi-card">
							<p>Overall Average</p>
							<h3>{kpiMetrics.overallAverage}%</h3>
							<span className="positive">{kpiMetrics.trends.average}</span>
						</article>
						<article className="pm-kpi-card">
							<p>Passing Rate</p>
							<h3>{kpiMetrics.passingRate}%</h3>
							<span className="info">{kpiMetrics.trends.passing}</span>
						</article>
						<article className="pm-kpi-card">
							<p>At-Risk Students</p>
							<h3>{kpiMetrics.atRiskStudents}%</h3>
							<span className="warning">{kpiMetrics.trends.atRisk}</span>
						</article>
					</section>

					<section className="pm-card" id="analytics">
						<h2>Performance Trends by Grade Level</h2>
						<div className="pm-area-chart">
							<div className="area grade10" />
							<div className="area grade11" />
							<div className="area grade12" />
						</div>
						<div className="pm-legend">
							<span><i className="grade10" />Grade 10</span>
							<span><i className="grade11" />Grade 11</span>
							<span><i className="grade12" />Grade 12</span>
						</div>
					</section>

					<section className="pm-two-col" id="modules">
						<article className="pm-card">
							<h2>Subject Performance by Quarter</h2>
							<div className="pm-grouped-bars">
								{subjectData.map(({ subject, values }) => (
									<div className="group" key={subject}>
										<div className="bars">
											<span className="q1" style={{ height: `${values[0]}%` }} />
											<span className="q2" style={{ height: `${values[1]}%` }} />
											<span className="q3" style={{ height: `${values[2]}%` }} />
											<span className="q4" style={{ height: `${values[3]}%` }} />
										</div>
										<small>{subject}</small>
									</div>
								))}
							</div>
							<div className="pm-legend quarter">
								<span><i className="q1" />Q1</span>
								<span><i className="q2" />Q2</span>
								<span><i className="q3" />Q3</span>
								<span><i className="q4" />Q4</span>
							</div>
						</article>

						<article className="pm-card" id="reports">
							<h2>Passing &amp; Excellence Rates</h2>
							<div className="pm-line-chart">
								<div className="line passing" />
								<div className="line excellence" />
							</div>
							<div className="pm-legend">
								<span><i className="passing" />Passing Rate %</span>
								<span><i className="excellence" />Excellence Rate %</span>
							</div>
						</article>
					</section>

					<section className="pm-two-col" id="students">
						<article className="pm-card">
							<h2>Top Performers</h2>
							<div className="performers-list">
								{topPerformers.map((performer, index) => (
									<div className="performer" key={performer.id}>
										<b>{index + 1}</b>
										<div>
											<h4>{performer.name}</h4>
											<p>{performer.grade} • {performer.subjects} subjects</p>
										</div>
										<div className="score">
											<strong>{performer.score}%</strong>
											<span>{performer.status}</span>
										</div>
									</div>
								))}
							</div>
						</article>

						<article className="pm-card">
							<h2>Students Needing Support</h2>
							<div className="support-list">
								{supportStudents.map((student) => (
									<div className="support-card" key={student.id}>
										<div className="support-head">
											<div>
												<h4>{student.name}</h4>
												<p>{student.grade}</p>
											</div>
											<strong>{student.rate}%</strong>
										</div>
										<p>Struggling in: <b>{student.subjects}</b></p>
										<button>Create Intervention Plan</button>
									</div>
								))}
							</div>
						</article>
					</section>

					<section className="pm-card" id="workflow">
						<h2>Key Insights &amp; Recommendations</h2>
						<div className="insight-grid">
							{insights.map((insight) => (
								<article className={`insight ${insight.type}`} key={insight.id}>
									<h4>{insight.title}</h4>
									<p>{insight.message}</p>
								</article>
							))}
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default PerformanceMetrics;
