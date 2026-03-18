import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { type ReactElement, useEffect, useState } from 'react';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SchoolOverview from './pages/ADMIN/SchoolOverview';
import { Teachers, AllClasses } from './pages/ADMIN';
import AdminProfile from './pages/ADMIN/AdminProfile';
import AdminItemAnalysis from './pages/ADMIN/ItemAnalysis';
import TeacherPerformance from './pages/ADMIN/TeacherPerformance';
import AllReports from './pages/ADMIN/AllReports';
import TeacherDashboard from './pages/TEACHER/Dashboard';
import TeacherItemAnalysis from './pages/TEACHER/ItemAnalysis';
import TeacherUploadResults from './pages/TEACHER/UploadResults';
import TeacherMyReports from './pages/TEACHER/MyReports';
import TeacherMyClasses from './pages/TEACHER/MyClasses';
import TeacherStudentManagement from './pages/TEACHER/StudentManagement';

type ThemeMode = 'light' | 'dark';
type UserRole = 'teacher' | 'administrator';

function getInitialTheme(): ThemeMode {
  const storedTheme = localStorage.getItem('themeMode');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredUserRole(): UserRole | null {
  const storedRole = localStorage.getItem('userRole');
  return storedRole === 'teacher' || storedRole === 'administrator' ? storedRole : null;
}

function getRouteForRole(role: UserRole): string {
  return role === 'administrator' ? '/admin/overview' : '/teacher/dashboard';
}

function ProtectedRoute({ allowedRoles, children }: { allowedRoles: UserRole[]; children: ReactElement }) {
  const storedRole = getStoredUserRole();

  if (!storedRole) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(storedRole)) {
    return <Navigate to={getRouteForRole(storedRole)} replace />;
  }

  return children;
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
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><Navigate to="/teacher/dashboard" replace /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/item-analysis" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherItemAnalysis /></ProtectedRoute>} />
        <Route path="/teacher/my-classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMyClasses /></ProtectedRoute>} />
        <Route path="/teacher/student-management" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentManagement /></ProtectedRoute>} />
        <Route path="/teacher/upload-results" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherUploadResults /></ProtectedRoute>} />
        <Route path="/teacher/my-reports" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMyReports /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrator']}><Navigate to="/admin/overview" replace /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['administrator']}><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin/overview" element={<ProtectedRoute allowedRoles={['administrator']}><SchoolOverview /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['administrator']}><Teachers /></ProtectedRoute>} />
        <Route path="/admin/all-classes" element={<ProtectedRoute allowedRoles={['administrator']}><AllClasses /></ProtectedRoute>} />
        <Route path="/admin/item-analysis" element={<ProtectedRoute allowedRoles={['administrator']}><AdminItemAnalysis /></ProtectedRoute>} />
        <Route path="/admin/teacher-performance" element={<ProtectedRoute allowedRoles={['administrator']}><TeacherPerformance /></ProtectedRoute>} />
        <Route path="/admin/all-reports" element={<ProtectedRoute allowedRoles={['administrator']}><AllReports /></ProtectedRoute>} />
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