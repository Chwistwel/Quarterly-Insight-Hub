import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';

const itemRows = [
  { no: 1, difficulty: 0.75, discrimination: 0.68, interpretation: 'Good', status: 'good' },
  { no: 2, difficulty: 0.82, discrimination: 0.51, interpretation: 'Fair', status: 'fair' },
  { no: 3, difficulty: 0.68, discrimination: 0.72, interpretation: 'Good', status: 'good' },
  { no: 4, difficulty: 0.48, discrimination: 0.81, interpretation: 'Excellent', status: 'excellent' },
  { no: 5, difficulty: 0.32, discrimination: 0.42, interpretation: 'Poor', status: 'poor' },
  { no: 6, difficulty: 0.75, discrimination: 0.65, interpretation: 'Good', status: 'good' }
] as const;

function ItemAnalysis() {
  return (
    <AdminLayout kicker="COMPREHENSIVE ITEM ANALYSIS" title="My Item Analysis - Grade 7">
      <section className="admin-filter-row">
        <select defaultValue="Grade 7 - Section A">
          <option>Grade 7 - Section A</option>
          <option>Grade 8 - Section B</option>
        </select>
        <select defaultValue="Mathematics">
          <option>Mathematics</option>
          <option>Science</option>
          <option>English</option>
        </select>
      </section>

      <section className="admin-kpis admin-kpis-3">
        <article className="admin-card">
          <p>AVERAGE SCORE</p>
          <strong>78.5%</strong>
        </article>
        <article className="admin-card">
          <p>AVERAGE INDEX</p>
          <strong>82%</strong>
        </article>
        <article className="admin-card">
          <p>TOTAL STUDENTS</p>
          <strong>45</strong>
        </article>
      </section>

      <div className="admin-tabs">
        <button type="button" className="active">All Items</button>
        <button type="button">Excellent</button>
        <button type="button">Good</button>
        <button type="button">Needs Improvement</button>
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
              {itemRows.map((row) => (
                <tr key={row.no}>
                  <td>{row.no}</td>
                  <td>{row.difficulty.toFixed(2)}</td>
                  <td>{row.discrimination.toFixed(2)}</td>
                  <td>
                    <span className={`admin-badge ${row.status}`}>{row.interpretation}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

export default ItemAnalysis;
