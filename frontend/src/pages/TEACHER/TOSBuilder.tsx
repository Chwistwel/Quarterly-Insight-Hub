import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from './TeacherLayout';
import { getUploadMetaData, type UploadMetaResponse } from '../../services/teacherPortalApi';
import '../../styles/TEACHER/TOSBuilder.css';

type BloomKey = 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating';

type TosRow = {
	id: number;
	competency: string;
	days: number;
	percentage: number;
	counts: Record<BloomKey, number>;
};

const BLOOM_ORDER: BloomKey[] = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];

const BLOOM_LABELS: Record<BloomKey, string> = {
	remembering: 'Remembering',
	understanding: 'Understanding',
	applying: 'Applying',
	analyzing: 'Analyzing',
	evaluating: 'Evaluating',
	creating: 'Creating'
};

const DEFAULT_BLOOM_WEIGHTS: Record<BloomKey, number> = {
	remembering: 10,
	understanding: 15,
	applying: 25,
	analyzing: 25,
	evaluating: 20,
	creating: 5
};

const STORAGE_KEY = 'teacher-tos-builder-draft';

function createEmptyRow(index: number): TosRow {
	return {
		id: index + 1,
		competency: `Objective ${index + 1}`,
		days: 0,
		percentage: 0,
		counts: {
			remembering: 0,
			understanding: 0,
			applying: 0,
			analyzing: 0,
			evaluating: 0,
			creating: 0
		}
	};
}

function sanitizeNumber(value: number): number {
	if (!Number.isFinite(value) || Number.isNaN(value)) {
		return 0;
	}
	return Math.max(0, value);
}

function allocateByWeights(total: number, weights: number[]): number[] {
	if (total <= 0 || weights.length === 0) {
		return new Array(weights.length).fill(0);
	}

	const safeWeights = weights.map((weight) => Math.max(0, weight));
	const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0);

	if (weightSum === 0) {
		const evenWeight = new Array(weights.length).fill(1);
		return allocateByWeights(total, evenWeight);
	}

	const rawValues = safeWeights.map((weight) => (weight / weightSum) * total);
	const floored = rawValues.map((value) => Math.floor(value));
	let remainder = total - floored.reduce((sum, value) => sum + value, 0);

	const rankedFractions = rawValues
		.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
		.sort((a, b) => b.fraction - a.fraction);

	for (let i = 0; i < rankedFractions.length && remainder > 0; i += 1) {
		floored[rankedFractions[i].index] += 1;
		remainder -= 1;
	}

	return floored;
}

function buildInitialRows(count: number): TosRow[] {
	return Array.from({ length: count }, (_, index) => createEmptyRow(index));
}

