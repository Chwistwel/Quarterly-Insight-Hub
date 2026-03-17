import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';

function AllReports() {
  return (
    <AdminLayout kicker="REPORT GENERATION CENTER" title="All Reports">
      <p className="admin-subcopy">Generate and download comprehensive reports for analysis and documentation</p>

      <section className="admin-action-cards">
        <article className="admin-action-card">
          <h3>Executive Summary</h3>
          <p>Generate comprehensive school-wide report</p>
          <button type="button">Generate Report</button>
        </article>
        <article className="admin-action-card blue">
          <h3>Teacher Analytics</h3>
          <p>Evaluate teacher performance metrics</p>
          <button type="button">View Analytics</button>
        </article>
        <article className="admin-action-card green">
          <h3>Trend Analysis</h3>
          <p>Historical performance comparison</p>
          <button type="button">Generate</button>
        </article>
      </section>

      <section className="admin-panel">
        <h2>Available Reports</h2>
        <div className="admin-report-grid">
          <article className="admin-report-item">
            <h3>School-Wide Performance Report</h3>
            <p>Comprehensive analysis across all grade levels and subjects</p>
            <div><span>March 1, 2024</span><button type="button">Download</button></div>
          </article>
          <article className="admin-report-item">
            <h3>Teacher Performance Analytics</h3>
            <p>Evaluation of teaching effectiveness and student outcomes</p>
            <div><span>March 1, 2024</span><button type="button">Download</button></div>
          </article>
          <article className="admin-report-item">
            <h3>Quarterly Comparison Report</h3>
            <p>Year-over-year and quarter-over-quarter performance trends</p>
            <div><span>March 1, 2024</span><button type="button">Download</button></div>
          </article>
          <article className="admin-report-item">
            <h3>Department Analysis</h3>
            <p>Subject-wise performance breakdown and recommendations</p>
            <div><span>February 28, 2024</span><button type="button">Download</button></div>
          </article>
          <article className="admin-report-item">
            <h3>Grade Level Distribution</h3>
            <p>Statistical analysis of grade distribution patterns</p>
            <div><span>February 28, 2024</span><button type="button">Download</button></div>
          </article>
          <article className="admin-report-item">
            <h3>Compliance & Submission Report</h3>
            <p>Upload compliance and timeline adherence tracking</p>
            <div><span>February 27, 2024</span><button type="button">Download</button></div>
          </article>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AllReports;
