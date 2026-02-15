import type { Block } from '@blocknote/core';
import type { NoteType } from '@/types';

function heading(id: string, text: string, level: 2 | 3 = 2) {
  return {
    id,
    type: 'heading' as const,
    props: { level, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function bullet(id: string, text = '') {
  return {
    id,
    type: 'bulletListItem' as const,
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function paragraph(id: string, text = '') {
  return {
    id,
    type: 'paragraph' as const,
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function checklist(id: string, text = '') {
  return {
    id,
    type: 'checkListItem' as const,
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' as const, checked: false },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

function numbered(id: string, text = '') {
  return {
    id,
    type: 'numberedListItem' as const,
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' as const },
    content: [{ type: 'text' as const, text, styles: {} }],
    children: [],
  };
}

// ─── Meeting Note ───────────────────────────────────────────
const meetingTemplate: Block[] = [
  heading('m-obj', 'Objectives'),
  bullet('m-obj-1'),
  heading('m-att', 'Attendees'),
  bullet('m-att-1'),
  heading('m-pain', 'Key Pain Points'),
  bullet('m-pain-1'),
  heading('m-current', 'Current State'),
  paragraph('m-current-1'),
  heading('m-future', 'Future State'),
  paragraph('m-future-1'),
  heading('m-demo', 'Demo Notes'),
  paragraph('m-demo-1'),
  heading('m-actions', 'Action Items'),
  checklist('m-act-1'),
  heading('m-next', 'Next Steps'),
  checklist('m-next-1'),
] as unknown as Block[];

// ─── Discovery Note ─────────────────────────────────────────
const discoveryTemplate: Block[] = [
  heading('d-overview', 'Customer Overview'),
  bullet('d-ov-1', 'Company:'),
  bullet('d-ov-2', 'Website:'),
  bullet('d-ov-3', 'Industry:'),
  bullet('d-ov-4', 'Size / Revenue:'),
  bullet('d-ov-5', 'Current ERP:'),
  heading('d-website', 'Website Summary'),
  paragraph('d-ws-1', 'Click "Summarize Website" above to auto-populate this section.'),
  heading('d-stakeholders', 'Key Stakeholders'),
  bullet('d-sh-1', 'Name — Role — Influence'),
  heading('d-pain', 'Pain Points & Challenges'),
  numbered('d-pain-1'),
  heading('d-requirements', 'Requirements'),
  heading('d-req-must', 'Must Have', 3),
  bullet('d-req-must-1'),
  heading('d-req-nice', 'Nice to Have', 3),
  bullet('d-req-nice-1'),
  heading('d-processes', 'Key Business Processes'),
  bullet('d-proc-1', 'Order to Cash:'),
  bullet('d-proc-2', 'Procure to Pay:'),
  bullet('d-proc-3', 'Financial Close:'),
  bullet('d-proc-4', 'Inventory / WMS:'),
  heading('d-integrations', 'Integration Landscape'),
  bullet('d-int-1', 'System — Direction — Data'),
  heading('d-timeline', 'Timeline & Budget'),
  bullet('d-tl-1', 'Go-live target:'),
  bullet('d-tl-2', 'Budget range:'),
  bullet('d-tl-3', 'Decision timeline:'),
  heading('d-next', 'Next Steps'),
  checklist('d-next-1'),
] as unknown as Block[];

// ─── Design Note ────────────────────────────────────────────
const designTemplate: Block[] = [
  heading('ds-summary', 'Solution Summary'),
  paragraph('ds-sum-1'),
  heading('ds-scope', 'Scope'),
  heading('ds-in', 'In Scope', 3),
  bullet('ds-in-1'),
  heading('ds-out', 'Out of Scope', 3),
  bullet('ds-out-1'),
  heading('ds-architecture', 'Solution Architecture'),
  paragraph('ds-arch-1', 'Describe the NetSuite configuration approach...'),
  heading('ds-customizations', 'Customizations'),
  bullet('ds-cust-1', 'Type (Script / Workflow / Custom Record):'),
  heading('ds-data', 'Data Migration Plan'),
  bullet('ds-data-1', 'Source system:'),
  bullet('ds-data-2', 'Record types:'),
  bullet('ds-data-3', 'Volume estimates:'),
  bullet('ds-data-4', 'Cleansing needs:'),
  heading('ds-integrations', 'Integration Design'),
  bullet('ds-integ-1', 'System — Method (REST/SOAP/File) — Frequency'),
  heading('ds-risks', 'Risks & Assumptions'),
  numbered('ds-risk-1'),
  heading('ds-decisions', 'Open Decisions'),
  checklist('ds-dec-1'),
  heading('ds-actions', 'Action Items'),
  checklist('ds-act-1'),
] as unknown as Block[];

// ─── Issue Note ─────────────────────────────────────────────
const issueTemplate: Block[] = [
  heading('i-summary', 'Issue Summary'),
  paragraph('i-sum-1'),
  heading('i-details', 'Details'),
  bullet('i-det-1', 'Severity: High / Medium / Low'),
  bullet('i-det-2', 'Module / Area:'),
  bullet('i-det-3', 'Reported by:'),
  bullet('i-det-4', 'Date identified:'),
  heading('i-impact', 'Business Impact'),
  paragraph('i-impact-1'),
  heading('i-steps', 'Steps to Reproduce'),
  numbered('i-step-1'),
  heading('i-expected', 'Expected Behavior'),
  paragraph('i-exp-1'),
  heading('i-actual', 'Actual Behavior'),
  paragraph('i-act-1'),
  heading('i-root', 'Root Cause Analysis'),
  paragraph('i-root-1'),
  heading('i-resolution', 'Resolution / Workaround'),
  paragraph('i-res-1'),
  heading('i-actions', 'Follow-up Actions'),
  checklist('i-act-item-1'),
] as unknown as Block[];

// ─── General Note ───────────────────────────────────────────
const generalTemplate: Block[] = [
  paragraph('g-1'),
] as unknown as Block[];

// ─── Template Map ───────────────────────────────────────────
export const NOTE_TEMPLATES: Record<NoteType, { title: string; blocks: Block[] }> = {
  meeting: { title: 'Meeting Notes — ', blocks: meetingTemplate },
  discovery: { title: 'Discovery — ', blocks: discoveryTemplate },
  design: { title: 'Solution Design — ', blocks: designTemplate },
  issue: { title: 'Issue — ', blocks: issueTemplate },
  general: { title: '', blocks: generalTemplate },
};
