import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from './TeacherLayout';
import { getItemAnalysisData, type ItemAnalysisResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/ItemAnalysis.css';

function ItemAnalysis() {
	const navigate = useNavigate();
	const [data, setData] = useState<ItemAnalysisResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedView, setSelectedView] = useState('all');

	const filteredRows = (data?.rows ?? []).filter((row) => {
		if (selectedView === 'all') {
			return true;
		}

		const normalized = row.interpretation.toLowerCase();

		if (selectedView === 'excellent') {
			return normalized.includes('excellent');
		}

		if (selectedView === 'good') {
			return normalized.includes('good');
		}

		if (selectedView === 'needs') {
			return normalized.includes('poor') || normalized.includes('needs') || normalized.includes('fair');
		}

		return true;
	});

	const getInterpretationClass = (interpretation: string) => {
		const normalized = interpretation.toLowerCase();
		if (normalized.includes('excellent')) return 'excellent';
		if (normalized.includes('good')) return 'good';
		if (normalized.includes('fair')) return 'fair';
		if (normalized.includes('poor') || normalized.includes('needs')) return 'poor';
		return 'neutral';
	};

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await getItemAnalysisData();
				setData(response);
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load item analysis.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	return (
		<TeacherLayout title={data?.title ?? 'My Item Analysis'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'COMPREHENSIVE ITEM ANALYSIS'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'My Item Analysis'}</h2>
					<div className="teacher-heading-actions">
						<button
							type="button"
							className="teacher-item-analysis-upload-btn"
							onClick={() => navigate('/teacher/upload-results')}
						>
							Upload Results
						</button>
					</div>
				</div>
			</section>

			{loading ? <p className="teacher-status">Loading item analysis...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}

			<section className="teacher-filter-row">
				<select defaultValue={data?.grade ?? ''}>
					<option value="">Select Class</option>
					{data?.grade ? <option value={data.grade}>{`${data.grade}${data.section ? ` - ${data.section}` : ''}`}</option> : null}
				</select>
				<select defaultValue={data?.subject ?? ''}>
					<option value="">Select Subject</option>
					{data?.subject ? <option value={data.subject}>{data.subject}</option> : null}
				</select>
			</section>

			<div className="teacher-kpis teacher-kpis-3">
				<article className="teacher-card">
					<p>Average Score</p>
					<strong>{data?.classAverage}</strong>
				</article>
				<article className="teacher-card">
					<p>Average Index</p>
					<strong>{data?.averageIndex}</strong>
				</article>
				<article className="teacher-card">
					<p>Total Students</p>
					<strong>{data?.totalStudents}</strong>
				</article>
			</div>

			<div className="teacher-tabs-wrap">
				<div className="teacher-tabs">
					<button type="button" className={selectedView === 'all' ? 'active' : ''} onClick={() => setSelectedView('all')}>All Items</button>
					<button type="button" className={selectedView === 'excellent' ? 'active' : ''} onClick={() => setSelectedView('excellent')}>Excellent</button>
					<button type="button" className={selectedView === 'good' ? 'active' : ''} onClick={() => setSelectedView('good')}>Good</button>
					<button type="button" className={selectedView === 'needs' ? 'active' : ''} onClick={() => setSelectedView('needs')}>Needs Improvement</button>
				</div>
			</div>

			<section className="teacher-panel">
				<h2>Item Analysis</h2>
				{filteredRows.length ? (
					<div className="teacher-table-wrap">
						<table className="teacher-table">
							<thead>
								<tr>
									<th>Item No.</th>
									<th>Difficulty Index</th>
									<th>Discrimination Index</th>
									<th>Interpretation</th>
								</tr>
							</thead>
							<tbody>
								{filteredRows.map((row) => (
									<tr key={`${row.itemNo}-${row.interpretation}`}>
										<td>{row.itemNo}</td>
										<td>{row.difficultyIndex}</td>
										<td>{row.discriminationIndex}</td>
										<td>
											<span className={`teacher-badge ${getInterpretationClass(row.interpretation)}`}>
												{row.interpretation}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<p className="teacher-status">No item analysis entries found.</p>
				)}
			</section>
		</TeacherLayout>
	);
}

export default ItemAnalysis;
