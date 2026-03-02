import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Auth.css';

type AuthMode = 'login' | 'signup';
type UserRole = 'teacher' | 'administrator';

function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode: AuthMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const initialRole: UserRole = searchParams.get('role') === 'administrator' ? 'administrator' : 'teacher';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showResetHint, setShowResetHint] = useState(false);

  const setModeQuery = (nextMode: AuthMode) => {
    setMode(nextMode);
    setShowResetHint(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mode', nextMode);
    setSearchParams(nextParams);
  };

  const setRoleQuery = (nextRole: UserRole) => {
    setRole(nextRole);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('role', nextRole);
    setSearchParams(nextParams);
  };

  const continueByRole = () => {
    localStorage.setItem('userRole', role);
    navigate('/');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    continueByRole();
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <Link className="auth-back" to="/">← Back to home</Link>
        <h1>QIH</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'Login to your account' : 'Create your account'}</p>

        <div className="auth-role-toggle" role="tablist" aria-label="Role selection">
          <button type="button" className={role === 'teacher' ? 'active' : ''} onClick={() => setRoleQuery('teacher')}>Teacher</button>
          <button type="button" className={role === 'administrator' ? 'active' : ''} onClick={() => setRoleQuery('administrator')}>Administrator</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <input type="password" required placeholder="Enter your password" />
          </label>

          {mode === 'signup' && (
            <label>
              Confirm password
              <input type="password" required placeholder="Confirm your password" />
            </label>
          )}

          {mode === 'login' && (
            <button type="button" className="auth-link-btn" onClick={() => setShowResetHint(true)}>
              Forgot password?
            </button>
          )}

          {showResetHint && mode === 'login' && (
            <p className="auth-hint">Contact your school admin to reset your credentials.</p>
          )}

          <button className="auth-submit" type="submit">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="auth-google" type="button" onClick={continueByRole}>
          <span>G</span>
          {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button type="button" onClick={() => setModeQuery(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </section>
    </div>
  );
}

export default Auth;
