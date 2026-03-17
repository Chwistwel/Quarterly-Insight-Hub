import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';

const departmentBars = [
  { label: 'Mathematics', value: 82 },
  { label: 'Science', value: 79 },
  { label: 'English', value: 85 },
  { label: 'Filipino', value: 80 },
  { label: 'Social Studies', value: 77 }
];

function TeacherPerformance() {
  return (
    <AdminLayout kicker="MONITOR AND EVALUATE TEACHING EFFECTIVENESS" title="Teacher Performance Analytics">
      <section className="admin-kpis">
        <article className="admin-card">
          <p>TOTAL TEACHERS</p>
          <strong>24</strong>
          <span className="positive">+2 this year</span>
        </article>
        <article className="admin-card">
          <p>AVG TEACHER SCORE</p>
          <strong>82.5%</strong>
          <span className="positive">+2.3% from last quarter</span>
        </article>
        <article className="admin-card">
          <p>ON-TIME UPLOADS</p>
          <strong>95%</strong>
          <span className="positive">23 of 24 teachers</span>
        </article>
        <article className="admin-card">
          <p>TOP PERFORMER</p>
          <strong className="admin-name-value">Ms. Anna Cruz</strong>
          <span>88% avg score</span>
        </article>
      </section>

      <section className="admin-panel">
        <h2>Performance by Department</h2>
        <div className="admin-vertical-bars admin-vertical-bars-wide" aria-label="Department performance chart">
          {departmentBars.map((bar) => (
            <div key={bar.label} className="admin-vbar-item">
              <div className="admin-vbar-track">
                <div className="admin-vbar-fill" style={{ height: `${bar.value}%` }} />
              </div>
              <span>{bar.label}</span>
            </div>
          ))}
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
              <tr>
                <td>Ms. Sarah Johnson</td>
                <td>Mathematics</td>
                <td>3</td>
                <td>126</td>
                <td>82%</td>
                <td><div className="admin-rate-bar"><i style={{ width: '87%' }} /></div></td>
                <td><span className="admin-badge excellent">On Time</span></td>
              </tr>
              <tr>
                <td>Mr. David Lee</td>
                <td>Science</td>
                <td>4</td>
                <td>152</td>
                <td>79%</td>
                <td><div className="admin-rate-bar"><i style={{ width: '83%' }} /></div></td>
                <td><span className="admin-badge excellent">On Time</span></td>
              </tr>
              <tr>
                <td>Ms. Maria Garcia</td>
                <td>English</td>
                <td>3</td>
                <td>134</td>
                <td>85%</td>
                <td><div className="admin-rate-bar"><i style={{ width: '91%' }} /></div></td>
                <td><span className="admin-badge excellent">On Time</span></td>
              </tr>
              <tr>
                <td>Mr. John Smith</td>
                <td>Filipino</td>
                <td>3</td>
                <td>128</td>
                <td>78%</td>
                <td><div className="admin-rate-bar"><i style={{ width: '80%' }} /></div></td>
                <td><span className="admin-badge fair">Delayed</span></td>
              </tr>
              <tr>
                <td>Ms. Anna Cruz</td>
                <td>Mathematics</td>
                <td>2</td>
                <td>89</td>
                <td>88%</td>
                <td><div className="admin-rate-bar"><i style={{ width: '92%' }} /></div></td>
                <td><span className="admin-badge excellent">On Time</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

export default TeacherPerformance;
