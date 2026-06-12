import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { fetchJson } from '../../services/api';
import '../../styles/ADMIN/SchoolOverview.css';
import '../../styles/TEACHER/ItemAnalysis.css';
import '../../styles/TEACHER/StudentManagement.css';

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
  classOptions: string[];
  classSubjectMap: Record<string, string[]>;
  subjectOptions: string[];
  quarterOptions: string[];
  selectedClass: string;
  selectedSubject: string;
  selectedQuarter: string;
  classAverage: string;
  averageIndex: string;
  totalStudents: number;
  rows: AdminItemAnalysisRow[];
};

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

type AdminTosRow = {
  id: number;
  competency: string;
  days: number;
  percentage: number;
  counts?: Partial<Record<'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating', number>>;
};

type AdminTosBlueprint = {
  rows?: AdminTosRow[];
  totalItems?: number;
};

function ItemAnalysis() {
  const [data, setData] = useState<AdminItemAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'all' | 'excellent' | 'good' | 'needs'>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const role = localStorage.getItem('userRole') ?? '';
        const email = localStorage.getItem('userEmail') ?? '';
        const params = new URLSearchParams();
        if (selectedClass) {
          params.set('class', selectedClass);
        }
        if (selectedSubject) {
          params.set('subject', selectedSubject);
        }
        if (selectedQuarter) {
          params.set('quarter', selectedQuarter);
        }

        const query = params.toString();
        const response = await fetchJson<AdminItemAnalysisResponse>(`/api/admin/item-analysis${query ? `?${query}` : ''}`, {
          method: 'GET',
          headers: {
            'x-user-role': role,
            'x-user-email': email
          }
        });

        setData(response);
        setSelectedClass(response.selectedClass ?? '');
        setSelectedSubject(response.selectedSubject ?? '');
        setSelectedQuarter(response.selectedQuarter ?? '');
      } catch (loadError) {
        setData(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load item analysis.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [selectedClass, selectedSubject, selectedQuarter]);

  const classOptions = data?.classOptions ?? [];

  const availableSubjects = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    return data?.classSubjectMap?.[selectedClass] ?? [];
  }, [data?.classSubjectMap, selectedClass]);

  const availableQuarters = data?.quarterOptions ?? [];

  const summaryRows = useMemo(() => {
    const summary = new Map<DecisionLabel, number>();
    DECISION_ORDER.forEach((label) => summary.set(label, 0));
    (data?.rows ?? []).forEach((row) => {
      const label = computeDecision(row.difficultyIndex, row.discriminationIndex);
      summary.set(label, (summary.get(label) ?? 0) + 1);
    });
    return DECISION_ORDER.map((label) => ({ label, count: summary.get(label) ?? 0 }));
  }, [data?.rows]);

  const [tosBlueprint, setTosBlueprint] = useState<AdminTosBlueprint | null>(null);
  const [tosLoading, setTosLoading] = useState(false);
  const [tosError, setTosError] = useState<string | null>(null);

  function getCurrentSchoolYear(): string {
    const currentYear = new Date().getFullYear();
    const startYear = new Date().getMonth() >= 6 ? currentYear : currentYear - 1;
    return `${startYear}-${startYear + 1}`;
  }

  const BLOOM_ORDER: Array<'remembering'|'understanding'|'applying'|'analyzing'|'evaluating'|'creating'> = ['remembering','understanding','applying','analyzing','evaluating','creating'];
  const BLOOM_LABELS: Record<string,string> = {
    remembering: 'Remembering',
    understanding: 'Understanding',
    applying: 'Applying',
    analyzing: 'Analyzing',
    evaluating: 'Evaluating',
    creating: 'Creating'
  };

  const normalizeQuarterLabel = (value: string): string => {
    const match = value.match(/(\d+)/);
    if (!match) {
      return value.trim().toLowerCase();
    }

    return `q${match[1]}`;
  };

  const buildCompetencyMapFromBlueprint = useMemo(() => {
    const map = new Map<number, string>();
    const rows = tosBlueprint?.rows ?? [];
    let itemNo = 1;

    rows.forEach((row, rowIndex) => {
      BLOOM_ORDER.forEach((key) => {
        const count = Number(row.counts?.[key] ?? 0) || 0;
        for (let index = 0; index < count; index += 1) {
          map.set(itemNo, String(row.competency ?? '').trim() || `Objective ${rowIndex + 1}`);
          itemNo += 1;
        }
      });
    });

    return map;
  }, [BLOOM_ORDER, tosBlueprint?.rows]);

  useEffect(() => {
    const loadTos = async () => {
      setTosLoading(true);
      setTosError(null);
      setTosBlueprint(null);

      if (!selectedClass || !selectedSubject || !selectedQuarter) {
        setTosLoading(false);
        return;
      }

      try {
        const schoolYear = getCurrentSchoolYear();
        const params = new URLSearchParams({
          schoolYear,
          quarter: normalizeQuarterLabel(selectedQuarter),
          classValue: selectedClass,
          subject: selectedSubject
        });
        const role = localStorage.getItem('userRole') ?? '';
        const email = localStorage.getItem('userEmail') ?? '';
        const payload = await fetchJson<{ blueprint?: any }>(`/api/admin/tos?${params.toString()}`, {
          method: 'GET',
          headers: {
            'x-user-role': role,
            'x-user-email': email
          }
        });
        setTosBlueprint(payload.blueprint ?? null);
      } catch (err) {
        setTosBlueprint(null);
        setTosError(err instanceof Error ? err.message : 'Unable to load saved TOS.');
      } finally {
        setTosLoading(false);
      }
    };

    void loadTos();
  }, [selectedClass, selectedSubject, selectedQuarter]);

  const tosRows = tosBlueprint?.rows ?? [];
  const rowTotals = useMemo(() => tosRows.map((row: any) => BLOOM_ORDER.reduce((sum, key) => sum + (row.counts?.[key] ?? 0), 0)), [tosRows]);
  const bloomTotals = useMemo(() => {
    const totals: Record<string, number> = { remembering:0, understanding:0, applying:0, analyzing:0, evaluating:0, creating:0 };
    tosRows.forEach((row: any) => BLOOM_ORDER.forEach((key) => { totals[key] += Number(row.counts?.[key] ?? 0); }));
    return totals;
  }, [tosRows]);
  const totalAllocatedItems = useMemo(() => rowTotals.reduce((sum:number, v:number) => sum + v, 0), [rowTotals]);
  const totalAllocatedPercentage = useMemo(() => tosRows.reduce((sum:number, row:any) => sum + Number(row.percentage || 0), 0), [tosRows]);
  const itemPlacements = useMemo(() => {
    let pointer = 1;
    const placementRows: Record<string,string>[] = tosRows.map(() => ({ remembering:'', understanding:'', applying:'', analyzing:'', evaluating:'', creating:'' }));
    tosRows.forEach((row:any, rowIndex:number) => {
      BLOOM_ORDER.forEach((key) => {
        const count = Number(row.counts?.[key] ?? 0);
        if (count <= 0) { placementRows[rowIndex][key] = '-'; return; }
        const values: number[] = [];
        for (let i = 0; i < count; i += 1) { values.push(pointer); pointer += 1; }
        placementRows[rowIndex][key] = values.join(', ');
      });
    });
    return placementRows;
  }, [tosRows]);

  const filteredRows = useMemo(() => {
    const rows = [...(data?.rows ?? [])]
      .sort((first, second) => first.itemNo - second.itemNo);

    if (selectedView === 'all') {
      return rows;
    }

    if (selectedView === 'excellent') {
      return rows.filter((row) => row.status === 'excellent');
    }

    if (selectedView === 'good') {
      return rows.filter((row) => row.status === 'good');
    }

    return rows.filter((row) => row.status === 'fair' || row.status === 'poor');
  }, [data?.rows, selectedView]);

  const sortedByDifficulty = useMemo(() => {
    const items = [...(data?.rows ?? [])].map((row) => {
      const diff = parseIndexValue(row.difficultyIndex) ?? 0;
      const itemNo = Number(row.itemNo) || 0;
      return { ...row, itemNo, diffValue: diff };
    });
    return items.sort((a, b) => b.diffValue - a.diffValue);
  }, [data?.rows]);

  const mostLearnedItems = useMemo(() => sortedByDifficulty.slice(0, 10), [sortedByDifficulty]);
  const leastLearnedItems = useMemo(() => [...sortedByDifficulty].reverse().slice(0, 10), [sortedByDifficulty]);

  return (
    <AdminLayout kicker="COMPREHENSIVE ITEM ANALYSIS" title={data?.title ?? 'Item Analysis'}>
      {loading ? <p className="admin-subcopy">Loading item analysis...</p> : null}
      {error ? <p className="admin-subcopy" style={{ color: '#c43d3d' }}>{error}</p> : null}

      <section className="admin-filter-row">
        <select value={selectedClass} onChange={(event) => {
          setSelectedClass(event.target.value);
          setSelectedSubject('');
          setSelectedQuarter('');
        }}>
          <option value="">All Classes</option>
          {classOptions.map((classOption) => (
            <option key={classOption} value={classOption}>{classOption}</option>
          ))}
        </select>
        <select value={selectedSubject} onChange={(event) => {
          setSelectedSubject(event.target.value);
          setSelectedQuarter('');
        }} disabled={!selectedClass}>
          <option value="">All Subjects</option>
          {availableSubjects.map((subjectOption) => (
            <option key={subjectOption} value={subjectOption}>{subjectOption}</option>
          ))}
        </select>
        <select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)} disabled={!selectedClass || !selectedSubject || availableQuarters.length === 0}>
          <option value="">All Quarters</option>
          {availableQuarters.map((quarterOption) => (
            <option key={quarterOption} value={quarterOption}>{quarterOption}</option>
          ))}
        </select>
      </section>
      

      <section className="admin-kpis admin-kpis-3">
        <article className="admin-card">
          <p>AVERAGE SCORE</p>
          <strong>{data?.classAverage ?? '0.0%'}</strong>
        </article>
        <article className="admin-card">
          <p>AVERAGE INDEX</p>
          <strong>{data?.averageIndex ?? '0.0%'}</strong>
        </article>
        <article className="admin-card">
          <p>TOTAL STUDENTS</p>
          <strong>{data?.totalStudents ?? 0}</strong>
        </article>
      </section>

      <div className="admin-tabs">
        <button type="button" className={selectedView === 'all' ? 'active' : ''} onClick={() => setSelectedView('all')}>All Items</button>
        <button type="button" className={selectedView === 'excellent' ? 'active' : ''} onClick={() => setSelectedView('excellent')}>Excellent</button>
        <button type="button" className={selectedView === 'good' ? 'active' : ''} onClick={() => setSelectedView('good')}>Good</button>
        <button type="button" className={selectedView === 'needs' ? 'active' : ''} onClick={() => setSelectedView('needs')}>Needs Improvement</button>
      </div>

      <section className="teacher-panel teacher-item-analysis-linked-panel">
        <div className="teacher-panel-head teacher-dash-heading-divider">
          <h2>Analysis Summary & TOS Summary</h2>
          <span>{selectedSubject || 'Select Subject'} | {selectedClass || 'Select Class'} | {selectedQuarter || 'Select Quarter'}</span>
        </div>

        {/* Summary moved below the Item Analysis table */}

        <section className="student-analysis-card">
          <div className="student-analysis-card-head">
            <h3>Saved TOS</h3>
            <span>{selectedQuarter}</span>
          </div>
          {tosLoading ? (
            <p className="teacher-status">Loading saved TOS...</p>
          ) : tosError ? (
            <p className="teacher-status" style={{ color: '#c43d3d' }}>{tosError}</p>
          ) : tosBlueprint && tosRows.length > 0 ? (
            <>
              <div className="teacher-table-wrap student-analysis-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="teacher-table student-analysis-table" style={{ minWidth: '1200px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Topics</th>
                      <th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Competencies</th>
                      <th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Days</th>
                      <th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Percentage</th>
                      <th colSpan={12} style={{ border: '1px solid var(--border)', textAlign: 'center' }}>BLOOMS TAXONOMY</th>
                      <th rowSpan={3} style={{ border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>Total Number of Items</th>
                    </tr>
                    <tr>
                      {BLOOM_ORDER.map((key) => (
                        <th key={key} colSpan={2} style={{ border: '1px solid var(--border)', textAlign: 'center' }}>{BLOOM_LABELS[key]}</th>
                      ))}
                    </tr>
                    <tr>
                      {BLOOM_ORDER.map((key) => (
                        <React.Fragment key={`${key}-sub`}>
                          <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.75rem' }}>NOI</th>
                          <th style={{ border: '1px solid var(--border)', textAlign: 'center', fontSize: '0.75rem' }}>POI</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tosRows.map((row: any, rowIndex: number) => (
                      <tr key={`admin-tos-${selectedQuarter}-${row.id}`}>
                        <td style={{ border: '1px solid var(--border)', padding: '0.5rem' }}>{row.topic || `Topic ${row.id}`}</td>
                        <td style={{ border: '1px solid var(--border)', padding: '0.5rem' }}>{row.competency}</td>
                        <td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>{row.days}</td>
                        <td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>{row.percentage}</td>
                        {BLOOM_ORDER.map((key) => (
                          <React.Fragment key={`${row.id}-${key}`}>
                            <td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center' }}>{row.counts?.[key]}</td>
                            <td style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{itemPlacements[rowIndex]?.[key] ?? '-'}</td>
                          </React.Fragment>
                        ))}
                        <td className="teacher-tos-total-cell" style={{ border: '1px solid var(--border)', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>{rowTotals[rowIndex]}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ border: '1px solid var(--border)', textAlign: 'right', paddingRight: '1rem', fontWeight: 'bold' }}>TOTAL</td>
                      <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{tosRows.reduce((sum:any, row:any) => sum + Number(row.days || 0), 0)}</td>
                      <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{Number(totalAllocatedPercentage || 0).toFixed(0)}%</td>
                      {BLOOM_ORDER.map((key) => (
                        <React.Fragment key={`total-${key}`}>
                          <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{bloomTotals[key]}</td>
                          <td style={{ border: '1px solid var(--border)', background: '#f5f5f5' }}></td>
                        </React.Fragment>
                      ))}
                      <td style={{ border: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>{totalAllocatedItems}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ marginTop: '3rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Cognitive Process Distribution</h4>
                <div className="teacher-tos-bars">
                  {BLOOM_ORDER.map((key) => {
                    const value = bloomTotals[key];
                    const totalItemsVal = tosBlueprint?.totalItems || 1;
                    const height = totalItemsVal > 0 ? Math.min(100, (value / totalItemsVal) * 100) : 0;

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
              </div>
            </>
          ) : (
            <p className="teacher-status">No saved TOS found for {selectedQuarter}.</p>
          )}
        </section>
      </section>

      <section className="teacher-panel">
        <div className="teacher-panel-head">
          <h2>Item Analysis</h2>
        </div>
        <div className="teacher-table-wrap">
          <table className="teacher-table">
            <thead>
              <tr>
                <th>Item #</th>
                <th>Difficulty Index</th>
                <th>Difficulty</th>
                <th>Discrimination Index</th>
                <th>Result</th>
                <th>Interpretation</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.itemNo}>
                  <td>{row.itemNo}</td>
                  <td>{row.difficultyIndex.toFixed(2)}</td>
                  <td>
                    <span className={`teacher-badge difficulty-${row.difficultyLabel.toLowerCase()}`}>{row.difficultyLabel}</span>
                  </td>
                  <td>{row.discriminationIndex.toFixed(2)}</td>
                  <td>{row.result}</td>
                  <td>
                    <span className={`teacher-badge ${row.status}`}>{row.interpretation}</span>
                  </td>
                  <td>{row.decision}</td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No item analysis data found for the selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="teacher-panel teacher-item-analysis-linked-panel" style={{ marginTop: '1.5rem' }}>
        <div className="teacher-panel-head teacher-dash-heading-divider">
          <h2>Analysis Summary & Interventions</h2>
          <span>{selectedSubject || 'Select Subject'} | {selectedClass || 'Select Class'} | {selectedQuarter || 'Select Quarter'}</span>
        </div>

        <div className="teacher-item-analysis-summary-box">
          <h3>Summary of Results</h3>
          <div className="teacher-summary-grid">
            {summaryRows.map(item => (
              <div key={`summary-${item.label}`} className="teacher-summary-card">
                <span className="teacher-summary-count">{item.count}</span>
                <span className="teacher-summary-label">{item.label}</span>
              </div>
            ))}
            {summaryRows.length === 0 && (
              <p className="teacher-status">No summary available.</p>
            )}
          </div>
        </div>

        <div className="teacher-item-analysis-top10-container">
          <div className="teacher-table-wrap teacher-item-analysis-analysis-wrap">
            <h3>TOP 10 MOST LEARNED TEST ITEMS</h3>
            <table className="teacher-table teacher-item-analysis-analysis-table">
              <thead>
                <tr>
                  <th>ITEM NUMBER</th>
                  <th>CONTENT AREA</th>
                </tr>
              </thead>
              <tbody>
                {mostLearnedItems.map((item) => {
                  const displayContent = buildCompetencyMapFromBlueprint.get(Number(item.itemNo)) ?? '-';
                  return (
                    <tr key={`most-learned-${item.itemNo}`}>
                      <td>{item.itemNo}</td>
                      <td>
                        <div style={{ padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}>{displayContent}</div>
                      </td>
                    </tr>
                  );
                })}
                {mostLearnedItems.length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center' }}>No items available.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="teacher-table-wrap teacher-item-analysis-analysis-wrap" style={{ marginTop: '2rem' }}>
            <h3>TOP 10 LEAST LEARNED TEST ITEMS</h3>
            <table className="teacher-table teacher-item-analysis-analysis-table">
              <thead>
                <tr>
                  <th>ITEM NUMBER</th>
                  <th>CONTENT AREA</th>
                  <th>INTERVENTION</th>
                </tr>
              </thead>
              <tbody>
                {leastLearnedItems.map((item) => {
                  const displayContent = buildCompetencyMapFromBlueprint.get(Number(item.itemNo)) ?? '-';
                  return (
                    <tr key={`least-learned-${item.itemNo}`}>
                      <td>{item.itemNo}</td>
                      <td>
                        <div style={{ padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}>{displayContent}</div>
                      </td>
                      <td>
                        <div style={{ padding: '0.25rem 0.5rem', color: 'var(--text-main)' }}>
                          {(displayContent && displayContent !== '-') ? `Remediation on ${displayContent}` : 'Remediation'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leastLearnedItems.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>No items available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </AdminLayout>
  );
}

export default ItemAnalysis;
