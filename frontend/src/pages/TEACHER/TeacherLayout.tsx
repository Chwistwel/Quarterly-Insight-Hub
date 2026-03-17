import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

type StoredUserProfile = {
	firstName?: string;
	lastName?: string;
	role?: 'teacher' | 'administrator';
	email?: string;
};

const DashboardIcon = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
		<rect x="4" y="4" width="6" height="6" rx="1" />
		<rect x="14" y="4" width="6" height="6" rx="1" />
		<rect x="4" y="14" width="6" height="6" rx="1" />
		<rect x="14" y="14" width="6" height="6" rx="1" />
	</svg>
);

const AnalysisIcon = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
		<line x1="5" y1="19" x2="19" y2="19" />
		<line x1="8" y1="16" x2="8" y2="10" />
		<line x1="12" y1="16" x2="12" y2="7" />
		<line x1="16" y1="16" x2="16" y2="12" />
	</svg>
);

const ReportsIcon = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
		<path d="M7 4h7l4 4v12H7z" />
		<path d="M14 4v4h4" />
		<line x1="10" y1="13" x2="15" y2="13" />
		<line x1="10" y1="17" x2="15" y2="17" />
	</svg>
);

const ClassesIcon = () => (
	<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
		<rect x="4" y="5" width="7" height="14" rx="1" />
		<rect x="13" y="5" width="7" height="14" rx="1" />
		<line x1="11" y1="7" x2="13" y2="7" />
	</svg>
);

type TeacherLayoutProps = {
	title: string;
	actions?: ReactNode;
	children: ReactNode;
};

function TeacherLayout({ title, actions, children }: TeacherLayoutProps) {
	const navigate = useNavigate();
	const storedProfileText = localStorage.getItem('userProfile');
	let storedProfile: StoredUserProfile | null = null;

	if (storedProfileText) {
		try {
			storedProfile = JSON.parse(storedProfileText) as StoredUserProfile;
		} catch {
			storedProfile = null;
		}
	}

	const fullName = [storedProfile?.firstName?.trim(), storedProfile?.lastName?.trim()]
		.filter((value): value is string => Boolean(value))
		.join(' ');
	const displayName = fullName || 'Teacher';

	const handleLogout = () => {
		localStorage.removeItem('userRole');
		localStorage.removeItem('userEmail');
		localStorage.removeItem('userProfile');
		navigate('/');
	};

	return (
		<div className="teacher-workspace">
			<aside className="teacher-sidebar">
				<div className="teacher-profile">
					<div className="teacher-avatar">👤</div>
					<div>
						<h2>{displayName}</h2>
						<p>Math Teacher</p>
					</div>
				</div>

				<nav className="teacher-menu" aria-label="Teacher navigation">
					<NavLink to="/teacher/dashboard" className={({ isActive }) => `teacher-menu-item${isActive ? ' active' : ''}`}>
						<span className="teacher-menu-item-icon"><DashboardIcon /></span>
						<span className="teacher-menu-item-label">My Dashboard</span>
					</NavLink>
					<NavLink to="/teacher/item-analysis" className={({ isActive }) => `teacher-menu-item${isActive ? ' active' : ''}`}>
						<span className="teacher-menu-item-icon"><AnalysisIcon /></span>
						<span className="teacher-menu-item-label">Item Analysis</span>
					</NavLink>
					<NavLink to="/teacher/my-classes" className={({ isActive }) => `teacher-menu-item${isActive ? ' active' : ''}`}>
						<span className="teacher-menu-item-icon"><ClassesIcon /></span>
						<span className="teacher-menu-item-label">My Classes</span>
					</NavLink>
					<NavLink to="/teacher/my-reports" className={({ isActive }) => `teacher-menu-item${isActive ? ' active' : ''}`}>
						<span className="teacher-menu-item-icon"><ReportsIcon /></span>
						<span className="teacher-menu-item-label">My Reports</span>
					</NavLink>
				</nav>

				<button type="button" className="teacher-logout" onClick={handleLogout}>
					↩ Log Out
				</button>
			</aside>

			<section className="teacher-main">
				{actions ? (
					<header className="teacher-main-header">
						<div>
							<h1>{title}</h1>
						</div>
						<div className="teacher-main-actions">{actions}</div>
					</header>
				) : null}
				{children}
			</section>
		</div>
	);
}

export default TeacherLayout;
