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
	const [generatingReport, setGeneratingReport] = useState(false);
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

	const summaryOfResults = useMemo(() => {
		const buckets = {
			accepted: 0,
			slightRevision: 0,
			revision: 0,
			majorRevision: 0,
			needMajor: 0,
			discard: 0
		};

		reportRows.forEach((row) => {
			if (row.decision === 'Accepted') buckets.accepted += 1;
			else if (row.decision === 'Accepted with slight revision') buckets.slightRevision += 1;
			else if (row.decision === 'Accepted with revision') buckets.revision += 1;
			else if (row.decision === 'May be accepted with major revision') buckets.majorRevision += 1;
			else if (row.decision === 'Needs major revision') buckets.needMajor += 1;
			else buckets.discard += 1;
		});

		return buckets;
	}, [reportRows]);

	const topMostLearned = useMemo(() => {
		return [...entryDrivenRows]
			.sort((first, second) => second.difficultyIndex - first.difficultyIndex)
			.slice(0, 10);
	}, [entryDrivenRows]);

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

	const handlePrintReport = () => {
		window.print();
	};

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

	const handleGenerateReport = async () => {
		setGeneratingReport(true);
		setReportError(null);

		try {
			const [analysisPayload, studentsPayload] = await Promise.all([
				getItemAnalysisData(selectedClass, selectedSubject),
				getStudentManagementData()
			]);

			setItemAnalysisData(analysisPayload);
			setStudents(studentsPayload.students ?? []);
		} catch (loadError) {
			setReportError(loadError instanceof Error ? loadError.message : 'Unable to build print report.');
		} finally {
			setGeneratingReport(false);
		}
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
					getItemAnalysisData(),
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
					<button type="button" className="teacher-filter-apply-btn" onClick={handleGenerateReport} disabled={generatingReport}>
						{generatingReport ? 'Generating...' : 'Generate'}
					</button>
				</div>
			</section>

			<div className="reports-action-grid no-print">
				<article className="reports-action-card">
					<h3>Executive Summary</h3>
					<p>Generate an updated class summary based on selected filters.</p>
					<button type="button" onClick={handleGenerateReport} disabled={generatingReport}>
						{generatingReport ? 'Generating...' : 'Generate Report'}
					</button>
				</article>
				<article className="reports-action-card blue">
					<h3>Printable Item Analysis</h3>
					<p>Open a print-ready layout for formal documentation and records.</p>
					<button type="button" onClick={handlePrintReport} disabled={!hasReportData}>Print Report</button>
				</article>
				<article className="reports-action-card green">
					<h3>Student Ranking Sheet</h3>
					<p>Download a ranking list with student averages for your class.</p>
					<button type="button" onClick={handleDownloadStudentRanking} disabled={!hasStudentData}>Download CSV</button>
				</article>
			</div>

			<section className="teacher-panel printable-report-sheet print-only" aria-label="Printable report layout">
				<header className="print-report-header">
					<div className="print-report-logo">KES</div>
					<div className="print-report-header-copy">
						<p>Department of Education - Region III</p>
						<p>Division of Olongapo</p>
						<p>KALALAKE ELEMENTARY SCHOOL</p>
						<h3>Item Analysis in the selected class and subject</h3>
						<strong>{resolvedClass || 'Class'} | {resolvedSubject || 'Subject'} | SY {selectedLinkedRecord?.schoolYear || 'N/A'}</strong>
					</div>
					<div className="print-report-logo">DepEd</div>
				</header>

				<div className="print-report-summary-grid">
					<div>
						<p>Total students</p>
						<strong>{scoreSummary.totalStudents}</strong>
					</div>
					<div>
						<p>Top 27% scorers</p>
						<strong>{scoreSummary.top27Count}</strong>
					</div>
					<div>
						<p>Lowest 27% scorers</p>
						<strong>{scoreSummary.top27Count}</strong>
					</div>
					<div>
						<p>Grading period</p>
						<strong>{(resolvedQuarter || 'FIRST').toUpperCase()}</strong>
					</div>
				</div>
				{scoreSummary.respondentCount !== scoreSummary.totalStudents ? (
					<p className="teacher-status">
						Analysis respondents: {scoreSummary.respondentCount} | Enrolled class size: {scoreSummary.totalStudents}
					</p>
				) : null}

				<div className="teacher-table-wrap print-report-main-table">
					<table className="teacher-table print-report-table">
						<thead>
							<tr>
								<th>Item</th>
								<th>Total Correct</th>
								<th>Difficulty Index</th>
								<th>Difficulty Interpretation</th>
								<th>Discrimination Index</th>
								<th>Discrimination Interpretation</th>
								<th>Decision</th>
							</tr>
						</thead>
						<tbody>
							{reportRows.map((row) => (
								<tr key={`report-row-${row.itemNo}`}>
									<td>{row.itemNo}</td>
									<td>{row.totalCorrect}</td>
									<td>{row.difficultyIndex.toFixed(2)}</td>
									<td>{row.difficultyLabel}</td>
									<td>{row.discriminationIndex.toFixed(2)}</td>
									<td>{row.discriminationLabel}</td>
									<td>{row.decision}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<section className="print-report-result-summary">
					<h4>Summary of Results</h4>
					<div className="print-report-result-grid">
						<p>1. Accepted as is <strong>{summaryOfResults.accepted}</strong></p>
						<p>2. Accepted with very slight revision <strong>{summaryOfResults.slightRevision}</strong></p>
						<p>3. Accepted with slight revision <strong>{summaryOfResults.revision}</strong></p>
						<p>4. May be accepted with minor revision <strong>{summaryOfResults.majorRevision}</strong></p>
						<p>5. Needs major revision <strong>{summaryOfResults.needMajor}</strong></p>
						<p>6. Totally discard <strong>{summaryOfResults.discard}</strong></p>
					</div>
				</section>

				<section className="print-report-split">
					<div className="teacher-table-wrap">
						<h4>Top 10 Most Learned Test Items</h4>
						{topMostLearned.length ? (
							<table className="teacher-table print-report-table compact">
								<thead>
									<tr>
										<th>#</th>
										<th>Item Number</th>
										<th>Content Area</th>
									</tr>
								</thead>
								<tbody>
									{topMostLearned.map((row, index) => (
										<tr key={`most-${row.itemNo}`}>
											<td>{index + 1}</td>
											<td>{row.itemNo}</td>
											<td>{row.contentArea}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className="teacher-status">No learned-item entries found for this selection.</p>
						)}
					</div>

					<div className="teacher-table-wrap">
						<h4>Top 10 Least Learned Test Items</h4>
						{topLeastLearned.length ? (
							<table className="teacher-table print-report-table compact">
								<thead>
									<tr>
										<th>#</th>
										<th>Item Number</th>
										<th>Content Area</th>
										<th>Intervention</th>
									</tr>
								</thead>
								<tbody>
									{topLeastLearned.map((row, index) => (
										<tr key={`least-${row.itemNo}`}>
											<td>{index + 1}</td>
											<td>{row.itemNo}</td>
											<td>{row.contentArea}</td>
											<td>{row.intervention}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className="teacher-status">No least-learned entries found for this selection.</p>
						)}
					</div>
				</section>

				<footer className="print-report-footer-grid">
					<div><p>Highest score</p><strong>{scoreSummary.highest.toFixed(1)}</strong></div>
					<div><p>Lowest score</p><strong>{scoreSummary.lowest.toFixed(1)}</strong></div>
					<div><p>Mean</p><strong>{reportKpis.meanScore.toFixed(2)}</strong></div>
					<div><p>MPS</p><strong>{reportKpis.mps.toFixed(2)}%</strong></div>
					<div><p>Total Score</p><strong>{reportKpis.totalScore.toFixed(0)}</strong></div>
					<div><p>Passing</p><strong>{scoreSummary.passCount}</strong></div>
					<div><p>Failing</p><strong>{scoreSummary.failCount}</strong></div>
				</footer>
			</section>

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
