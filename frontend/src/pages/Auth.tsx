import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJson } from '../services/api';
import '../styles/Auth.css';

type UserRole = 'teacher' | 'administrator';

type AuthFormState = {
  email: string;
  password: string;
};

const initialFormState: AuthFormState = {
  email: '',
  password: ''
};

type AuthResponse = {
  message: string;
  user: {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    email: string;
  };
};

function getRouteForRole(role: UserRole): string {
  return role === 'administrator' ? '/admin/overview' : '/teacher/dashboard';
}

function Auth() {
  const navigate = useNavigate();
  const [showResetHint, setShowResetHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<AuthFormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setSubmitting(true);

    try {
      const response = await fetchJson<AuthResponse>('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password
        })
      });

      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userProfile', JSON.stringify(response.user));
      navigate(getRouteForRole(response.user.role));
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to continue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="authTitle">
        <h2 id="authTitle">Welcome Back!</h2>
        <p className="auth-subtitle">Sign in to continue your assessment journey.</p>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          <label>
            Email or Username
            <input
              type="text"
              name="email"
              required
              value={formState.email}
              onChange={handleInputChange}
              placeholder="name@school.edu or admin"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <div className="auth-password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formState.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <div className="auth-meta-row">
            <label className="auth-remember-row">
              <input type="checkbox" />
              Remember me
            </label>
            <button type="button" className="auth-link-btn" onClick={() => setShowResetHint(true)}>
              Forgot password?
            </button>
          </div>

          {showResetHint && (
            <p className="auth-hint">Contact your school administrator to reset your credentials.</p>
          )}

          {authError ? <p className="auth-feedback auth-feedback-error">{authError}</p> : null}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : 'Log In'}
          </button>
        </form>

        <p className="auth-note">By signing in, you agree to our Terms and Privacy Policy.</p>
      </section>
    </div>
  );
}

export default Auth;
