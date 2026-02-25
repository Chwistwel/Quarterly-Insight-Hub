import { Link } from 'react-router-dom';
import '../styles/Analytics.css';
import '../styles/Buttons.css';

function Analytics() {
	return (
		<div className="an-page">
			<header className="an-topbar">
				<div className="an-brand">
					<span className="an-brand-mark">QIH</span>
					<div className="an-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="an-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="an-demo-btn">Request Demo</button>
			</header>

			<div className="an-layout">
				<aside className="an-sidebar">
					<Link className="an-side-item" to="/dashboard">Dashboard</Link>
					<Link className="an-side-item" to="/item-analysis">Item Analysis</Link>
					<Link className="an-side-item" to="/performance-metrics">Performance Metrics</Link>
					<Link className="an-side-item" to="/student-records">Student Records</Link>
					<Link className="an-side-item" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="an-side-item active" to="/analytics">Analytics</Link>
					<Link className="an-side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="an-side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="an-main">
					<section className="an-card">
						<h1>Advanced Analytics</h1>
						<p>Detailed analytics dashboard coming soon...</p>
					</section>
				</main>
			</div>
		</div>
	);
}

export default Analytics;
