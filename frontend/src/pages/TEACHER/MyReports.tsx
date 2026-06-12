import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import {
	getItemAnalysisData,
	getReportsData,
	getStudentManagementData,
	getUploadMetaData,
	type ItemAnalysisResponse,
	type ReportsResponse,
	type StudentRecord,
	type UploadMetaResponse
} from '../../services/teacherPortalApi';
import { findLinkedTosRecord } from '../../services/tosStorage';
import '../../styles/TEACHER/MyReports.css';

type DecisionLabel =
  | 'Accepted as it is'
  | 'Accepted with very slight revision'
  | 'Accepted with slight revision'
  | 'May be accepted with minor revision'
  | 'Major revision on the stem or choices'
  | 'Needs major revision or may be discarded'
  | 'Totally discard';

const DECISION_ORDER: DecisionLabel[] = [
  'Accepted as it is',
  'Accepted with very slight revision',
  'Accepted with slight revision',
  'May be accepted with minor revision',
  'Major revision on the stem or choices',
  'Needs major revision or may be discarded',
  'Totally discard'
];

const SCHOOL_LOGO_LEFT = '';
const SCHOOL_LOGO_RIGHT = '';
const SCHOOL_REGION = 'Department of Education - Region III';
const SCHOOL_DIVISION = 'Division of OLONGAPO';
const SCHOOL_DISTRICT = 'District IV - A';
const SCHOOL_NAME = 'KALALAKE ELEMENTARY SCHOOL';

function parseIndexValue(value: string | number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1 ? value / 100 : value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/%/g, '').trim();
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed > 1 ? parsed / 100 : parsed;
  }
  return null;
}

function computeDecision(difficultyValue: string | number, discriminationValue: string | number): DecisionLabel {
  const diff = parseIndexValue(difficultyValue) ?? -1;
  const disc = parseIndexValue(discriminationValue) ?? -1;
  if (diff < 0 || disc < 0) return 'Totally discard';
  if (diff >= 0.85 && disc >= 0.4) return 'Accepted as it is';
  if (diff >= 0.7 && disc >= 0.3) return 'Accepted with very slight revision';
  if (diff >= 0.45 && disc >= 0.2) return 'Accepted with slight revision';
  if (diff >= 0.2 && disc >= 0.1) return 'May be accepted with minor revision';
  if (diff >= 0.2 && disc >= 0) return 'Major revision on the stem or choices';
  if (diff >= 0.05 || disc >= -0.05) return 'Needs major revision or may be discarded';
  return 'Totally discard';
}

type DifficultyBand = 'Very Easy' | 'Easy' | 'Moderately Difficult' | 'Difficult' | 'Very Difficult';
type DiscriminationBand = 'Very Discriminating' | 'Discriminating' | 'Moderately Discriminating' | 'Slightly Discriminating' | 'Not Discriminating';

type ReportRow = {
	itemNo: number;
	difficultyIndex: number;
	discriminationIndex: number;
	difficultyLabel: DifficultyBand;
	discriminationLabel: DiscriminationBand;
	decision: string;
	totalCorrect: number;
	contentArea: string;
	intervention: string;
};

type DownloadableReport = {
	id: string;
	title: string;
	description: string;
	updatedAt: string;
	downloadLabel: string;
	onDownload: () => void;
	disabled?: boolean;
};

function toNumber(value: number | string | undefined): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function getDifficultyLabel(value: number): DifficultyBand {
	if (value >= 0.85) return 'Very Easy';
	if (value >= 0.7) return 'Easy';
	if (value >= 0.45) return 'Moderately Difficult';
	if (value >= 0.2) return 'Difficult';
	return 'Very Difficult';
}

function getDiscriminationLabel(value: number): DiscriminationBand {
	if (value >= 0.4) return 'Very Discriminating';
	if (value >= 0.3) return 'Discriminating';
	if (value >= 0.2) return 'Moderately Discriminating';
	if (value >= 0) return 'Slightly Discriminating';
	return 'Not Discriminating';
}

