import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/SchoolOverview.css';

type TeacherPerformanceResponse = {
  kpis: {
    totalTeachers: number;
    avgTeacherScore: number;
    onTimeUploadsPercent: number;
    onTimeUploadsCount: number;
    topPerformerName: string;
    topPerformerScore: number;
  };
  departmentBars: Array<{
    label: string;
    value: number;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    subject: string;
    classes: number;
    students: number;
    avgScore: number;
    passRate: number;
    uploadStatus: 'On Time' | 'Delayed';
  }>;
};

function TeacherPerformance() {
  const [data, setData] = useState<TeacherPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const role = localStorage.getItem('userRole') ?? '';
        const email = localStorage.getItem('userEmail') ?? '';
        const response = await fetchJson<TeacherPerformanceResponse>('/api/admin/teacher-performance', {
          method: 'GET',
          headers: {
            'x-user-role': role,
            'x-user-email': email
          }
        });

        setData(response);
      } catch (loadError) {
        setData(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load teacher performance analytics.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AdminLayout kicker="MONITOR AND EVALUATE TEACHING EFFECTIVENESS" title="Teacher Performance Analytics">
      {loading ? <p className="admin-subcopy">Loading teacher performance...</p> : null}
      {error ? <p className="admin-subcopy" style={{ color: '#c43d3d' }}>{error}</p> : null}

      <section className="admin-kpis">
        <article className="admin-card">
          <p>TOTAL TEACHERS</p>
          <strong>{data?.kpis.totalTeachers ?? 0}</strong>
          <span>Registered teaching staff</span>
        </article>
        <article className="admin-card">
          <p>AVG TEACHER SCORE</p>
          <strong>{`${(data?.kpis.avgTeacherScore ?? 0).toFixed(1)}%`}</strong>
          <span className="positive">Based on current teacher records</span>
        </article>
        <article className="admin-card">
          <p>ON-TIME UPLOADS</p>
          <strong>{`${data?.kpis.onTimeUploadsPercent ?? 0}%`}</strong>
          <span className="positive">{`${data?.kpis.onTimeUploadsCount ?? 0} of ${data?.kpis.totalTeachers ?? 0} teachers`}</span>
        </article>
        <article className="admin-card">
          <p>TOP PERFORMER</p>
          <strong className="admin-name-value">{data?.kpis.topPerformerName ?? 'N/A'}</strong>
          <span>{`${Math.round(data?.kpis.topPerformerScore ?? 0)}% avg score`}</span>
        </article>
      </section>

      <section className="admin-panel">
        <h2>Performance by Department</h2>
        <div className="admin-vertical-bars admin-vertical-bars-wide" aria-label="Department performance chart">
          {(data?.departmentBars ?? []).map((bar) => (
            <div key={bar.label} className="admin-vbar-item">
              <div className="admin-vbar-track">
                <div className="admin-vbar-fill" style={{ height: `${bar.value}%` }} />
              </div>
              <span>{bar.label}</span>
            </div>
          ))}
          {!data?.departmentBars?.length && !loading ? <p className="admin-subcopy">No department data yet.</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <h2>Teacher Performance Overview</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>TEACHER</th>
                <th>SUBJECT</th>
                <th>CLASSES</th>
                <th>STUDENTS</th>
                <th>AVG SCORE</th>
                <th>PASS RATE</th>
                <th>UPLOAD STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(data?.teachers ?? []).map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name}</td>
                  <td>{teacher.subject}</td>
                  <td>{teacher.classes}</td>
                  <td>{teacher.students}</td>
                  <td>{`${Math.round(teacher.avgScore)}%`}</td>
                  <td><div className="admin-rate-bar"><i style={{ width: `${Math.max(0, Math.min(100, Math.round(teacher.passRate)))}%` }} /></div></td>
                  <td>
                    <span className={`admin-badge ${teacher.uploadStatus === 'On Time' ? 'excellent' : 'fair'}`}>
                      {teacher.uploadStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {!data?.teachers?.length && !loading ? (
                <tr>
                  <td colSpan={7}>No teacher performance data yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

export default TeacherPerformance;
