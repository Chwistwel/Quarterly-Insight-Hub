import '../styles/ItemAnalysis.css';
import '../styles/Buttons.css';
import { Link } from 'react-router-dom';
import { useMemo, useState, type ChangeEvent } from 'react';

type ItemAnalysisRow = {
	item: string;
	difficulty: number;
	discrimination: number;
	interpretation: string;
};

type AnalysisResult = {
	summary: {
		totalItems: number;
		avgDifficulty: number;
		avgDiscrimination: number;
		reliability: number;
	};
	items: ItemAnalysisRow[];
};

function ItemAnalysis() {
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
	const [isComputing, setIsComputing] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const [uploadedFileName, setUploadedFileName] = useState('');

	const chartItems = useMemo(
		() => analysisResult?.items.slice(0, 10) ?? [],
		[analysisResult]
	);

	const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}

		setUploadedFileName(file.name);
		setUploadError('');
		setIsComputing(true);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch('http://localhost:5000/api/item-analysis/compute', {
				method: 'POST',
				body: formData
			});

			const payload = await response.json();

			if (!response.ok) {
				throw new Error(payload.message ?? 'Upload failed.');
			}

			setAnalysisResult(payload as AnalysisResult);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unable to compute analysis from this file.';
			setUploadError(message);
		} finally {
			setIsComputing(false);
		}
	};

	return (
		<div className="ia-page">
			<header className="ia-topbar">
				<div className="ia-brand">
					<span className="ia-brand-mark">QIH</span>
					<div className="ia-brand-text">
						<strong>QUARTERLY INSIGHT</strong>
						<span>HUB</span>
					</div>
				</div>

				<nav className="ia-topnav">
					<Link to="/dashboard">MODULES</Link>
					<Link to="/performance-metrics">WORKFLOW</Link>
					<Link to="/quarterly-reports">REPORTS</Link>
				</nav>

				<button className="ia-demo-btn">Request Demo</button>
			</header>

			<div className="ia-layout">
				<aside className="ia-sidebar">
					<Link className="ia-side-item" to="/dashboard">Dashboard</Link>
					<Link className="ia-side-item active" to="/item-analysis">Item Analysis</Link>
					<Link className="ia-side-item" to="/performance-metrics">Performance Metrics</Link>
					<Link className="ia-side-item" to="/student-records">Student Records</Link>
					<Link className="ia-side-item" to="/quarterly-reports">Quarterly Reports</Link>
					<Link className="ia-side-item" to="/analytics">Analytics</Link>
					<Link className="ia-side-item" to="/quarterly-reports">Academic Calendar</Link>
					<Link className="ia-side-item" to="/quarterly-reports">Export Data</Link>
				</aside>

				<main className="ia-main" id="item-analysis">
					<section className="ia-filter-card">
						<div className="ia-filter-grid">
							<label>
								Subject
								<select>
									<option>English</option>
									<option>Mathematics</option>
									<option>Science</option>
									<option>AP</option>
									<option>TLE</option>
									<option>MAPEH</option>
									<option>Filipino</option>
									<option>Specialization</option>
								</select>
							</label>
							<label>
								Quarter
								<select>
									<option>Q1</option>
									<option>Q2</option>
									<option>Q3</option>
									<option>Q4</option>
									<option>Q5</option>
								</select>
							</label>
							<label>
								Grade Level
								<select>
									<option>Grade 7</option>
									<option>Grade 8</option>
									<option>Grade 9</option>
									<option>Grade 10</option>
									<option>Grade 11</option>
									<option>Grade 12</option>
								</select>
							</label>
						</div>
						<div className="ia-filter-actions">
							<label className="ia-upload-control">
								<input type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
								<span>{isComputing ? 'Computing...' : 'Upload CSV & Auto Compute'}</span>
							</label>
							<button className="ia-outline-btn">More Filters</button>
							<button className="ia-primary-btn" disabled={!analysisResult}>Export Report</button>
						</div>
						{uploadedFileName && <p className="ia-upload-meta">File: {uploadedFileName}</p>}
						{uploadError && <p className="ia-upload-error">{uploadError}</p>}
					</section>

					{!analysisResult && !isComputing && (
						<section className="ia-empty-state">
							<div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
								<div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
								<h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>No Analysis Data</h3>
								<p style={{ fontSize: '14px', marginBottom: '24px' }}>Upload a CSV file to automatically compute item analysis metrics</p>
								<label className="ia-upload-control" style={{ display: 'inline-flex' }}>
									<input type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
									<span>Choose CSV File</span>
								</label>
							</div>
						</section>
					)}

					{analysisResult && (
						<>
							<section className="ia-kpi-grid">
								<article className="ia-kpi-card">
									<p>Total Items</p>
									<h3>{analysisResult.summary.totalItems}</h3>
									<span>Current assessment</span>
								</article>
								<article className="ia-kpi-card">
									<p>Avg Difficulty</p>
									<h3>{analysisResult.summary.avgDifficulty.toFixed(2)}</h3>
									<span className="positive">Appropriate range</span>
								</article>
								<article className="ia-kpi-card">
									<p>Avg Discrimination</p>
									<h3>{analysisResult.summary.avgDiscrimination.toFixed(2)}</h3>
									<span className="positive">Good discrimination</span>
								</article>
								<article className="ia-kpi-card">
									<p>Reliability (KR-20)</p>
									<h3>{analysisResult.summary.reliability.toFixed(2)}</h3>
									<span className="positive">Highly reliable</span>
								</article>
							</section>

					<section className="ia-card" id="analytics">
						<h2>Item Difficulty &amp; Discrimination Index</h2>
						<div className="ia-bar-dual">
							{chartItems.map((item) => (
								<div className="ia-dual-item" key={item.item}>
									<div className="ia-bars">
										<span className="difficulty" style={{ height: `${item.difficulty * 100}%` }} />
										<span className="discrimination" style={{ height: `${Math.max(0, item.discrimination) * 100}%` }} />
									</div>
									<small>{item.item}</small>
								</div>
							))}
						</div>
						<div className="ia-legend">
							<span><i className="difficulty" />Difficulty Index</span>
							<span><i className="discrimination" />Discrimination Index</span>
						</div>
						<p className="ia-note">
							<strong>Interpretation:</strong> Difficulty Index (0-1): Higher values = easier items.
							Discrimination Index (0-1): Higher values = better differentiation between high/low performers.
							Target ranges: Difficulty 0.3-0.9, Discrimination {'>'} 0.3.
						</p>
					</section>

					<section className="ia-two-col" id="modules">
						<article className="ia-card">
							<h2>Cognitive Skills Distribution</h2>
							<div className="ia-radar-wrap">
								<div className="ia-radar-grid">
									<div className="ring ring-1" />
									<div className="ring ring-2" />
									<div className="ring ring-3" />
									<div className="ia-radar-fill" />
								</div>
								<div className="ia-radar-labels">
									<span>Knowledge</span>
									<span>Comprehension</span>
									<span>Application</span>
									<span>Analysis</span>
									<span>Synthesis</span>
									<span>Evaluation</span>
								</div>
							</div>
						</article>

						<article className="ia-card" id="reports">
							<h2>Distractor Analysis (Sample)</h2>
							<div className="ia-stacked-chart">
								{[
									{ label: 'Q1', values: [15, 8, 74, 3] },
									{ label: 'Q2', values: [67, 14, 11, 8] },
									{ label: 'Q3', values: [9, 63, 20, 8] },
									{ label: 'Q4', values: [86, 6, 5, 3] },
									{ label: 'Q5', values: [12, 15, 18, 55] },
								].map((item) => (
									<div className="ia-stack-col" key={item.label}>
										<div className="stack">
											<span className="opt-a" style={{ height: `${item.values[0]}%` }} />
											<span className="opt-b" style={{ height: `${item.values[1]}%` }} />
											<span className="opt-c" style={{ height: `${item.values[2]}%` }} />
											<span className="opt-d" style={{ height: `${item.values[3]}%` }} />
										</div>
										<small>{item.label}</small>
									</div>
								))}
							</div>
							<div className="ia-legend multi">
								<span><i className="opt-a" />Option A</span>
								<span><i className="opt-b" />Option B</span>
								<span><i className="opt-c" />Option C</span>
								<span><i className="opt-d" />Option D</span>
							</div>
						</article>
					</section>

					<section className="ia-card" id="workflow">
						<h2>Detailed Item Analysis</h2>
						<table>
							<thead>
								<tr>
									<th>Item</th>
									<th>Difficulty</th>
									<th>Discrimination</th>
									<th>Point Biserial</th>
									<th>Status</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{analysisResult.items.map((item) => (
									<tr key={item.item}>
										<td>{item.item}</td>
										<td>{item.difficulty.toFixed(2)}</td>
										<td>{item.discrimination.toFixed(2)}</td>
										<td>{(item.discrimination * 0.9).toFixed(2)}</td>
										<td>
											<span className={`badge ${item.interpretation.toLowerCase() === 'excellent' ? 'excellent' : item.interpretation.toLowerCase() === 'good' ? 'good' : 'review'}`}>
												{item.interpretation}
											</span>
										</td>
										<td><a href="#view">View Details</a></td>
									</tr>
								))}
							</tbody>
						</table>
					</section>
						</>
					)}
				</main>
			</div>
		</div>
	);
}

export default ItemAnalysis;
