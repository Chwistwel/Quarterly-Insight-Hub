import AdminLayout from './AdminLayout';
import '../../styles/ADMIN/SchoolOverview.css';

const gradeBars = [
	{ label: 'Grade 7', value: 78 },
	{ label: 'Grade 8', value: 82 },
	{ label: 'Grade 9', value: 75 },
	{ label: 'Grade 10', value: 86 }
];

const subjectBars = [
	{ label: 'Mathematics', value: 82 },
	{ label: 'Science', value: 79 },
	{ label: 'English', value: 85 },
	{ label: 'Filipino', value: 80 }
];

function SchoolOverview() {
	return (
		<AdminLayout
			kicker="QUARTERLY ITEM ANALYSIS AND ACADEMIC PERFORMANCE CONSOLIDATION SYSTEM"
			title="School Overview"
		>
			<section className="admin-filter-row">
				<select defaultValue="All Grades">
					<option>All Grades</option>
					<option>Grade 7</option>
					<option>Grade 8</option>
					<option>Grade 9</option>
					<option>Grade 10</option>
				</select>
				<select defaultValue="Q1">
					<option>Q1</option>
					<option>Q2</option>
					<option>Q3</option>
					<option>Q4</option>
				</select>
			</section>

			<section className="admin-kpis">
				<article className="admin-card">
					<p>SCHOOL AVERAGE</p>
					<strong>80.3%</strong>
					<span className="positive">+3.1% from last quarter</span>
				</article>
				<article className="admin-card">
					<p>OVERALL PASS RATE</p>
					<strong>82%</strong>
					<span className="positive">551 of 675 students</span>
				</article>
				<article className="admin-card">
					<p>TOTAL STUDENTS</p>
					<strong>675</strong>
					<span>Across all grades</span>
				</article>
				<article className="admin-card">
					<p>ACTIVE TEACHERS</p>
					<strong>24</strong>
					<span>Teaching staff</span>
				</article>
			</section>

			<section className="admin-chart-grid">
				<article className="admin-panel">
					<h2>Performance by Grade Level</h2>
					<div className="admin-vertical-bars" aria-label="Grade performance bar chart">
						{gradeBars.map((bar) => (
							<div key={bar.label} className="admin-vbar-item">
								<div className="admin-vbar-track">
									<div className="admin-vbar-fill" style={{ height: `${bar.value}%` }} />
								</div>
								<span>{bar.label}</span>
							</div>
						))}
					</div>
				</article>

				<article className="admin-panel">
					<h2>Performance by Subject</h2>
					<div className="admin-horizontal-bars" aria-label="Subject performance bar chart">
						{subjectBars.map((bar) => (
							<div key={bar.label} className="admin-hbar-row">
								<span>{bar.label}</span>
								<div className="admin-hbar-track">
									<div className="admin-hbar-fill" style={{ width: `${bar.value}%` }} />
								</div>
							</div>
						))}
					</div>
				</article>
			</section>

			<section className="admin-panel">
				<h2>Grade Level Summary</h2>
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>GRADE LEVEL</th>
								<th>AVERAGE SCORE</th>
								<th>STUDENTS</th>
								<th>PASS RATE</th>
								<th>STATUS</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Grade 7</td>
								<td>78%</td>
								<td>180</td>
								<td>85%</td>
								<td><span className="admin-badge good">Good</span></td>
							</tr>
							<tr>
								<td>Grade 8</td>
								<td>82%</td>
								<td>165</td>
								<td>85%</td>
								<td><span className="admin-badge good">Good</span></td>
							</tr>
							<tr>
								<td>Grade 9</td>
								<td>75%</td>
								<td>172</td>
								<td>72%</td>
								<td><span className="admin-badge good">Good</span></td>
							</tr>
							<tr>
								<td>Grade 10</td>
								<td>86%</td>
								<td>158</td>
								<td>85%</td>
								<td><span className="admin-badge excellent">Excellent</span></td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</AdminLayout>
	);
}

export default SchoolOverview;
