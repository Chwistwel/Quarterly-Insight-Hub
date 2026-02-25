import '../styles/QuarterlyReport.css';
import '../styles/Buttons.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type Template = {
	id: string;
	title: string;
	subtitle: string;
};

type GeneratedReport = {
	id: string;
	quarter: string;
	status: 'Current' | 'Completed';
	period: string;
	students: number;
	subjects: number;
	generated: string;
	completion: number;
};

type Component = {
	id: string;
	name: string;
	checked: boolean;
};

type Statistics = {
	totalReports: number;
	downloads: number;
	automatedSchedules: number;
	accuracy: number;
};

function QuarterlyReport() {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
	const [components, setComponents] = useState<Component[]>([]);
	const [statistics, setStatistics] = useState<Statistics>({
		totalReports: 0,
		downloads: 0,
		automatedSchedules: 0,
		accuracy: 0
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchReportData = async () => {
			setIsLoading(true);
			await new Promise(resolve => setTimeout(resolve, 400));

			setTemplates([
				{ id: 't1', title: 'Comprehensive Performance Report', subtitle: 'Full Analysis' },
				{ id: 't2', title: 'Item Analysis Summary', subtitle: 'Statistical' },
				{ id: 't3', title: 'Student Progress Report', subtitle: 'Individual' },
				{ id: 't4', title: 'Subject Performance Report', subtitle: 'Subject-wise' },
				{ id: 't5', title: 'Quarter Comparison Report', subtitle: 'Comparative' },
				{ id: 't6', title: 'Parent-Teacher Report', subtitle: 'Communication' }
			]);

			setGeneratedReports([
				{
					id: 'r1',
					quarter: 'Q4 2025',
					status: 'Current',
					period: 'Jan - Feb 2026',
					students: 1248,
					subjects: 24,
					generated: 'Feb 18, 2026',
					completion: 95
				},
				{
					id: 'r2',
					quarter: 'Q3 2025',
					status: 'Completed',
					period: 'Oct - Dec 2025',
					students: 1235,
					subjects: 24,
					generated: 'Dec 20, 2025',
					completion: 100
				},
				{
					id: 'r3',
					quarter: 'Q2 2025',
					status: 'Completed',
					period: 'Jul - Sep 2025',
					students: 1221,
					subjects: 24,
					generated: 'Sep 25, 2025',
					completion: 100
				}
			]);

			setComponents([
				{ id: 'c1', name: 'Executive Summary', checked: true },
				{ id: 'c2', name: 'Performance Metrics', checked: true },
				{ id: 'c3', name: 'Item Analysis', checked: true },
				{ id: 'c4', name: 'Student Demographics', checked: true },
				{ id: 'c5', name: 'Subject-wise Breakdown', checked: true },
				{ id: 'c6', name: 'Trend Analysis', checked: true },
				{ id: 'c7', name: 'Recommendations', checked: true },
				{ id: 'c8', name: 'Comparative Analysis', checked: false }
			]);

			setStatistics({
				totalReports: 156,
				downloads: 2458,
				automatedSchedules: 12,
				accuracy: 98
			});

			setIsLoading(false);
		};

		fetchReportData();
	}, []);

	const handleComponentToggle = (id: string) => {
		setComponents(prev => 
			prev.map(comp => 
				comp.id === id ? { ...comp, checked: !comp.checked } : comp
			)
		);
	};

	if (isLoading) {
		return (
			<div className="qr-page">
				<header className="qr-topbar">
					<div className="qr-brand">
						<span className="qr-brand-mark">QIH</span>
						<div className="qr-brand-text">
							<strong>QUARTERLY INSIGHT</strong>
							<span>HUB</span>
						</div>
					</div>
					<nav className="qr-topnav">
						<Link to="/dashboard">MODULES</Link>
						<Link to="/performance-metrics">WORKFLOW</Link>
						<Link to="/quarterly-reports">REPORTS</Link>
					</nav>
					<button className="qr-demo-btn">Request Demo</button>
				</header>
				<div className="qr-layout">
					<aside className="qr-sidebar">
						<Link className="qr-side-item" to="/dashboard">Dashboard</Link>
						<Link className="qr-side-item" to="/item-analysis">Item Analysis</Link>
						<Link className="qr-side-item" to="/performance-metrics">Performance Metrics</Link>
						<Link className="qr-side-item" to="/student-records">Student Records</Link>
						<Link className="qr-side-item active" to="/quarterly-reports">Quarterly Reports</Link>
						<Link className="qr-side-item" to="/analytics">Analytics</Link>
						<Link className="qr-side-item" to="/quarterly-reports">Academic Calendar</Link>
						<Link className="qr-side-item" to="/quarterly-reports">Export Data</Link>
					</aside>
					<main className="qr-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
						<div style={{ textAlign: 'center', color: '#64748b' }}>
							<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
							<p>Loading report data...</p>
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="qr-page">
			<header className="qr-topbar">
				<div className="qr-brand">
					<span className="qr-brand-mark">QIH</span>
					<div className="qr-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="qr-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="qr-demo-btn">Request Demo</button>
			</header>

			<div className="qr-layout">
				<aside className="qr-sidebar">
					<Link className="qr-side-item" to="/dashboard">Dashboard</Link>
					<Link className="qr-side-item" to="/item-analysis">Item Analysis</Link>
					<Link className="qr-side-item" to="/performance-metrics">Performance Metrics</Link>
					<Link className="qr-side-item" to="/student-records">Student Records</Link>
					<Link className="qr-side-item active" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="qr-side-item" to="/analytics">Analytics</Link>
					<Link className="qr-side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="qr-side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="qr-main" id="quarterly">
					<section className="qr-hero-card">
						<div>
							<h1>Quarterly Reports</h1>
							<p>Generate and manage academic performance reports</p>
						</div>
						<button className="qr-primary">Generate New Report</button>
					</section>

					<section className="qr-section" id="modules">
						<h2>Report Templates</h2>
						<div className="qr-template-grid">
							{templates.map((template) => (
								<article className="qr-template-card" key={template.id}>
									<div className="template-head">
										<span className="template-icon">📄</span>
										<div>
											<h3>{template.title}</h3>
											<p>{template.subtitle}</p>
										</div>
									</div>
									<button>Use Template</button>
								</article>
							))}
						</div>
					</section>

					<section className="qr-section" id="reports">
						<h2>Generated Reports</h2>
						<div className="qr-reports-list">
							{generatedReports.map((report) => (
								<article className="qr-generated-card" key={report.id}>
									<div className="gen-top">
										<div className="gen-title-wrap">
											<span className="calendar-icon">📅</span>
											<div>
												<h3>
													{report.quarter}
													<span className={`tag ${report.status.toLowerCase()}`}>{report.status}</span>
												</h3>
												<p>{report.period}</p>
											</div>
										</div>
										<div className="gen-actions">
											<button>View</button>
											<button>Download</button>
										</div>
									</div>

									<div className="gen-meta">
										<div><span>Students</span><strong>{report.students}</strong></div>
										<div><span>Subjects</span><strong>{report.subjects}</strong></div>
										<div><span>Generated</span><strong>{report.generated}</strong></div>
										<div><span>Completion</span><strong>{report.completion}%</strong></div>
									</div>

									<div className="gen-progress">
										<p>Report Generation Progress</p>
										<div className="bar"><span style={{ width: `${report.completion}%` }} /></div>
									</div>
								</article>
							))}
						</div>
					</section>

					<section className="qr-two-col" id="workflow">
						<article className="qr-card">
							<h2>Report Components</h2>
							<div className="components-list">
								{components.map((component) => (
									<label key={component.id} className="component-item">
										<span>{component.name}</span>
										<input 
											type="checkbox" 
											checked={component.checked} 
											onChange={() => handleComponentToggle(component.id)}
										/>
									</label>
								))}
							</div>
						</article>

						<article className="qr-card" id="export">
							<h2>Export Options</h2>
							<div className="export-options">
								<div><strong>PDF Report</strong><span>Formatted for printing and sharing</span></div>
								<div><strong>Excel Spreadsheet</strong><span>Raw data for further analysis</span></div>
								<div><strong>PowerPoint Presentation</strong><span>Visual summary for presentations</span></div>
							</div>
							<hr />
							<h3>Schedule Automated Reports</h3>
							<button className="automation-btn">Set Up Automation</button>
						</article>
					</section>

					<section className="qr-card" id="analytics">
						<h2>Report Statistics</h2>
						<div className="stats-grid">
							<div className="stat-box blue"><strong>{statistics.totalReports}</strong><span>Total Reports Generated</span></div>
							<div className="stat-box green"><strong>{statistics.downloads.toLocaleString()}</strong><span>Reports Downloaded</span></div>
							<div className="stat-box amber"><strong>{statistics.automatedSchedules}</strong><span>Automated Schedules</span></div>
							<div className="stat-box violet"><strong>{statistics.accuracy}%</strong><span>Report Accuracy</span></div>
						</div>
					</section>
				</main>
			</div>
		</div>
	);
}

export default QuarterlyReport;
