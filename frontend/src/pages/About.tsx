import { Link } from 'react-router-dom';
import '../styles/LegalPages.css';

function About() {
  return (
    <div className="legal-page">
      <header className="legal-topbar">
        <Link to="/" className="legal-back-link">&larr; Back to Home</Link>
        <div className="brand">
          <div className="brand-mark">QIH</div>
          <strong>Quarterly Insights Hub</strong>
        </div>
      </header>

      <main className="legal-content">
        <h1>About Quarterly Insights Hub</h1>

        <section>
          <h2>Our Mission</h2>
          <p>
            Quarterly Insights Hub is designed to streamline the assessment workflow
            for educators and school administrators. We provide a centralized platform
            for uploading exam results, performing item analysis, tracking student
            performance across grading periods, and generating school-wide reports.
          </p>
        </section>

        <section>
          <h2>What We Do</h2>
          <p>
            The platform bridges the gap between classroom-level data and administrative
            oversight. Teachers can upload results, analyze individual test items for
            difficulty and discrimination, and monitor student progress across four
            quarters. Administrators gain a school-wide view of performance trends,
            teacher effectiveness, and learning gaps.
          </p>
        </section>

        <section>
          <h2>Key Features</h2>
          <ul>
            <li><strong>Item Analysis</strong> — Evaluate test item difficulty, discrimination index, and distractor effectiveness.</li>
            <li><strong>Table of Specifications (TOS) Builder</strong> — Design assessment blueprints aligned with Bloom&apos;s Taxonomy.</li>
            <li><strong>Class &amp; Student Management</strong> — Organize sections, upload class lists, and manage student records.</li>
            <li><strong>Performance Dashboards</strong> — Visualize class averages, pass rates, and trends over time.</li>
            <li><strong>School-Wide Analytics</strong> — Compare grade levels, subjects, and teacher performance across the institution.</li>
            <li><strong>Report Generation</strong> — Export consolidated reports for planning and accreditation.</li>
          </ul>
        </section>

        <section>
          <h2>Who It Is For</h2>
          <p>
            <strong>Teachers</strong> — Upload exam data, run item analysis, build TOS, and monitor class progress.<br />
            <strong>Administrators</strong> — Review school-wide indicators, evaluate teacher performance, and generate consolidated reports.
          </p>
        </section>
      </main>

      <footer className="legal-footer">
        <p>&copy; 2026 Quarterly Insights Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default About;
