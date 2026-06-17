import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOutIcon, MoonIcon, SunIcon, UserIcon } from './icons';

type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('themeMode');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

type UserProfile = {
  firstName?: string;
  lastName?: string;
  role?: 'teacher' | 'administrator';
};

export default function Header() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const storedText = localStorage.getItem('userProfile');
  let profile: UserProfile | null = null;
  if (storedText) {
    try { profile = JSON.parse(storedText) as UserProfile; } catch { profile = null; }
  }

  const role = profile?.role || localStorage.getItem('userRole') as UserProfile['role'] | null;

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userProfile');
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link to={role === 'administrator' ? '/admin/overview' : '/teacher/dashboard'} className="app-logo">
          <span className="app-logo-mark">QIH</span>
          Quarterly Insight Hub
        </Link>
      </div>
      <div className="app-header-right">
        <button
          type="button"
          className="header-theme-btn"
          onClick={() => setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))}
          aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
        >
          {themeMode === 'light' ? <MoonIcon className="header-icon" /> : <SunIcon className="header-icon" />}
        </button>

        <div className="header-user-wrap" ref={menuRef}>
          <button type="button" className="header-user" onClick={() => setMenuOpen((prev) => !prev)}>
            <UserIcon className="header-icon" />
          </button>
          {menuOpen && (
            <div className="header-dropdown">
              <button type="button" className="header-dropdown-item" onClick={handleLogout}>
                <LogOutIcon className="header-icon" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
