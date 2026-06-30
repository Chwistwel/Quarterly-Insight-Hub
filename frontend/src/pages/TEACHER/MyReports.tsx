import { useCallback, useEffect, useMemo, useState } from 'react';
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

function getCurrentSchoolYear(): string {
	const currentYear = new Date().getFullYear();
	const startYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;
	return `${startYear}-${startYear + 1}`;
}

type DecisionLabel =
  | 'Accepted as it is'
  | 'Accepted with very slight revision'
  | 'Accepted with slight revision'
  | 'May be accepted with minor revision'
  | 'Major revision on the stem or choices'
  | 'Needs major revision or may be discarded'
  | 'Totally discard';

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

function normalizeTextToken(value: string): string {
	return value.trim().toLowerCase();
}

function normalizeQuarterForLookup(value: string): string {
	const match = value.match(/(\d+)/);
	if (!match) return value.trim();
	const qNum = Number.parseInt(match[1] ?? '', 10);
	if (!Number.isFinite(qNum) || qNum < 1 || qNum > 4) return value.trim();
	return `Q${qNum}`;
}

function getTosCompetencyMap(classValue: string, subject: string, quarter: string): Map<number, string> {
	const map = new Map<number, string>();
	try {
		const draftKey = [
			'teacher-tos-builder-draft',
			normalizeTextToken(classValue),
			normalizeTextToken(subject),
			normalizeQuarterForLookup(quarter)
		].join('::');
		const raw = localStorage.getItem(draftKey) ?? localStorage.getItem('teacher-tos-builder-draft');
		if (!raw) return map;

		const draft = JSON.parse(raw) as {
			classValue?: string;
			subject?: string;
			quarter?: string;
			rows?: Array<{
				competency?: string;
				counts?: Partial<Record<'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating', number>>;
			}>;
		};

		if (
			normalizeTextToken(String(draft.classValue ?? '')) !== normalizeTextToken(classValue) ||
			normalizeTextToken(String(draft.subject ?? '')) !== normalizeTextToken(subject) ||
			normalizeQuarterForLookup(String(draft.quarter ?? '')) !== normalizeQuarterForLookup(quarter)
		) {
			return map;
		}

		const bloomOrder = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'] as const;
		let itemNo = 1;
		(draft.rows ?? []).forEach((row, rowIndex) => {
			bloomOrder.forEach((key) => {
				const count = Number(row.counts?.[key] ?? 0) || 0;
				for (let i = 0; i < count; i++) {
					map.set(itemNo, String(row.competency ?? '').trim() || `Objective ${rowIndex + 1}`);
					itemNo++;
				}
			});
		});
	} catch {
		return map;
	}
	return map;
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
	const [lastUpdatedAt, setLastUpdatedAt] = useState(
		new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
	);

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

	const tosCompetencyMap = useMemo(() => {
		if (!resolvedClass || !resolvedSubject || !resolvedQuarter) return new Map<number, string>();
		return getTosCompetencyMap(resolvedClass, resolvedSubject, resolvedQuarter);
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

	const actualTotalStudents = useMemo(() => {
		const fromItemResults = itemAnalysisData?.studentItemResults?.length ?? 0;
		if (fromItemResults > 0) return fromItemResults;
		const fromResults = itemAnalysisData?.studentResults?.length ?? 0;
		if (fromResults > 0) return fromResults;
		const matchedCount = Array.from(
			new Set(
				(itemAnalysisData?.studentIdentityLinks ?? [])
					.map((link) => String(link.matchedStudentId ?? '').trim())
					.filter((id) => id.length > 0)
			)
		).length;
		if (matchedCount > 0) return matchedCount;
		const explicitCount = Math.round(toNumber(itemAnalysisData?.totalStudents));
		if (explicitCount > 0) return explicitCount;
		const byLinks = itemAnalysisData?.studentIdentityLinks?.length ?? 0;
		if (byLinks > 0) return byLinks;
		return 0;
	}, [itemAnalysisData?.totalStudents, itemAnalysisData?.studentIdentityLinks, itemAnalysisData?.studentResults, itemAnalysisData?.studentItemResults]);

	const enrolledStudentCount = rosterStudents.length;
	const analysisRespondentCount = actualTotalStudents > 0 ? actualTotalStudents : enrolledStudentCount;

	const itemCorrectCounts = useMemo(() => {
		const counts = new Map<number, number>();
		(itemAnalysisData?.studentItemResults ?? []).forEach((sr) => {
			(sr.itemResults ?? []).forEach((ir) => {
				const itemNo = Number(ir.itemNo);
				if (!Number.isFinite(itemNo)) return;
				if (String(ir.interpretation ?? '').trim().toLowerCase() === 'correct') {
					counts.set(itemNo, (counts.get(itemNo) ?? 0) + 1);
				}
			});
		});
		return counts;
	}, [itemAnalysisData?.studentItemResults]);

	const reportRows = useMemo<ReportRow[]>(() => {
		const sourceRows = itemAnalysisData?.rows ?? [];
		return sourceRows.map((row, index) => {
			const itemNo = Number(row.itemNo) || index + 1;
			const difficultyIndex = toNumber(row.difficultyIndex);
			const discriminationIndex = toNumber(row.discriminationIndex);
			const savedEntry = selectedLinkedRecord?.analysisEntries[itemNo - 1];
			const tosCompetency = tosCompetencyMap.get(itemNo);
			const contentArea = savedEntry?.contentArea ?? tosCompetency ?? 'Not specified';
			const intervention = savedEntry?.intervention ?? (contentArea && contentArea !== 'Not specified' ? `Remediation on ${contentArea}` : 'General remediation');
			const actualCorrect = itemCorrectCounts.get(itemNo);
			const totalCorrect = actualCorrect !== undefined
				? actualCorrect
				: (analysisRespondentCount > 0 ? Math.round(difficultyIndex * analysisRespondentCount) : Math.round(difficultyIndex * 100));

			return {
				itemNo,
				difficultyIndex,
				discriminationIndex,
				difficultyLabel: getDifficultyLabel(difficultyIndex),
				discriminationLabel: getDiscriminationLabel(discriminationIndex),
				decision: computeDecision(row.difficultyIndex, row.discriminationIndex),
				totalCorrect,
				contentArea,
				intervention
			};
		});
	}, [itemAnalysisData?.rows, selectedLinkedRecord, tosCompetencyMap, analysisRespondentCount, itemCorrectCounts]);

	const scoreSummary = useMemo(() => {
		const analysisScores = (itemAnalysisData?.studentResults ?? []).map((r) => toNumber(r.totalScore));
		if (!analysisScores.length) {
			const fromItemResults = (itemAnalysisData?.studentItemResults ?? []).map((r) => toNumber(r.totalScore));
			if (fromItemResults.length) {
				const highest = Math.max(...fromItemResults);
				const lowest = Math.min(...fromItemResults);
				const passCount = fromItemResults.filter((s) => s >= 75).length;
				const failCount = fromItemResults.length - passCount;
				const top27Count = analysisRespondentCount > 0 ? Math.max(1, Math.round(analysisRespondentCount * 0.27)) : 0;
				return { totalStudents: fromItemResults.length, respondentCount: analysisRespondentCount, highest, lowest, passCount, failCount, top27Count };
			}
			if (reportRows.length) {
				const top27Count = analysisRespondentCount > 0 ? Math.max(1, Math.round(analysisRespondentCount * 0.27)) : 0;
				const derivedMean = reportRows.reduce((s, r) => s + r.difficultyIndex, 0);
				return { totalStudents: analysisRespondentCount || reportRows.length, respondentCount: analysisRespondentCount || reportRows.length, highest: derivedMean, lowest: 0, passCount: 0, failCount: 0, top27Count };
			}
			const rosterScores = rosterStudents.map((student) => toNumber(student.average));
			if (rosterScores.length) {
				const highest = Math.max(...rosterScores);
				const lowest = Math.min(...rosterScores);
				const passCount = rosterScores.filter((score) => score >= 75).length;
				const failCount = rosterScores.length - passCount;
				const top27Count = analysisRespondentCount > 0 ? Math.max(1, Math.round(analysisRespondentCount * 0.27)) : 0;
				return { totalStudents: enrolledStudentCount || actualTotalStudents, respondentCount: analysisRespondentCount, highest, lowest, passCount, failCount, top27Count };
			}
		}
		const highest = Math.max(...analysisScores);
		const lowest = Math.min(...analysisScores);
		const passCount = analysisScores.filter((s) => s >= 75).length;
		const failCount = analysisScores.length - passCount;
		const top27Count = analysisRespondentCount > 0 ? Math.max(1, Math.round(analysisRespondentCount * 0.27)) : 0;
		return { totalStudents: analysisScores.length, respondentCount: analysisRespondentCount, highest, lowest, passCount, failCount, top27Count };
	}, [rosterStudents, enrolledStudentCount, analysisRespondentCount, itemAnalysisData?.studentResults, itemAnalysisData?.studentItemResults, reportRows]);

	const topLeastLearned = useMemo(() => {
		return [...reportRows]
			.sort((first, second) => first.difficultyIndex - second.difficultyIndex)
			.slice(0, 10);
	}, [reportRows]);

	const reportKpis = useMemo(() => {
		const avgDifficulty = average(reportRows.map((row) => row.difficultyIndex));
		const avgDiscrimination = average(reportRows.map((row) => row.discriminationIndex));
		const fromResults = (itemAnalysisData?.studentResults ?? []).map((r) => toNumber(r.totalScore));
		let meanScore = fromResults.length ? average(fromResults) : 0;
		let totalScore = fromResults.length ? fromResults.reduce((sum, s) => sum + s, 0) : 0;
		if (!fromResults.length) {
			const fromItemResults = (itemAnalysisData?.studentItemResults ?? []).map((r) => toNumber(r.totalScore));
			if (fromItemResults.length) {
				meanScore = average(fromItemResults);
				totalScore = fromItemResults.reduce((sum, s) => sum + s, 0);
			} else if (reportRows.length) {
				const derivedMean = reportRows.reduce((sum, r) => sum + r.difficultyIndex, 0);
				meanScore = derivedMean;
				totalScore = derivedMean * (analysisRespondentCount || 1);
			} else {
				const rosterScores = rosterStudents.map((student) => toNumber(student.average));
				if (rosterScores.length) {
					meanScore = average(rosterScores);
					totalScore = rosterScores.reduce((sum, s) => sum + s, 0);
				}
			}
		}
		return {
			meanScore,
			totalScore,
			mps: avgDifficulty * 100,
			difficultyAverage: avgDifficulty,
			discriminationAverage: avgDiscrimination
		};
	}, [reportRows, rosterStudents, itemAnalysisData?.studentResults, itemAnalysisData?.studentItemResults]);

	const contextToken = useMemo(() => {
		const classToken = (resolvedClass || 'Class').replace(/\s+/g, '-');
		const subjectToken = (resolvedSubject || 'Subject').replace(/\s+/g, '-');
		const quarterToken = (resolvedQuarter || 'Quarter').replace(/\s+/g, '-');
		return `${classToken}_${subjectToken}_${quarterToken}`;
	}, [resolvedClass, resolvedSubject, resolvedQuarter]);

	const updatedAtLabel = lastUpdatedAt;

	const handleDownloadItemAnalysisMatrix = useCallback(() => {
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
	}, [contextToken, reportRows]);

	const handleDownloadClassSummary = useCallback(() => {
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
	}, [contextToken, resolvedClass, resolvedSubject, resolvedQuarter, scoreSummary, reportKpis]);

	const handleDownloadStudentRanking = useCallback(() => {
		const scoreByName = new Map<string, number>();
		const totalItems = itemAnalysisData?.rows?.length ?? 0;
		(itemAnalysisData?.studentItemResults ?? []).forEach((r) => {
			const key = normalizeStudentIdentityToken(r.studentName ?? '');
			if (key) scoreByName.set(key, Number(r.totalScore) || 0);
		});
		(itemAnalysisData?.studentResults ?? []).forEach((r) => {
			const key = normalizeStudentIdentityToken(r.studentName ?? '');
			if (key && !scoreByName.has(key)) scoreByName.set(key, Number(r.totalScore) || 0);
		});

		const sortedStudents = [...rosterStudents]
			.sort((first, second) => (Number(first.ranking) || 0) - (Number(second.ranking) || 0));

		downloadCsvFile(
			`student-ranking_${contextToken}.csv`,
			['Rank', 'Name', 'Grade', 'Section', 'Subject', 'Average'],
			sortedStudents.map((student) => {
				const nameKey = normalizeStudentIdentityToken(`${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || student.name);
				const rawScore = nameKey ? scoreByName.get(nameKey) : undefined;
				const average = rawScore !== undefined && totalItems > 0
					? `${(rawScore / totalItems * 100).toFixed(1)}%`
					: student.average;
				return [
					student.ranking,
					student.name,
					student.grade,
					student.section,
					student.subject,
					average
				];
			})
		);
	}, [contextToken, rosterStudents, itemAnalysisData]);

	const handleDownloadInterventionList = useCallback(() => {
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
	}, [contextToken, topLeastLearned]);

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
		let analysis = itemAnalysisData;
		const filterKey = `${selectedClass}|${selectedSubject}|${selectedQuarter}`;
		const lastFilter = sessionStorage.getItem('wordReportFilter');
		if (!analysis?.rows?.length || lastFilter !== filterKey) {
			try {
				const [analysisPayload, studentsPayload] = await Promise.all([
					getItemAnalysisData(selectedClass, selectedSubject, selectedQuarter),
					getStudentManagementData()
				]);
				setItemAnalysisData(analysisPayload);
				setStudents(studentsPayload.students ?? []);
				sessionStorage.setItem('wordReportFilter', filterKey);
				analysis = analysisPayload;
			} catch {
				return;
			}
		}
		const rows = analysis?.rows ?? [];
		const schoolYear = new Date().getFullYear();
		const classLabel = resolvedClass || 'N/A';
		const parsedClass = parseClassLabel(classLabel);
		const gradeSection = parsedClass.section ? `${parsedClass.grade}/${parsedClass.section}` : classLabel;

		const numItems = rows.length;

		const itemResultStats = new Map<number, { correctCount: number; totalCount: number }>();
		(analysis?.studentItemResults ?? []).forEach((sr) => {
			(sr.itemResults ?? []).forEach((ir) => {
				const itemNo = Number(ir.itemNo);
				if (!Number.isFinite(itemNo)) return;
				const current = itemResultStats.get(itemNo) ?? { correctCount: 0, totalCount: 0 };
				current.totalCount += 1;
				if (String(ir.interpretation ?? '').trim().toLowerCase() === 'correct') {
					current.correctCount += 1;
				}
				itemResultStats.set(itemNo, current);
			});
		});

		const analysisRows = rows.map((row, i) => {
			const itemNo = Number(row.itemNo) || i + 1;
			const diff = parseIndexValue(row.difficultyIndex) ?? 0;
			const disc = parseIndexValue(row.discriminationIndex) ?? 0;
			const difficultyLabel = row.difficultyLabel || getDifficultyLabel(diff);
			const decision = computeDecision(row.difficultyIndex, row.discriminationIndex);
			const stats = itemResultStats.get(itemNo) ?? { correctCount: 0, totalCount: 0 };
			const itemResult = stats.totalCount > 0 ? `${stats.correctCount}/${stats.totalCount}` : row.interpretation || '';
			return `<tr><td>${itemNo}</td><td>${diff.toFixed(2)}</td><td>${difficultyLabel}</td><td>${disc.toFixed(2)}</td><td>${itemResult}</td><td>${row.interpretation || ''}</td><td>${decision}</td></tr>`;
		}).join('');

		const takers = (analysis?.studentItemResults ?? analysis?.studentResults ?? []).length;
		const totalStudentsNum = Number(analysis?.totalStudents) || analysis?.studentIdentityLinks?.length || takers || 0;
		const topBottomCount = takers > 0 ? Math.max(1, Math.round(takers * 0.27)) : 0;

		const sortedRows = [...(analysis?.rows ?? [])].map((r, i) => ({
			itemNo: Number(r.itemNo) || i + 1,
			diffValue: parseIndexValue(r.difficultyIndex) ?? 0
		})).sort((a, b) => b.diffValue - a.diffValue);
		const mostLearned = sortedRows.slice(0, 10);
		const leastLearned = [...sortedRows].reverse().slice(0, 10);

		const wordTosMap = getTosCompetencyMap(resolvedClass, resolvedSubject, resolvedQuarter);

		const mostRows = mostLearned.map((item) => {
			const entry = selectedLinkedRecord?.analysisEntries[item.itemNo - 1];
			const tosCompetency = wordTosMap.get(item.itemNo);
			const contentArea = entry?.contentArea || tosCompetency || 'Not specified';
			return `<tr><td>${item.itemNo}</td><td class="left">${contentArea}</td></tr>`;
		}).join('');

		const leastRows = leastLearned.map((item) => {
			const entry = selectedLinkedRecord?.analysisEntries[item.itemNo - 1];
			const tosCompetency = wordTosMap.get(item.itemNo);
			const contentArea = entry?.contentArea || tosCompetency || 'Not specified';
			const intervention = entry?.intervention || (contentArea !== 'Not specified' ? `Remediation on ${contentArea}` : 'General remediation');
			return `<tr><td>${item.itemNo}</td><td class="left">${contentArea}</td><td class="left">${intervention}</td></tr>`;
		}).join('');

		const scores = (analysis?.studentResults ?? analysis?.studentItemResults ?? [])
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

		const now = new Date();
		const html = `
			<div style="text-align:center;margin-bottom:6px;">
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_REGION}</div>
				<div style="font-size:12pt;font-weight:700;">${SCHOOL_DIVISION}</div>
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_DISTRICT}</div>
				<div style="font-size:13pt;font-weight:700;margin-top:4px;">${SCHOOL_NAME}</div>
				<div style="font-size:11pt;font-weight:700;margin-top:6px;">Item Analysis in ${resolvedSubject || 'N/A'} for ${gradeSection}</div>
				<div style="font-size:11pt;">SY ${schoolYear} - ${schoolYear + 1}</div>
			</div>

			<hr style="border:1px solid #000;margin:4px 0;"/>

			<table style="width:100%;border:none;margin:4px 0 8px;">
				<tr style="border:none;">
					<td style="border:none;width:50%;vertical-align:top;">
						<table style="border-collapse:collapse;font-size:9pt;width:100%;">
							<tr><td style="border:1px solid #000;padding:3px 6px;font-weight:700;background:#d9e1f2;" colspan="2">Summary</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">Total No. of Students</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${totalStudentsNum}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">Number of Takers</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${takers}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">No. of Highest Scorers (27%)</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${topBottomCount}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">No. of Lowest Scorers (27%)</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${topBottomCount}</td></tr>
						</table>
					</td>
					<td style="border:none;width:50%;vertical-align:top;text-align:right;">
						<div style="font-size:10pt;font-weight:700;margin-top:4px;">Quarter: ${resolvedQuarter || 'N/A'}</div>
					</td>
				</tr>
			</table>

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

			<div class="section">II. Top 10 Most Learned Test Items</div>
			<table><thead><tr><th>Item No</th><th>Content Area</th></tr></thead><tbody>${mostRows || '<tr><td colspan="2">No items available.</td></tr>'}</tbody></table>

			<div class="section">III. Top 10 Least Learned Test Items</div>
			<table><thead><tr><th>Item No</th><th>Content Area</th><th>Intervention</th></tr></thead><tbody>${leastRows || '<tr><td colspan="3">No items available.</td></tr>'}</tbody></table>

			<br/>
			<div class="section">IV. Certification</div>
			<table style="width:100%;border:none;margin-top:6px;">
				<tr style="border:none;">
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Prepared by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">EUGENE F. DIMALANTA</div>
						<div style="font-size:8pt;margin-top:1px;">SPET I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Reviewed &amp; Checked by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">WILLIAM D. GARCIA, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">Master Teacher I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Contents Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MILLETTE B. SARMIENTO, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">OIC-Asst. Principal</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MARCIAL D. MORTERA</div>
						<div style="font-size:8pt;margin-top:1px;">Principal IV</div>
					</td>
				</tr>
			</table>

			<div class="footer">Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | School Year ${schoolYear}-${schoolYear + 1}</div>
		`;

		downloadWordFile(`executive-summary_${contextToken}.doc`, html);
	};

	const handleGenerateItemAnalysisReport = async () => {
		let analysis = itemAnalysisData;
		const filterKey = `${selectedClass}|${selectedSubject}|${selectedQuarter}`;
		const lastFilter = sessionStorage.getItem('wordReportFilter');
		if (!analysis?.rows?.length || lastFilter !== filterKey) {
			try {
				const [analysisPayload] = await Promise.all([
					getItemAnalysisData(selectedClass, selectedSubject, selectedQuarter)
				]);
				setItemAnalysisData(analysisPayload);
				sessionStorage.setItem('wordReportFilter', filterKey);
				analysis = analysisPayload;
			} catch {
				return;
			}
		}
		const rows = analysis?.rows ?? [];
		const schoolYear = new Date().getFullYear();
		const classLabel = resolvedClass || 'N/A';
		const parsedClass = parseClassLabel(classLabel);
		const gradeSection = parsedClass.section ? `${parsedClass.grade}/${parsedClass.section}` : classLabel;

		const numItems = rows.length;

		const itemResultStats = new Map<number, { correctCount: number; totalCount: number }>();
		(analysis?.studentItemResults ?? []).forEach((sr) => {
			(sr.itemResults ?? []).forEach((ir) => {
				const itemNo = Number(ir.itemNo);
				if (!Number.isFinite(itemNo)) return;
				const current = itemResultStats.get(itemNo) ?? { correctCount: 0, totalCount: 0 };
				current.totalCount += 1;
				if (String(ir.interpretation ?? '').trim().toLowerCase() === 'correct') {
					current.correctCount += 1;
				}
				itemResultStats.set(itemNo, current);
			});
		});

		const analysisRows = rows.map((row, i) => {
			const itemNo = Number(row.itemNo) || i + 1;
			const diff = parseIndexValue(row.difficultyIndex) ?? 0;
			const disc = parseIndexValue(row.discriminationIndex) ?? 0;
			const difficultyLabel = row.difficultyLabel || getDifficultyLabel(diff);
			const decision = computeDecision(row.difficultyIndex, row.discriminationIndex);
			const stats = itemResultStats.get(itemNo) ?? { correctCount: 0, totalCount: 0 };
			const itemResult = stats.totalCount > 0 ? `${stats.correctCount}/${stats.totalCount}` : row.interpretation || '';
			return `<tr><td>${itemNo}</td><td>${diff.toFixed(2)}</td><td>${difficultyLabel}</td><td>${disc.toFixed(2)}</td><td>${itemResult}</td><td>${row.interpretation || ''}</td><td>${decision}</td></tr>`;
		}).join('');

		const takers = (analysis?.studentItemResults ?? analysis?.studentResults ?? []).length;
		const totalStudentsNum = Number(analysis?.totalStudents) || analysis?.studentIdentityLinks?.length || takers || 0;
		const topBottomCount = takers > 0 ? Math.max(1, Math.round(takers * 0.27)) : 0;

		const scores = (analysis?.studentResults ?? analysis?.studentItemResults ?? [])
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

		const now = new Date();
		const html = `
			<div style="text-align:center;margin-bottom:6px;">
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_REGION}</div>
				<div style="font-size:12pt;font-weight:700;">${SCHOOL_DIVISION}</div>
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_DISTRICT}</div>
				<div style="font-size:13pt;font-weight:700;margin-top:4px;">${SCHOOL_NAME}</div>
				<div style="font-size:11pt;font-weight:700;margin-top:6px;">Item Analysis Report in ${resolvedSubject || 'N/A'} for ${gradeSection}</div>
				<div style="font-size:11pt;">SY ${schoolYear} - ${schoolYear + 1}</div>
			</div>

			<hr style="border:1px solid #000;margin:4px 0;"/>

			<table style="width:100%;border:none;margin:4px 0 8px;">
				<tr style="border:none;">
					<td style="border:none;width:50%;vertical-align:top;">
						<table style="border-collapse:collapse;font-size:9pt;width:100%;">
							<tr><td style="border:1px solid #000;padding:3px 6px;font-weight:700;background:#d9e1f2;" colspan="2">Summary</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">Total No. of Students</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${totalStudentsNum}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">Number of Takers</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${takers}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">No. of Highest Scorers (27%)</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${topBottomCount}</td></tr>
							<tr><td style="border:1px solid #000;padding:2px 6px;">No. of Lowest Scorers (27%)</td><td style="border:1px solid #000;padding:2px 6px;font-weight:700;text-align:center;">${topBottomCount}</td></tr>
						</table>
					</td>
					<td style="border:none;width:50%;vertical-align:top;text-align:right;">
						<div style="font-size:10pt;font-weight:700;margin-top:4px;">Quarter: ${resolvedQuarter || 'N/A'}</div>
					</td>
				</tr>
			</table>

			<div class="section">I. Item Analysis Matrix</div>
			<table><thead><tr><th>Item No</th><th>Difficulty Index</th><th>Difficulty</th><th>Discrimination Index</th><th>Item Result</th><th>Interpretation</th><th>Decision</th></tr></thead><tbody>${analysisRows || '<tr><td colspan="7" style="text-align:center;">No item analysis data available.</td></tr>'}</tbody></table>

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

			<br/>
			<div class="section">IV. Certification</div>
			<table style="width:100%;border:none;margin-top:6px;">
				<tr style="border:none;">
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Prepared by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">EUGENE F. DIMALANTA</div>
						<div style="font-size:8pt;margin-top:1px;">SPET I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Reviewed &amp; Checked by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">WILLIAM D. GARCIA, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">Master Teacher I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Contents Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MILLETTE B. SARMIENTO, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">OIC-Asst. Principal</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MARCIAL D. MORTERA</div>
						<div style="font-size:8pt;margin-top:1px;">Principal IV</div>
					</td>
				</tr>
			</table>

			<div class="footer">Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | School Year ${schoolYear}-${schoolYear + 1}</div>
		`;

		downloadWordFile(`item-analysis-report_${contextToken}.doc`, html);
	};

	const handleGenerateTosReport = () => {
		const schoolYear = getCurrentSchoolYear();

		const draftKey = [
			'teacher-tos-builder-draft',
			normalizeTextToken(resolvedClass),
			normalizeTextToken(resolvedSubject),
			normalizeQuarterForLookup(resolvedQuarter)
		].join('::');
		const raw = localStorage.getItem(draftKey) ?? localStorage.getItem('teacher-tos-builder-draft');
		let draft: {
			rows?: Array<{
				competency?: string;
				days?: number;
				percentage?: number;
				counts?: Partial<Record<'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating', number>>;
			}>;
			totalDays?: number;
			totalItems?: number;
			objectiveCount?: number;
			bloomWeights?: Partial<Record<'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating', number>>;
		} | null = null;
		if (raw) {
			try {
				const parsed = JSON.parse(raw);
				if (
					normalizeTextToken(String(parsed.classValue ?? '')) === normalizeTextToken(resolvedClass) &&
					normalizeTextToken(String(parsed.subject ?? '')) === normalizeTextToken(resolvedSubject) &&
					normalizeQuarterForLookup(String(parsed.quarter ?? '')) === normalizeQuarterForLookup(resolvedQuarter)
				) {
					draft = parsed;
				}
			} catch {
				// ignore parse errors
			}
		}

		const rows = draft?.rows ?? [];
		const bloomOrder = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'] as const;
		const bloomLabels: Record<string, string> = { remembering: 'Rem', understanding: 'Und', applying: 'App', analyzing: 'Anl', evaluating: 'Eva', creating: 'Cre' };

		let pointer = 1;
		const placements: Record<number, Record<string, string>> = {};
		rows.forEach((_row, rowIndex) => {
			const p: Record<string, string> = {};
			bloomOrder.forEach((key) => {
				const count = Number((_row as any).counts?.[key] ?? 0);
				if (count <= 0) {
					p[key] = '-';
					return;
				}
				const values: number[] = [];
				for (let i = 0; i < count; i += 1) {
					values.push(pointer);
					pointer += 1;
				}
				p[key] = values.join(', ');
			});
			placements[rowIndex] = p;
		});

		const tosRows = rows.map((row, rowIndex) => {
			const cells = bloomOrder.map((key) => {
				const count = Number((row as any).counts?.[key] ?? 0) || 0;
				const poi = placements[rowIndex]?.[key] ?? '-';
				return `<td>${count || ''}</td><td>${poi}</td>`;
			}).join('');
			const total = bloomOrder.reduce((sum, key) => sum + (Number((row as any).counts?.[key] ?? 0) || 0), 0);
			return `<tr><td class="left">${row.competency || ''}</td><td>${row.days ?? ''}</td><td>${row.percentage !== undefined ? Number(row.percentage).toFixed(1) : ''}</td>${cells}<td>${total || ''}</td></tr>`;
		}).join('');

		const classLabel = resolvedClass || 'N/A';
		const parsedClass = parseClassLabel(classLabel);
		const gradeSection = parsedClass.section ? `${parsedClass.grade}/${parsedClass.section}` : classLabel;

		const summaryRows = draft ? [
			`<tr><td colspan="3" style="border:1px solid #000;padding:2px 6px;font-weight:700;">Total Days</td><td colspan="13" style="border:1px solid #000;padding:2px 6px;">${draft.totalDays ?? 0}</td></tr>`,
			`<tr><td colspan="3" style="border:1px solid #000;padding:2px 6px;font-weight:700;">Total Items</td><td colspan="13" style="border:1px solid #000;padding:2px 6px;">${draft.totalItems ?? 0}</td></tr>`,
			`<tr><td colspan="3" style="border:1px solid #000;padding:2px 6px;font-weight:700;">No. of Objectives</td><td colspan="13" style="border:1px solid #000;padding:2px 6px;">${draft.objectiveCount ?? 0}</td></tr>`,
			`<tr><td colspan="3" style="border:1px solid #000;padding:2px 6px;font-weight:700;">Bloom's Weights</td><td colspan="13" style="border:1px solid #000;padding:2px 6px;">${bloomOrder.map((k) => `${bloomLabels[k]}: ${(draft as any).bloomWeights?.[k] ?? 0}`).join(' | ')}</td></tr>`
		].join('') : '';

		const noDataRow = '<tr><td colspan="16" style="text-align:center;">No TOS data available. Create a TOS in the TOS Builder for this class, subject, and quarter.</td></tr>';

		const now = new Date();
		const html = `
			<div style="text-align:center;margin-bottom:6px;">
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_REGION}</div>
				<div style="font-size:12pt;font-weight:700;">${SCHOOL_DIVISION}</div>
				<div style="font-size:11pt;font-weight:700;">${SCHOOL_DISTRICT}</div>
				<div style="font-size:13pt;font-weight:700;margin-top:4px;">${SCHOOL_NAME}</div>
				<div style="font-size:11pt;font-weight:700;margin-top:6px;">Table of Specifications in ${resolvedSubject || 'N/A'} for ${gradeSection}</div>
				<div style="font-size:11pt;">SY ${schoolYear}</div>
			</div>

			<hr style="border:1px solid #000;margin:4px 0;"/>

			<div style="font-size:10pt;font-weight:700;margin:4px 0;">Quarter: ${resolvedQuarter || 'N/A'}</div>

			<div class="section">Table of Specifications</div>
			<table><thead><tr><th style="border:1px solid #000;padding:3px 6px;">Competency</th><th style="border:1px solid #000;padding:3px 6px;">Days</th><th style="border:1px solid #000;padding:3px 6px;">%</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.remembering}</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.understanding}</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.applying}</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.analyzing}</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.evaluating}</th><th style="border:1px solid #000;padding:3px 6px;" colspan="2">${bloomLabels.creating}</th><th style="border:1px solid #000;padding:3px 6px;">Total</th></tr><tr><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;"> </th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;"> </th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;"> </th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">NOI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;">POI</th><th style="border:1px solid #000;padding:2px 4px;font-size:8pt;"> </th></tr></thead><tbody>${tosRows || noDataRow}</tbody></table>

			${summaryRows ? `
			<br/>
			<div class="section">Summary</div>
			<table style="width:100%;border-collapse:collapse;font-size:9pt;">${summaryRows}</table>` : ''}

			<br/>
			<div class="section">IV. Certification</div>
			<table style="width:100%;border:none;margin-top:6px;">
				<tr style="border:none;">
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Prepared by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">EUGENE F. DIMALANTA</div>
						<div style="font-size:8pt;margin-top:1px;">SPET I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Reviewed &amp; Checked by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">WILLIAM D. GARCIA, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">Master Teacher I</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Contents Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MILLETTE B. SARMIENTO, EdD</div>
						<div style="font-size:8pt;margin-top:1px;">OIC-Asst. Principal</div>
					</td>
					<td style="border:none;width:25%;text-align:center;vertical-align:bottom;">
						<div style="margin-top:46px;border-top:1px solid #000;display:inline-block;padding:0 8px;font-size:9pt;font-weight:700;white-space:nowrap;">Noted by:</div>
						<div style="font-size:8pt;font-weight:700;margin-top:4px;white-space:nowrap;">MARCIAL D. MORTERA</div>
						<div style="font-size:8pt;margin-top:1px;">Principal IV</div>
					</td>
				</tr>
			</table>

			<div class="footer">Generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | School Year ${schoolYear}</div>
		`;

		downloadWordFile(`tos-report_${contextToken}.doc`, html);
	};

	const downloadableReports = useMemo<DownloadableReport[]>(() => {
		return [
			{
				id: 'item-analysis-matrix',
				title: 'Item Analysis Matrix',
				description: 'Per-item difficulty, discrimination, and decision summary for your selected class.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download',
				onDownload: handleDownloadItemAnalysisMatrix
			},
			{
				id: 'class-performance-summary',
				title: 'Class Performance Summary',
				description: 'Class-level performance totals, mean score, MPS, and pass/fail counts.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download',
				onDownload: handleDownloadClassSummary
			},
			{
				id: 'student-ranking-list',
				title: 'Student Ranking Sheet',
				description: 'Student ranking and average scores for the selected class and subject.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download',
				onDownload: handleDownloadStudentRanking
			},
			{
				id: 'least-learned-interventions',
				title: 'Least Learned With Interventions',
				description: 'Targeted least-learned items with linked content-area gaps and interventions.',
				updatedAt: updatedAtLabel,
				downloadLabel: 'Download',
				onDownload: handleDownloadInterventionList
			}
		];
	}, [
		updatedAtLabel,
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

				setLastUpdatedAt(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
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
				setLastUpdatedAt(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
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
					<span>{data?.viewLabel ?? 'Teacher View'}</span>
				</div>
			</section>

			<p className="teacher-page-subtitle">
				{data?.subtitle ?? 'Generate and download reports for your classes and student performance'}
			</p>

			{loading ? <p className="teacher-status">Loading reports...</p> : null}
			{error ? <p className="teacher-status teacher-status-error">{error}</p> : null}


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
					<h3>Executive Summary</h3>
					<p>Combines item analysis data and Table of Specifications into one comprehensive report with certification.</p>
					<button type="button" onClick={handleGenerateWordReport}>Generate Report</button>
				</article>
				<article className="reports-action-card green">
					<h3>Item Analysis Report</h3>
					<p>Item-level analysis with difficulty, discrimination, and decision summary for your selected class.</p>
					<button type="button" onClick={handleGenerateItemAnalysisReport}>Generate Report</button>
				</article>
				<article className="reports-action-card blue">
					<h3>Table of Specifications</h3>
					<p>Competency-based breakdown with content areas, item placement, and item distribution.</p>
					<button type="button" onClick={handleGenerateTosReport}>Generate Report</button>
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
									<button type="button" onClick={report.onDownload}>{report.downloadLabel}</button>
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
