import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/SchoolOverview.css';

type AdminItemAnalysisRow = {
  itemNo: number;
  difficultyIndex: number;
  discriminationIndex: number;
  interpretation: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
};

type AdminItemAnalysisResponse = {
  title: string;
  classOptions: string[];
  classSubjectMap: Record<string, string[]>;
  subjectOptions: string[];
  selectedClass: string;
  selectedSubject: string;
  classAverage: string;
  averageIndex: string;
  totalStudents: number;
  rows: AdminItemAnalysisRow[];
};

function ItemAnalysis() {
  const [data, setData] = useState<AdminItemAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [appliedClass, setAppliedClass] = useState<string>('');
  const [appliedSubject, setAppliedSubject] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'all' | 'excellent' | 'good' | 'needs'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const role = localStorage.getItem('userRole') ?? '';
        const email = localStorage.getItem('userEmail') ?? '';
        const params = new URLSearchParams();
        if (appliedClass) {
          params.set('class', appliedClass);
        }
        if (appliedSubject) {
          params.set('subject', appliedSubject);
        }

        const query = params.toString();
        const response = await fetchJson<AdminItemAnalysisResponse>(`/api/admin/item-analysis${query ? `?${query}` : ''}`, {
          method: 'GET',
          headers: {
            'x-user-role': role,
            'x-user-email': email
          }
        });

        setData(response);
        setSelectedClass(response.selectedClass ?? '');
        setSelectedSubject(response.selectedSubject ?? '');
        setAppliedClass(response.selectedClass ?? '');
        setAppliedSubject(response.selectedSubject ?? '');
      } catch (loadError) {
        setData(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load item analysis.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [appliedClass, appliedSubject]);

  const classOptions = data?.classOptions ?? [];

  const availableSubjects = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return data?.classSubjectMap?.[selectedClass] ?? [];
  }, [data?.classSubjectMap, selectedClass]);

  const filteredRows = useMemo(() => {
    const rows = [...(data?.rows ?? [])]
      .sort((first, second) => first.itemNo - second.itemNo);

    if (selectedView === 'all') {
      return rows;
    }

    if (selectedView === 'excellent') {
      return rows.filter((row) => row.status === 'excellent');
    }

    if (selectedView === 'good') {
      return rows.filter((row) => row.status === 'good');
    }

    return rows.filter((row) => row.status === 'fair' || row.status === 'poor');
  }, [data?.rows, selectedView]);

  const handleApply = () => {
    setAppliedClass(selectedClass);
    setAppliedSubject(selectedSubject);
  };

  return (
    <AdminLayout kicker="COMPREHENSIVE ITEM ANALYSIS" title={data?.title ?? 'Item Analysis'}>
      {loading ? <p className="admin-subcopy">Loading item analysis...</p> : null}
      {error ? <p className="admin-subcopy" style={{ color: '#c43d3d' }}>{error}</p> : null}

      <section className="admin-filter-row">
        <select value={selectedClass} onChange={(event) => {
          setSelectedClass(event.target.value);
          setSelectedSubject('');
        }}>
          {classOptions.map((classOption) => (
            <option key={classOption} value={classOption}>{classOption}</option>
          ))}
        </select>
        <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} disabled={!selectedClass}>
          <option value="">All Subjects</option>
          {availableSubjects.map((subjectOption) => (
            <option key={subjectOption} value={subjectOption}>{subjectOption}</option>
          ))}
        </select>
        <button type="button" className="admin-filter-apply-btn" onClick={handleApply} disabled={loading}>Apply</button>
      </section>

      <section className="admin-kpis admin-kpis-3">
        <article className="admin-card">
          <p>AVERAGE SCORE</p>
          <strong>{data?.classAverage ?? '0.0%'}</strong>
        </article>
        <article className="admin-card">
          <p>AVERAGE INDEX</p>
          <strong>{data?.averageIndex ?? '0.0%'}</strong>
        </article>
        <article className="admin-card">
          <p>TOTAL STUDENTS</p>
          <strong>{data?.totalStudents ?? 0}</strong>
        </article>
      </section>

      <div className="admin-tabs">
        <button type="button" className={selectedView === 'all' ? 'active' : ''} onClick={() => setSelectedView('all')}>All Items</button>
        <button type="button" className={selectedView === 'excellent' ? 'active' : ''} onClick={() => setSelectedView('excellent')}>Excellent</button>
        <button type="button" className={selectedView === 'good' ? 'active' : ''} onClick={() => setSelectedView('good')}>Good</button>
        <button type="button" className={selectedView === 'needs' ? 'active' : ''} onClick={() => setSelectedView('needs')}>Needs Improvement</button>
      </div>

      <section className="admin-panel">
        <h2>Item Analysis</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ITEM NO.</th>
                <th>DIFFICULTY INDEX</th>
                <th>DISCRIMINATION INDEX</th>
                <th>INTERPRETATION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.itemNo}>
                  <td>{row.itemNo}</td>
                  <td>{row.difficultyIndex.toFixed(2)}</td>
                  <td>{row.discriminationIndex.toFixed(2)}</td>
                  <td>
                    <span className={`admin-badge ${row.status}`}>{row.interpretation}</span>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4}>No item analysis data found for the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

export default ItemAnalysis;
