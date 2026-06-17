import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  return (
    <div className="page">
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">QIH</div>
          <strong>Quarterly Insights Hub</strong>
        </div>
        <Link className="nav-login-btn" to="/auth">Log In</Link>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <h1>Item Analysis, TOS Builder & Performance Tracking</h1>
            <p>
              A platform for teachers and administrators to upload exam results, build
              Tables of Specifications, run item analysis, manage classes and students,
              and monitor performance across quarters — all in one place.
            </p>

          </div>

          <section className="analytics-preview" aria-label="Analytics preview">
            <h2>Analytics Preview</h2>
            <p>A quick look at what the platform surfaces after results are uploaded.</p>
            <div className="preview-grid">
              <article>
                <span>Class Average</span>
                <strong>76.8%</strong>
                <small>+2.3% from last quarter</small>
              </article>
              <article>
                <span>Pass Rate</span>
                <strong>79%</strong>
                <small>34 of 43 students</small>
              </article>
              <article>
                <span>Students</span>
                <strong>43</strong>
                <small>Grade 7 - Section A</small>
              </article>
              <article>
                <span>Items Analyzed</span>
                <strong>50</strong>
                <small>Math Q1 exam</small>
              </article>
            </div>
          </section>
        </section>

        <section className="workflow" id="workflow">
          <h2>How the platform works</h2>
          <div className="step-grid">
            <article>
              <span>1</span>
              <h3>Build TOS</h3>
              <p>Design assessment blueprints with Bloom&apos;s Taxonomy and topic distribution.</p>
            </article>
            <article>
              <span>2</span>
              <h3>Upload Results</h3>
              <p>Submit exam scores per class, subject, and quarter.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Analyze Items</h3>
              <p>Evaluate item difficulty, discrimination, and distractor effectiveness.</p>
            </article>
            <article>
              <span>4</span>
              <h3>Review Reports</h3>
              <p>Access dashboards, school-wide analytics, and performance summaries.</p>
            </article>
          </div>
        </section>

        <section className="modules" id="modules">
          <div className="module-grid">
            <article>
              <h3>For Teachers</h3>
              <ul>
                <li>Build Table of Specifications with Bloom&apos;s Taxonomy.</li>
                <li>Upload and analyze exam results per class and subject.</li>
                <li>Evaluate item difficulty, discrimination, and distractors.</li>
                <li>Manage classes, students, and track quarterly progress.</li>
              </ul>
            </article>
            <article>
              <h3>For Administrators</h3>
              <ul>
                <li>View school-wide KPIs, grade averages, and pass rates.</li>
                <li>Compare teacher performance and class outcomes.</li>
                <li>Monitor item analysis trends across the school.</li>
                <li>Generate consolidated reports for planning.</li>
              </ul>
            </article>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-grid">
            <div>
              <h3>Quarterly Insights Hub</h3>
              <p>Helping schools transform assessment data into actionable decisions.</p>
            </div>
            <div>
              <h4>Modules</h4>
              <p>TOS Builder</p>
              <p>Item Analysis</p>
              <p>Class Management</p>
              <p>School Analytics</p>
              <p>Reports</p>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </div>
          </div>
          <p className="footer-copy">© 2026 Quarterly Insights Hub. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default Home;
