import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const OverviewIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </svg>
);

const ItemAnalysisIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="20" x2="20" y2="20" />
    <line x1="7" y1="16" x2="7" y2="10" />
    <line x1="12" y1="16" x2="12" y2="7" />
    <line x1="17" y1="16" x2="17" y2="12" />
  </svg>
);

const TeacherPerformanceIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3" />
    <path d="M4 19c0-2.7 2.2-4.9 4.9-4.9h0.2c2.7 0 4.9 2.2 4.9 4.9" />
    <circle cx="17" cy="9" r="2" />
    <path d="M14.8 19c0-1.8 1.4-3.2 3.2-3.2" />
  </svg>
);

const SchoolAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 15 9 10 13 13 20 6" />
    <polyline points="16 6 20 6 20 10" />
  </svg>
);

const ReportsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v4h4" />
    <line x1="10" y1="13" x2="15" y2="13" />
    <line x1="10" y1="17" x2="15" y2="17" />
  </svg>
);

type AdminLayoutProps = {
  title: string;
  kicker: string;
  children: ReactNode;
};

function AdminLayout({ title, kicker, children }: AdminLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  return (
    <div className="admin-workspace">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <div>
            <h2>Dr. Michael Chen</h2>
            <p>Principal</p>
          </div>
        </div>

        <nav className="admin-menu" aria-label="Administrator navigation">
          <NavLink to="/admin/overview" className={({ isActive }) => `admin-menu-item${isActive ? ' active' : ''}`}>
            <span className="admin-menu-item-icon"><OverviewIcon /></span>
            <span className="admin-menu-item-label">School Overview</span>
          </NavLink>
          <NavLink to="/admin/item-analysis" className={({ isActive }) => `admin-menu-item${isActive ? ' active' : ''}`}>
            <span className="admin-menu-item-icon"><ItemAnalysisIcon /></span>
            <span className="admin-menu-item-label">Item Analysis</span>
          </NavLink>
          <NavLink to="/admin/teacher-performance" className={({ isActive }) => `admin-menu-item${isActive ? ' active' : ''}`}>
            <span className="admin-menu-item-icon"><TeacherPerformanceIcon /></span>
            <span className="admin-menu-item-label">Teacher Performance</span>
          </NavLink>
          <NavLink to="/admin/school-analytics" className={({ isActive }) => `admin-menu-item${isActive ? ' active' : ''}`}>
            <span className="admin-menu-item-icon"><SchoolAnalyticsIcon /></span>
            <span className="admin-menu-item-label">School Analytics</span>
          </NavLink>
          <NavLink to="/admin/all-reports" className={({ isActive }) => `admin-menu-item${isActive ? ' active' : ''}`}>
            <span className="admin-menu-item-icon"><ReportsIcon /></span>
            <span className="admin-menu-item-label">All Reports</span>
          </NavLink>
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>
          ↩ Log Out
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-page-head">
          <p>{kicker}</p>
          <div>
            <h1>{title}</h1>
            <span>Admin View</span>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

export default AdminLayout;