function getDecision(value: number): string {
	if (value >= 0.4) return 'Accepted';
	if (value >= 0.3) return 'Accepted with slight revision';
	if (value >= 0.2) return 'Accepted with revision';
	if (value >= 0.1) return 'May be accepted with major revision';
	if (value >= 0) return 'Needs major revision';
	return 'Totally discard';
}

function average(values: number[]): number {
	if (!values.length) return 0;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseClassLabel(classLabel: string): { grade: string; section: string } {
	const parts = classLabel.split('-').map((token) => token.trim()).filter(Boolean);
	if (!parts.length) {
		return { grade: '', section: '' };
	}

	return {
		grade: parts[0] ?? '',
		section: parts.slice(1).join(' - ')
	};
}

function normalizeStudentIdentityToken(value: string): string {
	return value
		.toLowerCase()
		.replace(/\./g, '')
		.replace(/\s+/g, ' ')
		.trim();
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

function MyReports() {
	const [data, setData] = useState<ReportsResponse | null>(null);
	const [uploadMeta, setUploadMeta] = useState<UploadMetaResponse | null>(null);
	const [itemAnalysisData, setItemAnalysisData] = useState<ItemAnalysisResponse | null>(null);
	const [students, setStudents] = useState<StudentRecord[]>([]);
	const [selectedClass, setSelectedClass] = useState('');
	const [selectedSubject, setSelectedSubject] = useState('');
	const [selectedQuarter, setSelectedQuarter] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reportError, setReportError] = useState<string | null>(null);
	const resolvedClass = (itemAnalysisData?.selectedClass ?? selectedClass).trim();
	const resolvedSubject = (itemAnalysisData?.selectedSubject ?? selectedSubject).trim();
	const resolvedQuarter = (itemAnalysisData?.selectedQuarter ?? selectedQuarter).trim();
	const resolvedClassParts = useMemo(() => parseClassLabel(resolvedClass), [resolvedClass]);

	const selectedLinkedRecord = useMemo(() => {
		if (!resolvedClass || !resolvedSubject || !resolvedQuarter) {
			return null;
		}
		return findLinkedTosRecord(resolvedClass, resolvedSubject, resolvedQuarter);
	}, [resolvedClass, resolvedSubject, resolvedQuarter]);

	const availableSubjectOptions = useMemo(() => {
		if (!selectedClass) {
			return uploadMeta?.subjects ?? itemAnalysisData?.subjectOptions ?? [];
		}
		const mapped = uploadMeta?.classSubjectMap?.[selectedClass] ?? [];
		if (mapped.length) {
			return mapped;
		}
		return itemAnalysisData?.subjectOptions ?? [];
	}, [selectedClass, uploadMeta?.subjects, uploadMeta?.classSubjectMap, itemAnalysisData?.subjectOptions]);

	const filteredStudents = useMemo(() => {
		return students.filter((student) => {
			const classMatch = !resolvedClass
				|| (
					student.grade.trim() === resolvedClassParts.grade
					&& (!resolvedClassParts.section || student.section.trim() === resolvedClassParts.section)
				);
			const subjectMatch = !resolvedSubject || student.subject.trim().toLowerCase() === resolvedSubject.toLowerCase();
			return classMatch && subjectMatch;
		});
	}, [students, resolvedClass, resolvedClassParts.grade, resolvedClassParts.section, resolvedSubject]);

	const rosterStudents = useMemo(() => {
		const seen = new Set<string>();
		const unique: StudentRecord[] = [];

		filteredStudents.forEach((student) => {
			const idToken = (student.id ?? '').trim();
			const nameToken = normalizeStudentIdentityToken(
				`${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.name
			);
			const key = idToken || nameToken;

			if (!key || seen.has(key)) {
				return;
			}

			seen.add(key);
			unique.push(student);
		});

		return unique;
	}, [filteredStudents]);

	const analysisStudentCount = useMemo(() => {
		const matchedCount = Array.from(
			new Set(
				(itemAnalysisData?.studentIdentityLinks ?? [])
					.map((link) => String(link.matchedStudentId ?? '').trim())
					.filter((id) => id.length > 0)
			)
		).length;
		if (matchedCount > 0) {
			return matchedCount;
		}

		const explicitCount = Math.round(toNumber(itemAnalysisData?.totalStudents));
		if (explicitCount > 0) {
			return explicitCount;
		}

		const byLinks = itemAnalysisData?.studentIdentityLinks?.length ?? 0;
		if (byLinks > 0) {
			return byLinks;
		}

		return itemAnalysisData?.studentResults?.length ?? 0;
	}, [itemAnalysisData?.totalStudents, itemAnalysisData?.studentIdentityLinks, itemAnalysisData?.studentResults]);

	const enrolledStudentCount = rosterStudents.length;
	const analysisRespondentCount = analysisStudentCount > 0 ? analysisStudentCount : enrolledStudentCount;

	const scoreSummary = useMemo(() => {
		const scores = rosterStudents.map((student) => toNumber(student.average));
		const highest = scores.length ? Math.max(...scores) : 0;
		const lowest = scores.length ? Math.min(...scores) : 0;
		const passCount = scores.filter((score) => score >= 75).length;
		const failCount = scores.length - passCount;
		const top27Count = analysisRespondentCount > 0 ? Math.max(1, Math.round(analysisRespondentCount * 0.27)) : 0;

		return {
			totalStudents: enrolledStudentCount,
			respondentCount: analysisRespondentCount,
			highest,
			lowest,
			passCount,
			failCount,
			top27Count
		};
	}, [rosterStudents, enrolledStudentCount, analysisRespondentCount]);

	const reportRows = useMemo<ReportRow[]>(() => {
		const sourceRows = itemAnalysisData?.rows ?? [];
		return sourceRows.map((row, index) => {
			const itemNo = Number(row.itemNo) || index + 1;
			const difficultyIndex = toNumber(row.difficultyIndex);
			const discriminationIndex = toNumber(row.discriminationIndex);
			const contentArea = selectedLinkedRecord?.analysisEntries[itemNo - 1]?.contentArea ?? '';
			const intervention = selectedLinkedRecord?.analysisEntries[itemNo - 1]?.intervention ?? '';

			return {
				itemNo,
				difficultyIndex,
				discriminationIndex,
				difficultyLabel: getDifficultyLabel(difficultyIndex),
				discriminationLabel: getDiscriminationLabel(discriminationIndex),
				decision: getDecision(discriminationIndex),
				totalCorrect: Math.round(difficultyIndex * analysisRespondentCount),
				contentArea,
				intervention
			};
		});
	}, [itemAnalysisData?.rows, selectedLinkedRecord, analysisRespondentCount]);

	const entryDrivenRows = useMemo(() => {
		return reportRows.filter((row) => {
			const hasContent = row.contentArea.trim().length > 0;
			const hasIntervention = row.intervention.trim().length > 0;
			return hasContent || hasIntervention;
		});
	}, [reportRows]);

	const topLeastLearned = useMemo(() => {
		return [...entryDrivenRows]
			.sort((first, second) => first.difficultyIndex - second.difficultyIndex)
			.slice(0, 10);
	}, [entryDrivenRows]);

	const reportKpis = useMemo(() => {
		const avgDifficulty = average(reportRows.map((row) => row.difficultyIndex));
		const avgDiscrimination = average(reportRows.map((row) => row.discriminationIndex));
		return {
			meanScore: average(rosterStudents.map((student) => toNumber(student.average))),
			totalScore: rosterStudents.reduce((sum, student) => sum + toNumber(student.average), 0),
			mps: avgDifficulty * 100,
			difficultyAverage: avgDifficulty,
			discriminationAverage: avgDiscrimination
		};
	}, [reportRows, rosterStudents]);

	const contextToken = useMemo(() => {
		const classToken = (resolvedClass || 'Class').replace(/\s+/g, '-');
		const subjectToken = (resolvedSubject || 'Subject').replace(/\s+/g, '-');
		const quarterToken = (resolvedQuarter || 'Quarter').replace(/\s+/g, '-');
		return `${classToken}_${subjectToken}_${quarterToken}`;
	}, [resolvedClass, resolvedSubject, resolvedQuarter]);

	const updatedAtLabel = useMemo(
		() => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
		[]
	);

	const handleDownloadItemAnalysisMatrix = () => {
		downloadCsvFile(
			`item-analysis-matrix_${contextToken}.csv`,
			['Item No', 'Total Correct', 'Difficulty Index', 'Difficulty Interpretation', 'Discrimination Index', 'Discrimination Interpretation', 'Decision'],
			reportRows.map((row) => [
				row.itemNo,
				row.totalCorrect,
				row.difficultyIndex.toFixed(2),
				row.difficultyLabel,
				row.discriminationIndex.toFixed(2),
				row.discriminationLabel,
				row.decision
			])
		);
	};

	const handleDownloadClassSummary = () => {
		downloadCsvFile(
			`class-performance-summary_${contextToken}.csv`,
			['Class', 'Subject', 'Quarter', 'Total Students', 'Highest Score', 'Lowest Score', 'Mean Score', 'MPS', 'Passing', 'Failing'],
			[[
				resolvedClass || 'N/A',
				resolvedSubject || 'N/A',
				resolvedQuarter || 'N/A',
				scoreSummary.totalStudents,
				scoreSummary.highest.toFixed(2),
				scoreSummary.lowest.toFixed(2),
				reportKpis.meanScore.toFixed(2),
				reportKpis.mps.toFixed(2),
				scoreSummary.passCount,
				scoreSummary.failCount
			]]
		);
	};

	const handleDownloadStudentRanking = () => {
		const sortedStudents = [...rosterStudents]
			.sort((first, second) => (Number(first.ranking) || 0) - (Number(second.ranking) || 0));

		downloadCsvFile(
			`student-ranking_${contextToken}.csv`,
			['Rank', 'Name', 'Grade', 'Section', 'Subject', 'Average'],
			sortedStudents.map((student) => [
				student.ranking,
				student.name,
				student.grade,
				student.section,
				student.subject,
				student.average
			])
		);
	};

	const handleDownloadInterventionList = () => {
		downloadCsvFile(
			`least-learned-interventions_${contextToken}.csv`,
			['Item Number', 'Difficulty Index', 'Content Area', 'Intervention'],
			topLeastLearned.map((row) => [
				row.itemNo,
				row.difficultyIndex.toFixed(2),
				row.contentArea,
				row.intervention
			])
		);
	};

	function downloadWordFile(fileName: string, htmlContent: string) {
		const style = `
			table { border-collapse: collapse; font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
			th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; vertical-align: top; }
			th { background: #d9e1f2; font-weight: 700; }
			td.left { text-align: left; }
			.title { font-size: 16pt; font-weight: 700; text-align: center; margin-bottom: 4px; }
			.meta { font-size: 10pt; text-align: center; margin-bottom: 12px; color: #555; }
			.section { font-size: 13pt; font-weight: 700; margin-top: 18px; margin-bottom: 6px; }
			.subsection { font-size: 11pt; font-weight: 700; margin-top: 12px; margin-bottom: 4px; }
			.summary-grid { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
			.summary-card { border: 1px solid #000; padding: 4px 8px; text-align: center; min-width: 120px; }
			.summary-card .count { font-size: 14pt; font-weight: 700; display: block; }
			.summary-card .label { font-size: 8pt; display: block; }
			.score-summary { font-size: 10pt; margin-top: 6px; margin-bottom: 12px; }
			.footer { text-align: center; font-size: 9pt; margin-top: 20px; color: #888; }
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



	const handleGenerateWordReport = async () => {
		let data = itemAnalysisData;
		const filterKey = `${selectedClass}|${selectedSubject}|${selectedQuarter}`;
		const lastFilter = sessionStorage.getItem('wordReportFilter');
		if (!data?.rows?.length || lastFilter !== filterKey) {
			try {
				const [analysisPayload, studentsPayload] = await Promise.all([
					getItemAnalysisData(selectedClass, selectedSubject, selectedQuarter),
					getStudentManagementData()
				]);
				setItemAnalysisData(analysisPayload);
				setStudents(studentsPayload.students ?? []);
				sessionStorage.setItem('wordReportFilter', filterKey);
				data = analysisPayload;
			} catch {
				return;
			}
		}
		const rows = data?.rows ?? [];
		if (!rows.length) return;

		const schoolYear = new Date().getFullYear();
		const classLabel = resolvedClass || 'N/A';
		const parsedClass = parseClassLabel(classLabel);
		const gradeSection = parsedClass.section ? `${parsedClass.grade}/${parsedClass.section}` : classLabel;

		const decisionCounts = new Map<DecisionLabel, number>();
		DECISION_ORDER.forEach((label) => decisionCounts.set(label, 0));
		rows.forEach((row) => {
			const label = computeDecision(row.difficultyIndex, row.discriminationIndex);
			decisionCounts.set(label, (decisionCounts.get(label) ?? 0) + 1);
		});
		const summaryCards = DECISION_ORDER.map((label) => {
			const count = decisionCounts.get(label) ?? 0;
			return count > 0 ? `<div class="summary-card"><span class="count">${count}</span><span class="label">${label}</span></div>` : '';
		}).filter(Boolean).join('');

		const numItems = rows.length;
		const analysisRows = rows.map((row, i) => {
			const itemNo = Number(row.itemNo) || i + 1;
			const diff = parseIndexValue(row.difficultyIndex) ?? 0;
			const disc = parseIndexValue(row.discriminationIndex) ?? 0;
			const difficultyLabel = row.difficultyLabel || getDifficultyLabel(diff);
			const decision = computeDecision(row.difficultyIndex, row.discriminationIndex);
			return `<tr><td>${itemNo}</td><td>${diff.toFixed(2)}</td><td>${difficultyLabel}</td><td>${disc.toFixed(2)}</td><td>${row.result || row.interpretation || ''}</td><td>${row.interpretation || ''}</td><td>${decision}</td></tr>`;
		}).join('');

		const sortedRows = [...(data?.rows ?? [])].map((r, i) => ({
			itemNo: Number(r.itemNo) || i + 1,
			diffValue: parseIndexValue(r.difficultyIndex) ?? 0
		})).sort((a, b) => b.diffValue - a.diffValue);
		const mostLearned = sortedRows.slice(0, 10);
		const leastLearned = [...sortedRows].reverse().slice(0, 10);

		const mostRows = mostLearned.map((item) => {
			return `<tr><td>${item.itemNo}</td><td class="left">-</td></tr>`;
		}).join('');

		const leastRows = leastLearned.map((item) => {
			return `<tr><td>${item.itemNo}</td><td class="left">-</td></tr>`;
		}).join('');

		const scores = (data?.studentResults ?? data?.studentItemResults ?? [])
			.map((r) => Number(r.totalScore))
			.filter((s) => Number.isFinite(s));
		const analysisScores = scores.length > 0 ? {
			highest: Math.max(...scores).toFixed(1),
			lowest: Math.min(...scores).toFixed(1),
			mean: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
			mps: numItems > 0 ? ((scores.reduce((a, b) => a + b, 0) / scores.length) / numItems * 100).toFixed(2) : '0.00',
			total: scores.reduce((a, b) => a + b, 0).toFixed(0),
			passing: scores.filter((s) => s >= Math.ceil(numItems / 2)).length,
			failing: scores.filter((s) => s < Math.ceil(numItems / 2)).length
		} : null;

		const logoLeft = SCHOOL_LOGO_LEFT
			? `<img src="${SCHOOL_LOGO_LEFT}" style="width:70px;height:70px;object-fit:contain;"/>`
			: `<div style="width:70px;height:70px;border:1px solid #ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#ccc;">Logo</div>`;
		const logoRight = SCHOOL_LOGO_RIGHT
			? `<img src="${SCHOOL_LOGO_RIGHT}" style="width:70px;height:70px;object-fit:contain;"/>`
			: `<div style="width:70px;height:70px;border:1px solid #ccc;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#ccc;">Logo</div>`;

		const now = new Date();
		const html = `
			<table style="width:100%;border:none;margin-bottom:6px;">
				<tr style="border:none;">
					<td style="border:none;width:85px;text-align:center;vertical-align:middle;">${logoLeft}</td>
					<td style="border:none;text-align:center;vertical-align:middle;">
						<div style="font-size:11pt;font-weight:700;">${SCHOOL_REGION}</div>
						<div style="font-size:12pt;font-weight:700;">${SCHOOL_DIVISION}</div>
						<div style="font-size:11pt;font-weight:700;">${SCHOOL_DISTRICT}</div>
						<div style="font-size:13pt;font-weight:700;margin-top:4px;">${SCHOOL_NAME}</div>
						<div style="font-size:11pt;font-weight:700;margin-top:6px;">Item Analysis in ${resolvedSubject || 'N/A'} for ${gradeSection}</div>
						<div style="font-size:11pt;">SY ${schoolYear} - ${schoolYear + 1}</div>
					</td>
					<td style="border:none;width:85px;text-align:center;vertical-align:middle;">${logoRight}</td>
				</tr>
			</table>

			<hr style="border:1px solid #000;margin:4px 0;"/>

			<div class="section">I. Item Analysis Matrix</div>
			<table><thead><tr><th>Item No</th><th>Difficulty Index</th><th>Difficulty</th><th>Discrimination Index</th><th>Item Result</th><th>Interpretation</th><th>Decision</th></tr></thead><tbody>${analysisRows}</tbody></table>

			${analysisScores ? `
			<div class="score-summary">
				<strong>Score Summary:</strong>
				${analysisScores.highest} Highest Score | ${analysisScores.lowest} Lowest Score |
				${analysisScores.mean} Mean | ${analysisScores.mps}% MPS |
				${analysisScores.total} Total Score | ${analysisScores.passing} Passing |
				${analysisScores.failing} Failing
			</div>` : `
			<div class="score-summary">
				<strong>Class Performance:</strong> Total Items: ${numItems}
			</div>`}

			<div class="section">II. Summary of Results</div>
			<div class="summary-grid">${summaryCards}</div>

			<div class="section">III. Top 10 Most Learned Test Items</div>
			<table><thead><tr><th>Item No</th><th>Content Area</th></tr></thead><tbody>${mostRows || '<tr><td colspan="2">No items available.</td></tr>'}</tbody></table>

			<div class="section">IV. Top 10 Least Learned Test Items</div>
			<table><thead><tr><th>Item No</th><th>Content Area</th><th>Intervention</th></tr></thead><tbody>${leastRows || '<tr><td colspan="3">No items available.</td></tr>'}</tbody></table>

			<br/>
			<table style="width:100%;border:none;margin-top:24px;">
				<tr style="border:none;">
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:40px;border-top:1px solid #000;display:inline-block;padding:0 20px;font-size:10pt;font-weight:700;">Prepared by:</div>
						<div style="font-size:10pt;margin-top:2px;">Signature of Adviser</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:40px;border-top:1px solid #000;display:inline-block;padding:0 20px;font-size:10pt;font-weight:700;">Noted by:</div>
						<div style="font-size:10pt;margin-top:2px;">Signature of Principal</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:40px;border-top:1px solid #000;display:inline-block;padding:0 20px;font-size:10pt;font-weight:700;">Reviewed by:</div>
						<div style="font-size:10pt;margin-top:2px;">Signature of Coordinator</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:40px;border-top:1px solid #000;display:inline-block;padding:0 20px;font-size:10pt;font-weight:700;">Approved by:</div>
						<div style="font-size:10pt;margin-top:2px;">Signature of Supervisor</div>
					</td>
				</tr>
			</table>

			<div class="footer">Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | School Year ${schoolYear}-${schoolYear + 1}</div>
		`;

		downloadWordFile(`item-analysis-report_${contextToken}.doc`, html);
	};

	const hasReportData = reportRows.length > 0;
	const hasStudentData = rosterStudents.length > 0;

	const downloadableReports = useMemo<DownloadableReport[]>(() => {
		return [
			{
				id: 'item-analysis-matrix',
				title: 'Item Analysis Matrix',
				description: 'Per-item difficulty, discrimination, and decision summary for your selected class.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download CSV',
				onDownload: handleDownloadItemAnalysisMatrix,
				disabled: !hasReportData
			},
			{
				id: 'class-performance-summary',
				title: 'Class Performance Summary',
				description: 'Class-level performance totals, mean score, MPS, and pass/fail counts.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download CSV',
				onDownload: handleDownloadClassSummary,
				disabled: !hasReportData
			},
			{
				id: 'student-ranking-list',
				title: 'Student Ranking List',
				description: 'Student ranking and average scores for the selected class and subject.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download CSV',
				onDownload: handleDownloadStudentRanking,
				disabled: !hasStudentData
			},
			{
				id: 'least-learned-interventions',
				title: 'Least Learned With Interventions',
				description: 'Targeted least-learned items with linked content-area gaps and interventions.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download CSV',
				onDownload: handleDownloadInterventionList,
				disabled: topLeastLearned.length === 0
			}
		];
	}, [
		updatedAtLabel,
		hasReportData,
		hasStudentData,
		topLeastLearned.length,
		handleDownloadItemAnalysisMatrix,
		handleDownloadClassSummary,
		handleDownloadStudentRanking,
		handleDownloadInterventionList
	]);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const [reportsPayload, uploadMetaPayload, analysisPayload, studentsPayload] = await Promise.all([
					getReportsData(),
					getUploadMetaData(),
					getItemAnalysisData(undefined, undefined, selectedQuarter),
					getStudentManagementData()
				]);

				setData(reportsPayload);
				setUploadMeta(uploadMetaPayload);
				setItemAnalysisData(analysisPayload);
				setStudents(studentsPayload.students ?? []);

				const initialClass = analysisPayload.selectedClass ?? uploadMetaPayload.gradeLevels[0] ?? '';
				const classSubjects = uploadMetaPayload.classSubjectMap?.[initialClass] ?? [];
				const initialSubject = analysisPayload.selectedSubject ?? classSubjects[0] ?? uploadMetaPayload.subjects[0] ?? '';
				const initialQuarter = analysisPayload.selectedQuarter ?? uploadMetaPayload.quarters[0] ?? 'First';

				setSelectedClass(initialClass);
				setSelectedSubject(initialSubject);
				setSelectedQuarter(initialQuarter);
			} catch (loadError) {
				setData(null);
				setUploadMeta(null);
				setItemAnalysisData(null);
				setStudents([]);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, []);

	useEffect(() => {
		if (!availableSubjectOptions.includes(selectedSubject)) {
			setSelectedSubject(availableSubjectOptions[0] ?? '');
		}
	}, [availableSubjectOptions, selectedSubject]);

	useEffect(() => {
		if (!selectedClass || !selectedSubject || !selectedQuarter) return;
		if (!uploadMeta) return;

		const load = async () => {
			setLoading(true);
			setError(null);
			try {
				const [analysisPayload, studentsPayload] = await Promise.all([
					getItemAnalysisData(selectedClass, selectedSubject, selectedQuarter),
					getStudentManagementData()
				]);
				setItemAnalysisData(analysisPayload);
				setStudents(studentsPayload.students ?? []);
			} catch (loadError) {
				setItemAnalysisData(null);
				setStudents([]);
				setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [selectedClass, selectedSubject, selectedQuarter]);

	return (
		<TeacherLayout title={data?.title ?? 'Reports'}>
			<section className="teacher-dash-heading teacher-page-heading">
				<p>{data?.systemLabel ?? 'REPORT GENERATION CENTER'}</p>
				<div className="teacher-heading-row">
					<h2>{data?.title ?? 'Reports'}</h2>
					<span>{data?.viewLabel ?? 'Teacher View'}</span>
				</div>
			</section>

			<p className="teacher-page-subtitle">
				{data?.subtitle ?? 'Generate and download reports for your classes and student performance'}
			</p>

			{loading ? <p className="teacher-status">Loading reports...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}
			{reportError ? <p className="teacher-status teacher-status-error">{reportError}</p> : null}

			<section className="teacher-panel report-builder-panel no-print">
				<div className="teacher-panel-head">
					<h2>Report Generation Center</h2>
					<span>Generate and download reports for your selected class, subject, and quarter.</span>
				</div>
				<div className="teacher-filter-row">
					<select value={selectedClass} onChange={(event) => {
						setSelectedClass(event.target.value);
						setSelectedSubject('');
					}}>
						<option value="">Select Class</option>
						{(uploadMeta?.gradeLevels ?? itemAnalysisData?.classOptions ?? []).map((classOption) => (
							<option key={classOption} value={classOption}>{classOption}</option>
						))}
					</select>
					<select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} disabled={!selectedClass}>
						<option value="">Select Subject</option>
						{availableSubjectOptions.map((subjectOption) => (
							<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
						))}
					</select>
					<select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>
						{(uploadMeta?.quarters ?? ['First', 'Second', 'Third', 'Fourth']).map((quarterOption) => (
							<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
						))}
					</select>
					</div>
			</section>

			<div className="reports-action-grid no-print">
				<article className="reports-action-card">
					<h3>Executive Summary (DOCS)</h3>
					<p>Same complete report in Microsoft Word document format. Ideal for printing and submission.</p>
					<button type="button" onClick={handleGenerateWordReport} disabled={!itemAnalysisData?.rows?.length}>
						Download DOCS
					</button>
				</article>
				<article className="reports-action-card green">
					<h3>Student Ranking Sheet</h3>
					<p>Download a ranking list with student averages for your class.</p>
					<button type="button" onClick={handleDownloadStudentRanking} disabled={!hasStudentData}>Download CSV</button>
				</article>
			</div>



			<section className="teacher-panel no-print">
				<h2>Available Reports</h2>
				<p className="teacher-panel-copy">Download only the reports that teachers need for class-level monitoring and intervention planning.</p>
				{downloadableReports.length ? (
					<div className="reports-grid">
						{downloadableReports.map((report) => (
							<article key={report.id} className="reports-card">
								<strong>{report.title}</strong>
								<p>{report.description}</p>
								<div className="reports-card-meta">
									<span>{report.updatedAt}</span>
									<button type="button" onClick={report.onDownload} disabled={report.disabled}>{report.downloadLabel}</button>
								</div>
							</article>
						))}
					</div>
				) : (
					<p className="teacher-status">No reports available.</p>
				)}
			</section>
		</TeacherLayout>
	);
}

export default MyReports;
