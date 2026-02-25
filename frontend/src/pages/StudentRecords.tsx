import '../styles/StudentRecords.css';
import '../styles/Buttons.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type Student = {
	id: string;
	name: string;
	grade: string;
	section: string;
	average: number;
	rank: number;
	status: 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Support';
};

type KPICounts = {
	total: number;
	excellent: number;
	good: number;
	satisfactory: number;
	needsSupport: number;
};

function StudentRecords() {
	const [students, setStudents] = useState<Student[]>([]);
	const [kpiCounts, setKpiCounts] = useState<KPICounts>({
		total: 0,
		excellent: 0,
		good: 0,
		satisfactory: 0,
		needsSupport: 0
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStudentRecords = async () => {
			setIsLoading(true);
			await new Promise(resolve => setTimeout(resolve, 400));

			// Mock data - In production, fetch from API
			const mockStudents: Student[] = [
				{ id: 'STU001', name: 'Sarah Johnson', grade: 'Grade 12', section: 'A', average: 96.8, rank: 1, status: 'Excellent' },
				{ id: 'STU002', name: 'Michael Chen', grade: 'Grade 11', section: 'B', average: 95.2, rank: 2, status: 'Excellent' },
				{ id: 'STU003', name: 'Emily Davis', grade: 'Grade 12', section: 'A', average: 94.7, rank: 3, status: 'Excellent' },
				{ id: 'STU004', name: 'James Wilson', grade: 'Grade 10', section: 'B', average: 93.5, rank: 4, status: 'Excellent' },
				{ id: 'STU005', name: 'Lisa Anderson', grade: 'Grade 11', section: 'A', average: 92.8, rank: 5, status: 'Excellent' },
				{ id: 'STU006', name: 'Robert Kim', grade: 'Grade 12', section: 'C', average: 88.2, rank: 10, status: 'Good' },
				{ id: 'STU007', name: 'Emma Brown', grade: 'Grade 11', section: 'A', average: 86.4, rank: 14, status: 'Good' },
				{ id: 'STU008', name: 'Daniel Scott', grade: 'Grade 10', section: 'B', average: 84.8, rank: 18, status: 'Good' },
				{ id: 'STU009', name: 'Grace Turner', grade: 'Grade 12', section: 'A', average: 82.3, rank: 22, status: 'Good' },
				{ id: 'STU010', name: 'Noah Clark', grade: 'Grade 11', section: 'B', average: 80.2, rank: 28, status: 'Good' },
				{ id: 'STU011', name: 'Ava Martin', grade: 'Grade 10', section: 'A', average: 78.6, rank: 31, status: 'Satisfactory' },
				{ id: 'STU012', name: 'Ethan Hall', grade: 'Grade 12', section: 'C', average: 76.9, rank: 34, status: 'Satisfactory' },
				{ id: 'STU013', name: 'Sophia Patel', grade: 'Grade 10', section: 'A', average: 74.2, rank: 38, status: 'Satisfactory' },
				{ id: 'STU014', name: 'Matthew Thompson', grade: 'Grade 11', section: 'C', average: 71.5, rank: 45, status: 'Satisfactory' },
				{ id: 'STU015', name: 'Olivia White', grade: 'Grade 12', section: 'B', average: 68.9, rank: 52, status: 'Needs Support' }
			];

			setStudents(mockStudents);
			setKpiCounts({
				total: 1248,
				excellent: 412,
				good: 524,
				satisfactory: 248,
				needsSupport: 64
			});
			setTotalPages(84);
			setIsLoading(false);
		};

		fetchStudentRecords();
	}, [currentPage]);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	if (isLoading) {
		return (
			<div className="sr-page">
				<header className="sr-topbar">
					<div className="sr-brand">
						<span className="sr-brand-mark">QIH</span>
						<div className="sr-brand-text">
							<strong>QUARTERLY INSIGHT</strong>
							<span>HUB</span>
						</div>
					</div>
					<nav className="sr-topnav">
						<Link to="/dashboard">MODULES</Link>
						<Link to="/performance-metrics">WORKFLOW</Link>
						<Link to="/quarterly-reports">REPORTS</Link>
					</nav>
					<button className="sr-demo-btn">Request Demo</button>
				</header>
				<div className="sr-layout">
					<aside className="sr-sidebar">
						<Link className="sr-side-item" to="/dashboard">Dashboard</Link>
						<Link className="sr-side-item" to="/item-analysis">Item Analysis</Link>
						<Link className="sr-side-item" to="/performance-metrics">Performance Metrics</Link>
						<Link className="sr-side-item active" to="/student-records">Student Records</Link>
						<Link className="sr-side-item" to="/quarterly-reports">Quarterly Reports</Link>
						<Link className="sr-side-item" to="/analytics">Analytics</Link>
						<Link className="sr-side-item" to="/quarterly-reports">Academic Calendar</Link>
						<Link className="sr-side-item" to="/quarterly-reports">Export Data</Link>
					</aside>
					<main className="sr-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
						<div style={{ textAlign: 'center', color: '#64748b' }}>
							<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
							<p>Loading student records...</p>
						</div>
					</main>
				</div>
			</div>
		);
	}

	return (
		<div className="sr-page">
			<header className="sr-topbar">
				<div className="sr-brand">
					<span className="sr-brand-mark">QIH</span>
					<div className="sr-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="sr-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="sr-demo-btn">Request Demo</button>
			</header>

			<div className="sr-layout">
				<aside className="sr-sidebar">
					<Link className="sr-side-item" to="/dashboard">Dashboard</Link>
					<Link className="sr-side-item" to="/item-analysis">Item Analysis</Link>
					<Link className="sr-side-item" to="/performance-metrics">Performance Metrics</Link>
					<Link className="sr-side-item active" to="/student-records">Student Records</Link>
					<Link className="sr-side-item" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="sr-side-item" to="/analytics">Analytics</Link>
					<Link className="sr-side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="sr-side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="sr-main" id="students">
					<section className="sr-filter-card">
						<div className="sr-search">Search by name or student ID...</div>
						<select><option>All Grades</option></select>
						<select><option>All Sections</option></select>
						<select><option>All Status</option></select>
						<button className="sr-outline-btn">More Filters</button>
						<button className="sr-export-btn">Export</button>
					</section>

					<section className="sr-kpi-grid">
						<article className="sr-kpi-card"><p>Total Students</p><h3>{kpiCounts.total.toLocaleString()}</h3></article>
						<article className="sr-kpi-card"><p>Excellent</p><h3 className="green">{kpiCounts.excellent}</h3></article>
						<article className="sr-kpi-card"><p>Good</p><h3 className="blue">{kpiCounts.good}</h3></article>
						<article className="sr-kpi-card"><p>Satisfactory</p><h3 className="orange">{kpiCounts.satisfactory}</h3></article>
						<article className="sr-kpi-card"><p>Needs Support</p><h3 className="red">{kpiCounts.needsSupport}</h3></article>
					</section>

					<section className="sr-card">
						<div className="sr-card-header">
							<h2>Student Records</h2>
							<span>Showing {students.length} of {kpiCounts.total.toLocaleString()} students</span>
						</div>

						<table>
							<thead>
								<tr>
									<th>Student ID</th>
									<th>Name</th>
									<th>Grade</th>
									<th>Section</th>
									<th>Average</th>
									<th>Rank</th>
									<th>Status</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{students.map((student) => (
									<tr key={student.id}>
										<td>{student.id}</td>
										<td className="name">{student.name}</td>
										<td>{student.grade}</td>
										<td>{student.section}</td>
										<td className="avg">{student.average}%</td>
										<td>#{student.rank}</td>
										<td>
											<span className={`badge ${student.status.toLowerCase().replace(' ', '-')}`}>
												{student.status}
											</span>
										</td>
										<td className="actions">👁️ ✏️</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="sr-pagination">
							<span>Page {currentPage} of {totalPages}</span>
							<div>
								<button 
									disabled={currentPage === 1} 
									onClick={() => handlePageChange(currentPage - 1)}
								>
									Previous
								</button>
								<button 
									className={currentPage === 1 ? 'active' : ''} 
									onClick={() => handlePageChange(1)}
								>
									1
								</button>
								<button 
									className={currentPage === 2 ? 'active' : ''} 
									onClick={() => handlePageChange(2)}
								>
									2
								</button>
								<button 
									className={currentPage === 3 ? 'active' : ''} 
									onClick={() => handlePageChange(3)}
								>
									3
								</button>
								<button 
									disabled={currentPage === totalPages} 
									onClick={() => handlePageChange(currentPage + 1)}
								>
									Next
								</button>
							</div>
						</div>
					</section>

					<section className="sr-actions-grid" id="workflow">
						<article className="sr-action-card">
							<h3>Generate Progress Reports</h3>
							<p>Create comprehensive progress reports for selected students</p>
							<button className="blue-btn">Generate Reports</button>
						</article>
						<article className="sr-action-card">
							<h3>Parent Communication</h3>
							<p>Send performance updates to parents and guardians</p>
							<button className="green-btn">Send Updates</button>
						</article>
						<article className="sr-action-card">
							<h3>Schedule Interventions</h3>
							<p>Plan support sessions for students needing assistance</p>
							<button className="orange-btn">Schedule Now</button>
						</article>
					</section>
				</main>
			</div>
		</div>
	);
}

export default StudentRecords;
