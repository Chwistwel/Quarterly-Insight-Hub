import '../../styles/ADMIN/SchoolOverview.css';

function SchoolOverview() {
	return (
		<aside className="admin-sidebar">
			<div className="admin-profile">
				<div className="admin-avatar">👤</div>
				<div>
					<h2>Dr. Michael Chen</h2>
					<p>Principal</p>
				</div>
			</div>

			<nav className="admin-menu" aria-label="Administrator navigation">
				<button type="button" className="admin-menu-item">▦ School Overview</button>
				<button type="button" className="admin-menu-item">📊 Item Analysis</button>
				<button type="button" className="admin-menu-item">👥 Teacher Performance</button>
				<button type="button" className="admin-menu-item">↗ School Analytics</button>
				<button type="button" className="admin-menu-item active">📋 All Reports</button>
			</nav>

			<button type="button" className="admin-logout">↩ Log Out</button>
		</aside>
	);
}

export default SchoolOverview;
