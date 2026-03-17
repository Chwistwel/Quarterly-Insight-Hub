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
            <h1>Quarterly Item Analysis & Academic Performance Consolidation</h1>
            <p>
              A single system for teacher workflows and administrator oversight—from exam uploads
              to item analysis, school-wide reporting, and quarterly performance monitoring.
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
                <span>My Students</span>
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
          <h2>How Quarterly Insight Hub works</h2>
          <div className="step-grid">
            <article>
              <span>1</span>
              <h3>Sign In</h3>
              <p>Teachers and administrators securely access the platform.</p>
            </article>
            <article>
              <span>2</span>
              <h3>Upload Data</h3>
              <p>Submit class results and assessment records per quarter.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Analyze</h3>
              <p>Generate item analysis and performance trends instantly.</p>
            </article>
            <article>
              <span>4</span>
              <h3>Consolidate</h3>
              <p>Review school-wide insights for data-driven planning.</p>
            </article>
          </div>
        </section>

        <section className="modules" id="modules">
          <div className="module-grid">
            <article>
              <h3>For Teachers</h3>
              <ul>
                <li>Upload exam outcomes per class and subject.</li>
                <li>View item-level difficulty and discrimination.</li>
                <li>Monitor progress across grading periods.</li>
                <li>Export class-level summaries for reporting.</li>
              </ul>
            </article>
            <article>
              <h3>For Administrators</h3>
              <ul>
                <li>Track grade-level and school-wide indicators.</li>
                <li>Compare performance trends across departments.</li>
                <li>Identify learning gaps through analytics.</li>
                <li>Use consolidated insights for planning actions.</li>
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
              <p>Authentication</p>
              <p>Item Analysis</p>
              <p>Performance Monitoring</p>
            </div>
            <div>
              <h4>Company</h4>
              <p>About</p>
              <p>Terms of Service</p>
              <p>Privacy Policy</p>
            </div>
          </div>
          <p className="footer-copy">© 2026 Quarterly Insights Hub. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default Home;
