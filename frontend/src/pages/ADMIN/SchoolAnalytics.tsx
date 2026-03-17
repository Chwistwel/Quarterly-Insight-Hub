import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';

function SchoolAnalytics() {
  return (
    <AdminLayout kicker="COMPREHENSIVE ACADEMIC PERFORMANCE INSIGHTS" title="School-Wide Analytics">
      <section className="admin-kpis">
        <article className="admin-card admin-card-outline navy">
          <p>TOTAL ENROLLMENT</p>
          <strong>675</strong>
          <span className="positive">+5 students from last year</span>
        </article>
        <article className="admin-card admin-card-outline blue">
          <p>SCHOOL AVERAGE</p>
          <strong>80.3%</strong>
          <span className="positive">+3.1% improvement</span>
        </article>
        <article className="admin-card admin-card-outline green">
          <p>PASS RATE</p>
          <strong>82%</strong>
          <span className="positive">Above target (75%)</span>
        </article>
        <article className="admin-card admin-card-outline purple">
          <p>SUBJECTS ANALYZED</p>
          <strong>8</strong>
          <span>Core & Elective</span>
        </article>
      </section>

      <section className="admin-chart-grid">
        <article className="admin-panel">
          <h2>Student Enrollment Trend</h2>
          <div className="admin-line-chart">
            <svg viewBox="0 0 640 210" preserveAspectRatio="none" aria-label="Enrollment trend chart">
              <polyline points="0,140 150,130 300,125 450,120 640,115" />
            </svg>
          </div>
        </article>
        <article className="admin-panel">
          <h2>Performance Trend (6 Quarters)</h2>
          <div className="admin-line-chart green">
            <svg viewBox="0 0 640 210" preserveAspectRatio="none" aria-label="Quarterly performance trend chart">
              <polyline points="0,125 130,120 260,118 390,112 520,114 640,108" />
            </svg>
          </div>
        </article>
      </section>

      <section className="admin-chart-grid">
        <article className="admin-panel">
          <h2>Grade Distribution (Q2 2024)</h2>
          <div className="admin-pie-wrap">
            <div className="admin-pie" />
          </div>
        </article>
        <article className="admin-panel">
          <h2>Subject Performance Comparison</h2>
          <div className="admin-horizontal-bars" aria-label="Subject comparison chart">
            <div className="admin-hbar-row"><span>Mathematics</span><div className="admin-hbar-track"><div className="admin-hbar-fill" style={{ width: '83%' }} /></div></div>
            <div className="admin-hbar-row"><span>Science</span><div className="admin-hbar-track"><div className="admin-hbar-fill" style={{ width: '80%' }} /></div></div>
            <div className="admin-hbar-row"><span>English</span><div className="admin-hbar-track"><div className="admin-hbar-fill" style={{ width: '86%' }} /></div></div>
            <div className="admin-hbar-row"><span>Filipino</span><div className="admin-hbar-track"><div className="admin-hbar-fill" style={{ width: '79%' }} /></div></div>
            <div className="admin-hbar-row"><span>Social Studies</span><div className="admin-hbar-track"><div className="admin-hbar-fill" style={{ width: '77%' }} /></div></div>
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}

export default SchoolAnalytics;
