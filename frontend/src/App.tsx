import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import ItemAnalysis from './pages/ItemAnalysis';
import PerformanceMetrics from './pages/PerformanceMetrics';
import QuarterlyReport from './pages/QuarterlyReport';
import StudentRecords from './pages/StudentRecords';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/item-analysis" element={<ItemAnalysis />} />
        <Route path="/performance-metrics" element={<PerformanceMetrics />} />
        <Route path="/student-records" element={<StudentRecords />} />
        <Route path="/quarterly-reports" element={<QuarterlyReport />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/Home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;