function TOSBuilder() {
	const [schoolYear, setSchoolYear] = useState('2025-2026');
	const [quarter, setQuarter] = useState('1st Quarter');
	const [subject, setSubject] = useState('');
	const [classValue, setClassValue] = useState('');
	const [totalDays, setTotalDays] = useState(48);
	const [totalItems, setTotalItems] = useState(40);
	const [objectiveCount, setObjectiveCount] = useState(8);
	const [rows, setRows] = useState<TosRow[]>(() => buildInitialRows(8));
	const [bloomWeights, setBloomWeights] = useState<Record<BloomKey, number>>(DEFAULT_BLOOM_WEIGHTS);
	const [statusMessage, setStatusMessage] = useState('');
	const [uploadMeta, setUploadMeta] = useState<UploadMetaResponse | null>(null);

	useEffect(() => {
		const loadUploadMeta = async () => {
			try {
				const response = await getUploadMetaData();
				setUploadMeta(response);
			} catch {
				setUploadMeta(null);
			}
		};

		void loadUploadMeta();
	}, []);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) {
				return;
			}

			const draft = JSON.parse(raw) as {
				schoolYear?: string;
				quarter?: string;
				subject?: string;
				classValue?: string;
				totalDays?: number;
				totalItems?: number;
				objectiveCount?: number;
				rows?: TosRow[];
				bloomWeights?: Record<BloomKey, number>;
			};

			if (draft.schoolYear) setSchoolYear(draft.schoolYear);
			if (draft.quarter) setQuarter(draft.quarter);
			if (draft.subject) setSubject(draft.subject);
			if (draft.classValue) setClassValue(draft.classValue);
			if (typeof draft.totalDays === 'number') setTotalDays(sanitizeNumber(draft.totalDays));
			if (typeof draft.totalItems === 'number') setTotalItems(sanitizeNumber(draft.totalItems));
			if (typeof draft.objectiveCount === 'number') setObjectiveCount(Math.max(1, Math.floor(draft.objectiveCount)));

			if (Array.isArray(draft.rows) && draft.rows.length > 0) {
				setRows(draft.rows.map((row, index) => ({
					id: index + 1,
					competency: row.competency || `Objective ${index + 1}`,
					days: sanitizeNumber(row.days),
					percentage: sanitizeNumber(row.percentage),
					counts: {
						remembering: sanitizeNumber(row.counts?.remembering ?? 0),
						understanding: sanitizeNumber(row.counts?.understanding ?? 0),
						applying: sanitizeNumber(row.counts?.applying ?? 0),
						analyzing: sanitizeNumber(row.counts?.analyzing ?? 0),
						evaluating: sanitizeNumber(row.counts?.evaluating ?? 0),
						creating: sanitizeNumber(row.counts?.creating ?? 0)
					}
				})));
			}

			if (draft.bloomWeights) {
				setBloomWeights({
					remembering: sanitizeNumber(draft.bloomWeights.remembering ?? DEFAULT_BLOOM_WEIGHTS.remembering),
					understanding: sanitizeNumber(draft.bloomWeights.understanding ?? DEFAULT_BLOOM_WEIGHTS.understanding),
					applying: sanitizeNumber(draft.bloomWeights.applying ?? DEFAULT_BLOOM_WEIGHTS.applying),
					analyzing: sanitizeNumber(draft.bloomWeights.analyzing ?? DEFAULT_BLOOM_WEIGHTS.analyzing),
					evaluating: sanitizeNumber(draft.bloomWeights.evaluating ?? DEFAULT_BLOOM_WEIGHTS.evaluating),
					creating: sanitizeNumber(draft.bloomWeights.creating ?? DEFAULT_BLOOM_WEIGHTS.creating)
				});
			}
		} catch {
			setStatusMessage('Previous draft could not be loaded.');
		}
	}, []);

	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				schoolYear,
				quarter,
				subject,
				classValue,
				totalDays,
				totalItems,
				objectiveCount,
				rows,
				bloomWeights
			})
		);
	}, [schoolYear, quarter, subject, classValue, totalDays, totalItems, objectiveCount, rows, bloomWeights]);

	useEffect(() => {
		setRows((currentRows) => {
			const targetCount = Math.max(1, objectiveCount);
			if (currentRows.length === targetCount) {
				return currentRows;
			}

			return Array.from({ length: targetCount }, (_, index) => {
				const existing = currentRows[index];
				if (existing) {
					return { ...existing, id: index + 1, competency: existing.competency || `Objective ${index + 1}` };
				}
				return createEmptyRow(index);
			});
		});
	}, [objectiveCount]);

	const subjectOptions = useMemo(() => {
		if (!classValue) {
			return uploadMeta?.subjects ?? [];
		}
		return uploadMeta?.classSubjectMap?.[classValue] ?? uploadMeta?.subjects ?? [];
	}, [classValue, uploadMeta?.classSubjectMap, uploadMeta?.subjects]);

	const rowTotals = useMemo(
		() => rows.map((row) => BLOOM_ORDER.reduce((sum, key) => sum + row.counts[key], 0)),
		[rows]
	);

	const bloomTotals = useMemo(() => {
		const totals: Record<BloomKey, number> = {
			remembering: 0,
			understanding: 0,
			applying: 0,
			analyzing: 0,
			evaluating: 0,
			creating: 0
		};

		rows.forEach((row) => {
			BLOOM_ORDER.forEach((key) => {
				totals[key] += row.counts[key];
			});
		});

		return totals;
	}, [rows]);

	const totalAllocatedItems = useMemo(
		() => rowTotals.reduce((sum, value) => sum + value, 0),
		[rowTotals]
	);

	const totalAllocatedPercentage = useMemo(
		() => rows.reduce((sum, row) => sum + row.percentage, 0),
		[rows]
	);

	const itemPlacements = useMemo(() => {
		let pointer = 1;
		const placementRows: Record<BloomKey, string>[] = rows.map(() => ({
			remembering: '',
			understanding: '',
			applying: '',
			analyzing: '',
			evaluating: '',
			creating: ''
		}));

		rows.forEach((row, rowIndex) => {
			BLOOM_ORDER.forEach((key) => {
				const count = row.counts[key];
				if (count <= 0) {
					placementRows[rowIndex][key] = '-';
					return;
				}

				const values: number[] = [];
				for (let i = 0; i < count; i += 1) {
					values.push(pointer);
					pointer += 1;
				}

				placementRows[rowIndex][key] = values.join(', ');
			});
		});

		return placementRows;
	}, [rows]);

	const automatedReadiness = totalAllocatedItems === totalItems && Math.round(totalAllocatedPercentage) === 100;

	const updateRow = (rowIndex: number, updater: (row: TosRow) => TosRow) => {
		setRows((currentRows) => {
			const copy = [...currentRows];
			copy[rowIndex] = updater(copy[rowIndex]);
			return copy;
		});
	};

	const handleAutoPercentByDays = () => {
		const safeTotalDays = Math.max(1, totalDays);
		setRows((currentRows) =>
			currentRows.map((row) => ({
				...row,
				percentage: Number(((row.days / safeTotalDays) * 100).toFixed(2))
			}))
		);
		setStatusMessage('Percentages were auto-computed based on days.');
	};

	const handleAutoDistributeItems = () => {
		const rowWeights = rows.map((row) => row.percentage);
		const bloomWeightsVector = BLOOM_ORDER.map((key) => bloomWeights[key]);
		const targetItemsPerRow = allocateByWeights(totalItems, rowWeights);
		const targetItemsPerBloom = allocateByWeights(totalItems, bloomWeightsVector);

		const matrix: number[][] = Array.from({ length: rows.length }, () => Array.from({ length: BLOOM_ORDER.length }, () => 0));

		for (let bloomIndex = 0; bloomIndex < BLOOM_ORDER.length; bloomIndex += 1) {
			const distribution = allocateByWeights(targetItemsPerBloom[bloomIndex], targetItemsPerRow);
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
				matrix[rowIndex][bloomIndex] = distribution[rowIndex];
			}
		}

		setRows((currentRows) =>
			currentRows.map((row, rowIndex) => ({
				...row,
				counts: {
					remembering: matrix[rowIndex][0],
					understanding: matrix[rowIndex][1],
					applying: matrix[rowIndex][2],
					analyzing: matrix[rowIndex][3],
					evaluating: matrix[rowIndex][4],
					creating: matrix[rowIndex][5]
				}
			}))
		);

		setStatusMessage('Items were auto-distributed across objectives and Bloom taxonomy.');
	};

	const resetToDefaults = () => {
		setRows(buildInitialRows(objectiveCount));
		setBloomWeights(DEFAULT_BLOOM_WEIGHTS);
		setStatusMessage('TOS table was reset to defaults.');
	};

	return (
		<TeacherLayout title="Table of Specifications">
			<section className="teacher-dash-heading teacher-page-heading">
				<p>TABLE OF SPECIFICATIONS AUTOMATION WORKSPACE</p>
				<div className="teacher-heading-row">
					<h2>Table of Specifications</h2>
					<span className={`teacher-tos-status ${automatedReadiness ? 'ready' : 'draft'}`}>
						{automatedReadiness ? 'Ready for Exam Blueprint' : 'Draft in Progress'}
					</span>
				</div>
			</section>

			{statusMessage ? <p className="teacher-status">{statusMessage}</p> : null}

			<section className="teacher-panel teacher-tos-meta-panel">
				<div className="teacher-tos-meta-grid">
					<label>
						School Year
						<input value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} />
					</label>
					<label>
						Class
						<select value={classValue} onChange={(event) => {
							setClassValue(event.target.value);
							setSubject('');
						}}>
							<option value="">Select class</option>
							{(uploadMeta?.gradeLevels ?? []).map((classOption) => (
								<option key={classOption} value={classOption}>{classOption}</option>
							))}
						</select>
					</label>
					<label>
						Subject
						<select value={subject} onChange={(event) => setSubject(event.target.value)} disabled={!classValue}>
							<option value="">Select subject</option>
							{subjectOptions.map((subjectOption) => (
								<option key={subjectOption} value={subjectOption}>{subjectOption}</option>
							))}
						</select>
					</label>
					<label>
						Quarter
						<select value={quarter} onChange={(event) => setQuarter(event.target.value)}>
							{(uploadMeta?.quarters ?? ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter']).map((quarterOption) => (
								<option key={quarterOption} value={quarterOption}>{quarterOption}</option>
							))}
						</select>
					</label>
					<label>
						Total Days
						<input
							type="number"
							min={1}
							value={totalDays}
							onChange={(event) => setTotalDays(sanitizeNumber(Number(event.target.value)))}
						/>
					</label>
					<label>
						No. of Items
						<input
							type="number"
							min={1}
							value={totalItems}
							onChange={(event) => setTotalItems(sanitizeNumber(Number(event.target.value)))}
						/>
					</label>
					<label>
						Objectives
						<input
							type="number"
							min={1}
							max={20}
							value={objectiveCount}
							onChange={(event) => setObjectiveCount(Math.max(1, Math.floor(Number(event.target.value) || 1)))}
						/>
					</label>
				</div>

				<div className="teacher-tos-action-row">
					<button type="button" className="teacher-filter-apply-btn" onClick={handleAutoPercentByDays}>Auto % by Days</button>
					<button type="button" className="teacher-filter-apply-btn" onClick={handleAutoDistributeItems}>Auto Distribute Items</button>
					<button type="button" className="teacher-secondary-btn" onClick={resetToDefaults}>Reset</button>
				</div>
			</section>

			<section className="teacher-panel teacher-tos-bloom-panel">
				<div className="teacher-panel-head">
					<h2>Bloom Taxonomy Weighting</h2>
					<span>Total: {BLOOM_ORDER.reduce((sum, key) => sum + bloomWeights[key], 0)}%</span>
				</div>
				<div className="teacher-tos-bloom-grid">
					{BLOOM_ORDER.map((key) => (
						<label key={key}>
							{BLOOM_LABELS[key]}
							<input
								type="number"
								min={0}
								value={bloomWeights[key]}
								onChange={(event) => {
									const nextValue = sanitizeNumber(Number(event.target.value));
									setBloomWeights((current) => ({ ...current, [key]: nextValue }));
								}}
							/>
						</label>
					))}
				</div>
			</section>

			<section className="teacher-panel teacher-tos-table-panel">
				<div className="teacher-panel-head">
					<h2>TOS Blueprint Matrix</h2>
					<span>Total Items Allocated: {totalAllocatedItems}/{totalItems}</span>
				</div>
				<div className="teacher-table-wrap teacher-tos-table-wrap">
					<table className="teacher-table teacher-tos-table">
						<thead>
							<tr>
								<th>Objective</th>
								<th>Competency</th>
								<th>Days</th>
								<th>%</th>
								{BLOOM_ORDER.map((key) => (
									<th key={key}>{BLOOM_LABELS[key]}</th>
								))}
								<th>Total Items</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, rowIndex) => (
								<tr key={row.id}>
									<td>Objective {row.id}</td>
									<td>
										<input
											value={row.competency}
											onChange={(event) => {
												const nextValue = event.target.value;
												updateRow(rowIndex, (current) => ({ ...current, competency: nextValue }));
											}}
										/>
									</td>
									<td>
										<input
											type="number"
											min={0}
											value={row.days}
											onChange={(event) => {
												const nextValue = sanitizeNumber(Number(event.target.value));
												updateRow(rowIndex, (current) => ({ ...current, days: nextValue }));
											}}
										/>
									</td>
									<td>
										<input
											type="number"
											min={0}
											value={row.percentage}
											onChange={(event) => {
												const nextValue = sanitizeNumber(Number(event.target.value));
												updateRow(rowIndex, (current) => ({ ...current, percentage: nextValue }));
											}}
										/>
									</td>
									{BLOOM_ORDER.map((key) => (
										<td key={key}>
											<input
												type="number"
												min={0}
												value={row.counts[key]}
												onChange={(event) => {
													const nextValue = sanitizeNumber(Number(event.target.value));
													updateRow(rowIndex, (current) => ({
														...current,
														counts: { ...current.counts, [key]: nextValue }
													}));
												}}
											/>
										</td>
									))}
									<td className="teacher-tos-total-cell">{rowTotals[rowIndex]}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td colSpan={2}>Totals</td>
								<td>{rows.reduce((sum, row) => sum + row.days, 0)}</td>
								<td>{totalAllocatedPercentage.toFixed(2)}%</td>
								{BLOOM_ORDER.map((key) => (
									<td key={key}>{bloomTotals[key]}</td>
								))}
								<td>{totalAllocatedItems}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</section>

			<div className="teacher-tos-bottom-grid">
				<section className="teacher-panel teacher-tos-panel-compact">
					<h2>Auto Item Placement</h2>
					<p className="teacher-panel-copy">Item numbers are generated in sequence based on each objective and Bloom-level count.</p>
					<div className="teacher-table-wrap teacher-tos-placement-wrap">
						<table className="teacher-table teacher-tos-placement-table">
							<thead>
								<tr>
									<th>Objective</th>
									{BLOOM_ORDER.map((key) => (
										<th key={key}>{BLOOM_LABELS[key]}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rows.map((row, rowIndex) => (
									<tr key={row.id}>
										<td>Objective {row.id}</td>
										{BLOOM_ORDER.map((key) => (
											<td key={key}>{itemPlacements[rowIndex]?.[key] ?? '-'}</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="teacher-panel teacher-tos-panel-compact">
					<h2>Cognitive Process Distribution</h2>
					<div className="teacher-tos-bars">
						{BLOOM_ORDER.map((key) => {
							const value = bloomTotals[key];
							const height = totalItems > 0 ? Math.min(100, (value / totalItems) * 100) : 0;

							return (
								<div key={key} className="teacher-tos-bar-item">
									<div className="teacher-tos-bar-track">
										<div className="teacher-tos-bar-fill" style={{ height: `${height}%` }} />
									</div>
									<strong>{value}</strong>
									<span>{BLOOM_LABELS[key]}</span>
								</div>
							);
						})}
					</div>
				</section>
			</div>
		</TeacherLayout>
	);
}

export default TOSBuilder;
