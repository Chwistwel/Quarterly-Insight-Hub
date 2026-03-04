import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';

type AuthMode = 'login' | 'signup';
type UserRole = 'teacher' | 'administrator';

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('teacher');
  const [showResetHint, setShowResetHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem('userRole', role);
    navigate(role === 'teacher' ? '/teacher/dashboard' : '/');
  };

  const continueWithGoogle = () => {
    localStorage.setItem('userRole', role);
    navigate(role === 'teacher' ? '/teacher/dashboard' : '/');
  };

  return (
    <div className="page">
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">QIH</div>
          <strong>Quarterly Insights Hub</strong>
        </div>
        <a className="cta" href="#auth">Get Started</a>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <h1>Quarterly Item Analysis & Academic Performance Consolidation</h1>
            <p>
              A single system for teacher workflows and administrator oversight—from exam uploads
              to item analysis, school-wide reporting, and quarterly performance monitoring.
            </p>
            <div className="hero-actions">
              <a className="hero-btn primary" href="#auth">Teacher Access</a>
              <a className="hero-btn ghost" href="#auth">Administrator Access</a>
            </div>
          </div>

          <section className="auth-plain" id="auth" aria-labelledby="authTitle">
            <h2 id="authTitle">{mode === 'login' ? 'Welcome Back!' : 'Create an account'}</h2>
            <p className="auth-plain-subtitle">
              {mode === 'login'
                ? 'Sign in to continue your assessment journey.'
                : 'Sign up to start your quarterly item analysis workflow.'}
            </p>

            <div className="auth-role-toggle" role="tablist" aria-label="Role selection">
              <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRole('teacher')}>Teacher</button>
              <button type="button" className={role === 'administrator' ? 'active' : ''} onClick={() => setRole('administrator')}>Administrator</button>
            </div>

            <form className="inline-auth-form" onSubmit={handleAuthSubmit}>
              {mode === 'signup' && (
                <label>
                  Full name
                  <input type="text" required placeholder="Enter your full name" />
                </label>
              )}
              <label>
                Email
                <input type="email" required placeholder="name@school.edu" />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input type={showPassword ? 'text' : 'password'} required placeholder="Enter your password" />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>

              {mode === 'login' && (
                <div className="auth-meta-row">
                  <label className="remember-row">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <button type="button" className="auth-link-btn" onClick={() => setShowResetHint(true)}>
                    Forgot password?
                  </button>
                </div>
              )}

              {showResetHint && mode === 'login' && (
                <p className="auth-hint">Contact your school administrator to reset your credentials.</p>
              )}

              {mode === 'signup' && (
                <label>
                  Confirm password
                  <input type="password" required placeholder="Confirm your password" />
                </label>
              )}
              <button className="hero-btn primary inline-submit" type="submit">
                {mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>

            <button type="button" className="google-btn" onClick={continueWithGoogle}>
              <span>G</span>
              Continue with Google
            </button>

            <p className="inline-auth-note">By signing in, you agree to our Terms and Privacy Policy.</p>
            <p className="auth-switch">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setShowResetHint(false); }}>
                {mode === 'login' ? 'Create an account' : 'Log in'}
              </button>
            </p>
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
