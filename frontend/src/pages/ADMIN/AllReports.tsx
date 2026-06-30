import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/SchoolOverview.css';

type AdminItemAnalysisRow = {
	itemNo: number;
	difficultyIndex: number;
	difficultyLabel: string;
	discriminationIndex: number;
	result: string;
	interpretation: string;
	decision: string;
	status: 'excellent' | 'good' | 'fair' | 'poor';
};

type AdminItemAnalysisResponse = {
	title: string;
	gradeOptions: string[];
	gradeSubjectMap: Record<string, string[]>;
	subjectOptions: string[];
	quarterOptions: string[];
	selectedGrade: string;
	selectedSubject: string;
	selectedQuarter: string;
	classAverage: string;
	averageIndex: string;
	totalStudents: number;
	rows: AdminItemAnalysisRow[];
};

function average(values: number[]): number {
	if (!values.length) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toCsvSafe(value: string | number): string {
	const text = String(value ?? '');
	if (text.includes(',') || text.includes('"') || text.includes('\n')) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function downloadCsvFile(fileName: string, headers: string[], rows: Array<Array<string | number>>) {
	const csv = [
		headers.map((header) => toCsvSafe(header)).join(','),
		...rows.map((row) => row.map((cell) => toCsvSafe(cell)).join(','))
	].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

function downloadWordFile(fileName: string, htmlContent: string) {
	const style = `
		table { border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
		th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; vertical-align: top; }
		th { background: #d9e1f2; font-weight: 700; }
		td.left { text-align: left; }
		.title { font-size: 16pt; font-weight: 700; text-align: center; margin-bottom: 4px; }
		.meta { font-size: 10pt; text-align: center; margin-bottom: 12px; color: #555; }
		.section { font-size: 13pt; font-weight: 700; margin-top: 18px; margin-bottom: 6px; }
		.score-summary { font-size: 10pt; margin-top: 6px; margin-bottom: 12px; }
	`;
	const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${style}</style></head><body>${htmlContent}</body></html>`;
	const blob = new Blob([fullHtml], { type: 'application/msword' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

const LOGO_LEFT_URL = '/logos/logo-left.jpeg';
const LOGO_RIGHT_URL = '/logos/logo-right.png';

const loadImageAsBase64 = (url: string): Promise<string> => {
	return new Promise((resolve) => {
		fetch(url)
			.then((r) => r.blob())
			.then((blob) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.readAsDataURL(blob);
			})
			.catch(() => resolve(''));
	});
};

function AllReports() {
	const [data, setData] = useState<AdminItemAnalysisResponse | null>(null);
	const [selectedGrade, setSelectedGrade] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	const [selectedQuarter, setSelectedQuarter] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const role = localStorage.getItem('userRole') ?? '';
	const email = localStorage.getItem('userEmail') ?? '';

	const resolvedGrade = data?.selectedGrade ?? selectedGrade;
	const resolvedSubject = data?.selectedSubject ?? selectedSubject;
	const resolvedQuarter = data?.selectedQuarter ?? selectedQuarter;

	const totalStudents = data?.totalStudents ?? 0;
	const rows = data?.rows ?? [];

	const avgDifficulty = rows.length ? average(rows.map((r) => r.difficultyIndex)) : 0;
	const avgDiscrimination = rows.length ? average(rows.map((r) => r.discriminationIndex)) : 0;
	const mps = avgDifficulty * 100;

	const respondentCount = totalStudents > 0 ? totalStudents : rows.length;

	const highestScore = useMemo(() => {
		let max = 0;
		rows.forEach((r) => {
			const match = r.result?.match(/^(\d+)\/(\d+)$/);
			if (match) {
				const correct = Number(match[1]);
				if (correct > max) max = correct;
			}
		});
		return max || 0;
	}, [rows]);

	const lowestScore = useMemo(() => {
		let min = Infinity;
		rows.forEach((r) => {
			const match = r.result?.match(/^(\d+)\/(\d+)$/);
			if (match) {
				const correct = Number(match[1]);
				if (correct < min) min = correct;
			}
		});
		return Number.isFinite(min) ? min : 0;
	}, [rows]);

	const contextToken = useMemo(() => {
		const gradeToken = (resolvedGrade || 'Grade').replace(/\s+/g, '-');
		const subjectToken = (resolvedSubject || 'Subject').replace(/\s+/g, '-');
		const quarterToken = (resolvedQuarter || 'Quarter').replace(/\s+/g, '-');
		return `${gradeToken}_${subjectToken}_${quarterToken}`;
	}, [resolvedGrade, resolvedSubject, resolvedQuarter]);

	const updatedAtLabel = useMemo(
		() => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
		[]
	);

	useEffect(() => {
		if (selectedGrade === '' && selectedSubject === '' && selectedQuarter === '') return;
		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams();
				if (selectedGrade) params.set('class', selectedGrade);
				if (selectedSubject) params.set('subject', selectedSubject);
				if (selectedQuarter) params.set('quarter', selectedQuarter);
				const query = params.toString();
				const response = await fetchJson<AdminItemAnalysisResponse>(`/api/admin/item-analysis${query ? `?${query}` : ''}`, {
					method: 'GET',
					headers: { 'x-user-role': role, 'x-user-email': email }
				});
				setData(response);
				setSelectedGrade(response.selectedGrade ?? '');
				setSelectedSubject(response.selectedSubject ?? '');
				setSelectedQuarter(response.selectedQuarter ?? '');
			} catch (loadError) {
				setData(null);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, [selectedGrade, selectedSubject, selectedQuarter]);

	const hasData = rows.length > 0;

	const handleDownloadItemAnalysisMatrix = () => {
		if (!hasData) return;
		downloadCsvFile(
			`item-analysis-matrix_${contextToken}.csv`,
			['Item No', 'Difficulty Index', 'Difficulty Label', 'Discrimination Index', 'Result', 'Interpretation', 'Decision'],
			rows.map((r) => [
				r.itemNo,
				r.difficultyIndex.toFixed(2),
				r.difficultyLabel,
				r.discriminationIndex.toFixed(2),
				r.result,
				r.interpretation,
				r.decision
			])
		);
	};

	const handleDownloadClassSummary = () => {
		if (!hasData) return;
		const classAvg = data?.classAverage || `${mps.toFixed(1)}%`;
		const avgIdx = data?.averageIndex || `${avgDiscrimination.toFixed(2)}`;
		downloadCsvFile(
			`class-performance-summary_${contextToken}.csv`,
			['Class', 'Subject', 'Quarter', 'Total Students', 'Items', 'Class Average', 'Avg Discrimination Index', 'MPS (%)', 'Highest Correct', 'Lowest Correct'],
			[[
				resolvedGrade || 'N/A',
				resolvedSubject || 'N/A',
				resolvedQuarter || 'N/A',
				totalStudents || respondentCount,
				rows.length,
				classAvg,
				avgIdx,
				mps.toFixed(1),
				highestScore,
				lowestScore
			]]
		);
	};

	const handleDownloadWordReport = async () => {
		if (!hasData) return;

		const [loadedLogoLeft, loadedLogoRight] = await Promise.all([
			loadImageAsBase64(LOGO_LEFT_URL),
			loadImageAsBase64(LOGO_RIGHT_URL)
		]);

		const logoLeft = loadedLogoLeft
			? `<img src="${loadedLogoLeft}" style="width:auto;height:8px;object-fit:contain;"/>`
			: `<div style="width:8px;height:8px;border:1px solid #ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:3pt;color:#ccc;">Logo</div>`;
		const logoRight = loadedLogoRight
			? `<img src="${loadedLogoRight}" style="width:auto;height:28px;object-fit:contain;"/>`
			: `<div style="width:28px;height:28px;border:1px solid #ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:6pt;color:#ccc;">Logo</div>`;

		const now = new Date();
		const classAvg = data?.classAverage || `${mps.toFixed(1)}%`;

		const html = `
			<table style="width:100%;border:none;margin-bottom:6px;">
				<tr style="border:none;">
					<td style="border:none;width:38px;text-align:center;vertical-align:middle;">${logoLeft}</td>
					<td style="border:none;text-align:center;vertical-align:middle;">
						<div style="font-size:12pt;font-weight:700;">${resolvedGrade || 'N/A'}</div>
						<div style="font-size:11pt;font-weight:700;">${resolvedSubject || 'N/A'} - ${resolvedQuarter || 'N/A'}</div>
					</td>
					<td style="border:none;width:38px;text-align:center;vertical-align:middle;">${logoRight}</td>
				</tr>
			</table>
			<hr style="border:1px solid #000;margin:4px 0;"/>
			<div class="section">School-Wide Item Analysis Report</div>
			<div class="score-summary">Class Average: ${classAvg} | MPS: ${mps.toFixed(1)}% | Items: ${rows.length} | Students: ${totalStudents || respondentCount}</div>
			<table style="width:100%;">
				<tr><th>Item No</th><th>Difficulty</th><th>Label</th><th>Discrimination</th><th>Result</th><th>Interpretation</th><th>Decision</th></tr>
				${rows.map((r) => `<tr><td>${r.itemNo}</td><td>${r.difficultyIndex.toFixed(2)}</td><td>${r.difficultyLabel}</td><td>${r.discriminationIndex.toFixed(2)}</td><td>${r.result}</td><td>${r.interpretation}</td><td>${r.decision}</td></tr>`).join('')}
			</table>
			<div style="text-align:center;font-size:9pt;margin-top:20px;color:#888;">Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
		`;
		downloadWordFile(`admin-item-analysis-report_${contextToken}.doc`, html);
	};

	if (error) {
		return (
			<AdminLayout kicker="REPORT GENERATION CENTER" title="All Reports">
				<p className="admin-error">{error}</p>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout kicker="REPORT GENERATION CENTER" title="All Reports">
			<p className="admin-subcopy">Generate and download comprehensive reports for analysis and documentation</p>

			<div className="admin-filter-row">
				<select value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }}>
					<option value="">Select Grade</option>
					{(data?.gradeOptions ?? []).map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
				<select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedGrade}>
					<option value="">Select Subject</option>
					{(data?.subjectOptions ?? []).map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
				<select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} disabled={!selectedSubject}>
					<option value="">Select Quarter</option>
					{(data?.quarterOptions ?? ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4']).map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			</div>

			{loading && <p className="admin-status">Loading...</p>}

			{!loading && selectedGrade && selectedSubject && selectedQuarter && (
				<section className="admin-action-cards">
					<article className="admin-action-card">
						<h3>Executive Summary (DOCS)</h3>
						<p>Complete school-wide report in Microsoft Word format.</p>
						<button type="button" onClick={handleDownloadWordReport} disabled={!hasData}>Generate Report</button>
					</article>
				</section>
			)}

			<section className="admin-panel">
				<h2>Available Reports</h2>
				<div className="admin-report-grid">
					<article className="admin-report-item">
						<h3>Item Analysis Matrix</h3>
						<p>Per-item difficulty, discrimination, and decision summary.</p>
						<div><span>{updatedAtLabel}</span><button type="button" onClick={handleDownloadItemAnalysisMatrix} disabled={!hasData}>Download</button></div>
					</article>
					<article className="admin-report-item">
						<h3>Class Performance Summary</h3>
						<p>Class-level performance totals, averages, and MPS.</p>
						<div><span>{updatedAtLabel}</span><button type="button" onClick={handleDownloadClassSummary} disabled={!hasData}>Download</button></div>
					</article>
				</div>
			</section>
		</AdminLayout>
	);
}

export default AllReports;
