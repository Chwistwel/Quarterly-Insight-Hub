import type { NavigateFunction } from 'react-router-dom';

export type ActionKey =
  | 'request-demo'
  | 'more-filters'
  | 'export-data'
  | 'export-report'
  | 'generate-report'
  | 'use-template'
  | 'view-report'
  | 'download-report'
  | 'setup-automation'
  | 'intervention-plan'
  | 'send-updates'
  | 'schedule-intervention';

const actionTitles: Record<ActionKey, string> = {
  'request-demo': 'Sign Up',
  'more-filters': 'Advanced Filters',
  'export-data': 'Export Data',
  'export-report': 'Export Report',
  'generate-report': 'Generate Report',
  'use-template': 'Use Template',
  'view-report': 'View Report',
  'download-report': 'Download Report',
  'setup-automation': 'Set Up Automation',
  'intervention-plan': 'Create Intervention Plan',
  'send-updates': 'Send Updates',
  'schedule-intervention': 'Schedule Intervention'
};

const actionDescriptions: Record<ActionKey, string> = {
  'request-demo': 'Create an account to access your dashboard and continue your workflow.',
  'more-filters': 'Open advanced filtering controls to narrow records and analytics with more precision.',
  'export-data': 'Prepare data export options, including CSV, Excel, or printable report-ready formats.',
  'export-report': 'Generate a structured report package from your current selected analytics and filters.',
  'generate-report': 'Create a new quarterly report using current metrics, templates, and selected components.',
  'use-template': 'Apply the selected template to prefill report sections and speed up report generation.',
  'view-report': 'Open report details with full breakdown, metadata, and generated insights.',
  'download-report': 'Download the selected report for offline access and distribution.',
  'setup-automation': 'Configure schedules and recipients for automated reporting delivery.',
  'intervention-plan': 'Build a guided intervention plan for students flagged as needing support.',
  'send-updates': 'Draft and send parent communication updates based on current student performance.',
  'schedule-intervention': 'Schedule intervention sessions and assign resources to support student improvement.'
};

export function getActionTitle(action: ActionKey): string {
  return actionTitles[action];
}

export function getActionDescription(action: ActionKey): string {
  return actionDescriptions[action];
}

export function goToAction(
  navigate: NavigateFunction,
  action: ActionKey,
  source: string,
  metadata?: Record<string, string | number>
): void {
  const params = new URLSearchParams({ source });

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }

  navigate(`/actions/${action}?${params.toString()}`);
}
