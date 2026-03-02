import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Auth from './pages/Auth';

type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  const storedTheme = localStorage.getItem('themeMode');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <button
        type="button"
        className={`theme-toggle ${themeMode === 'light' ? 'theme-toggle--light' : 'theme-toggle--dark'}`}
        onClick={() => setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))}
        aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
      >
        {themeMode === 'light' ? '🌙' : '☀️'}
      </button>
    </BrowserRouter>
  );
}

export default App;