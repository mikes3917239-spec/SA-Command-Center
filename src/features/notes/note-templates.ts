import type { Block } from '@blocknote/core';
import type { NoteType, TemplateSectionDef } from '@/types';

// ─── Legacy BlockNote helpers (kept for old note rendering) ─────

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

// ─── Legacy BlockNote templates ─────────────────────────────────

const meetingTemplate: Block[] = [
  heading('m-obj', 'Objectives'), bullet('m-obj-1'),
  heading('m-att', 'Attendees'), bullet('m-att-1'),
  heading('m-pain', 'Key Pain Points'), bullet('m-pain-1'),
  heading('m-current', 'Current State'), paragraph('m-current-1'),
  heading('m-future', 'Future State'), paragraph('m-future-1'),
  heading('m-demo', 'Demo Notes'), paragraph('m-demo-1'),
  heading('m-actions', 'Action Items'), checklist('m-act-1'),
  heading('m-next', 'Next Steps'), checklist('m-next-1'),
] as unknown as Block[];

const discoveryTemplate: Block[] = [
  heading('d-overview', 'Customer Overview'),
  bullet('d-ov-1', 'Company:'), bullet('d-ov-2', 'Website:'), bullet('d-ov-3', 'Industry:'),
  bullet('d-ov-4', 'Size / Revenue:'), bullet('d-ov-5', 'Current ERP:'),
  heading('d-website', 'Website Summary'),
  paragraph('d-ws-1', 'Click "Summarize Website" above to auto-populate this section.'),
  heading('d-stakeholders', 'Key Stakeholders'), bullet('d-sh-1', 'Name — Role — Influence'),
  heading('d-pain', 'Pain Points & Challenges'), numbered('d-pain-1'),
  heading('d-requirements', 'Requirements'),
  heading('d-req-must', 'Must Have', 3), bullet('d-req-must-1'),
  heading('d-req-nice', 'Nice to Have', 3), bullet('d-req-nice-1'),
  heading('d-processes', 'Key Business Processes'),
  bullet('d-proc-1', 'Order to Cash:'), bullet('d-proc-2', 'Procure to Pay:'),
  bullet('d-proc-3', 'Financial Close:'), bullet('d-proc-4', 'Inventory / WMS:'),
  heading('d-integrations', 'Integration Landscape'), bullet('d-int-1', 'System — Direction — Data'),
  heading('d-timeline', 'Timeline & Budget'),
  bullet('d-tl-1', 'Go-live target:'), bullet('d-tl-2', 'Budget range:'), bullet('d-tl-3', 'Decision timeline:'),
  heading('d-next', 'Next Steps'), checklist('d-next-1'),
] as unknown as Block[];

const designTemplate: Block[] = [
  heading('ds-summary', 'Solution Summary'), paragraph('ds-sum-1'),
  heading('ds-scope', 'Scope'),
  heading('ds-in', 'In Scope', 3), bullet('ds-in-1'),
  heading('ds-out', 'Out of Scope', 3), bullet('ds-out-1'),
  heading('ds-architecture', 'Solution Architecture'),
  paragraph('ds-arch-1', 'Describe the NetSuite configuration approach...'),
  heading('ds-customizations', 'Customizations'), bullet('ds-cust-1', 'Type (Script / Workflow / Custom Record):'),
  heading('ds-data', 'Data Migration Plan'),
  bullet('ds-data-1', 'Source system:'), bullet('ds-data-2', 'Record types:'),
  bullet('ds-data-3', 'Volume estimates:'), bullet('ds-data-4', 'Cleansing needs:'),
  heading('ds-integrations', 'Integration Design'), bullet('ds-integ-1', 'System — Method (REST/SOAP/File) — Frequency'),
  heading('ds-risks', 'Risks & Assumptions'), numbered('ds-risk-1'),
  heading('ds-decisions', 'Open Decisions'), checklist('ds-dec-1'),
  heading('ds-actions', 'Action Items'), checklist('ds-act-1'),
] as unknown as Block[];

const issueTemplate: Block[] = [
  heading('i-summary', 'Issue Summary'), paragraph('i-sum-1'),
  heading('i-details', 'Details'),
  bullet('i-det-1', 'Severity: High / Medium / Low'), bullet('i-det-2', 'Module / Area:'),
  bullet('i-det-3', 'Reported by:'), bullet('i-det-4', 'Date identified:'),
  heading('i-impact', 'Business Impact'), paragraph('i-impact-1'),
  heading('i-steps', 'Steps to Reproduce'), numbered('i-step-1'),
  heading('i-expected', 'Expected Behavior'), paragraph('i-exp-1'),
  heading('i-actual', 'Actual Behavior'), paragraph('i-act-1'),
  heading('i-root', 'Root Cause Analysis'), paragraph('i-root-1'),
  heading('i-resolution', 'Resolution / Workaround'), paragraph('i-res-1'),
  heading('i-actions', 'Follow-up Actions'), checklist('i-act-item-1'),
] as unknown as Block[];

const generalTemplate: Block[] = [
  paragraph('g-1'),
] as unknown as Block[];

export const NOTE_TEMPLATES: Record<NoteType, { title: string; blocks: Block[] }> = {
  meeting: { title: 'Meeting Notes — ', blocks: meetingTemplate },
  discovery: { title: 'Discovery — ', blocks: discoveryTemplate },
  design: { title: 'Solution Design — ', blocks: designTemplate },
  issue: { title: 'Issue — ', blocks: issueTemplate },
  general: { title: '', blocks: generalTemplate },
};

// ─── Section-based template definitions (for seeding Firestore) ────

function sectionDef(id: string, title: string, description: string, defaultBullets: string[], order: number): TemplateSectionDef {
  return { id, title, description, defaultBullets, order };
}

export const DEFAULT_TEMPLATE_SECTIONS: Record<string, { name: string; color: string; sections: TemplateSectionDef[] }> = {
  meeting: {
    name: 'Meeting',
    color: '#3b82f6',
    sections: [
      sectionDef('m-obj', 'Objectives', 'What are the goals for this meeting?', [], 0),
      sectionDef('m-att', 'Attendees', 'Who is attending?', [], 1),
      sectionDef('m-pain', 'Key Pain Points', 'What challenges were discussed?', [], 2),
      sectionDef('m-current', 'Current State', 'Describe the current situation', [], 3),
      sectionDef('m-future', 'Future State', 'Describe the desired future state', [], 4),
      sectionDef('m-demo', 'Demo Notes', 'Notes from any demo shown', [], 5),
      sectionDef('m-actions', 'Action Items', 'Action items from the meeting', [], 6),
      sectionDef('m-next', 'Next Steps', 'Agreed next steps', [], 7),
    ],
  },
  discovery: {
    name: 'Discovery',
    color: '#8b5cf6',
    sections: [
      sectionDef('d-overview', 'Customer Overview', 'Company background and context', ['Company:', 'Website:', 'Industry:', 'Size / Revenue:', 'Current ERP:'], 0),
      sectionDef('d-website', 'Website Summary', 'Click "Summarize Website" to auto-populate', [], 1),
      sectionDef('d-stakeholders', 'Key Stakeholders', 'Key people involved', ['Name — Role — Influence'], 2),
      sectionDef('d-pain', 'Pain Points & Challenges', 'What problems do they face?', [], 3),
      sectionDef('d-requirements', 'Requirements', 'Must-have and nice-to-have requirements', ['Must Have:', 'Nice to Have:'], 4),
      sectionDef('d-processes', 'Key Business Processes', 'Core processes to support', ['Order to Cash:', 'Procure to Pay:', 'Financial Close:', 'Inventory / WMS:'], 5),
      sectionDef('d-integrations', 'Integration Landscape', 'Systems to integrate with', ['System — Direction — Data'], 6),
      sectionDef('d-timeline', 'Timeline & Budget', 'Project timeline and budget', ['Go-live target:', 'Budget range:', 'Decision timeline:'], 7),
      sectionDef('d-next', 'Next Steps', 'Agreed next steps', [], 8),
    ],
  },
  design: {
    name: 'Solution Design',
    color: '#06b6d4',
    sections: [
      sectionDef('ds-summary', 'Solution Summary', 'High-level solution overview', [], 0),
      sectionDef('ds-scope', 'Scope', 'In scope and out of scope items', ['In Scope:', 'Out of Scope:'], 1),
      sectionDef('ds-architecture', 'Solution Architecture', 'Describe the NetSuite configuration approach', [], 2),
      sectionDef('ds-customizations', 'Customizations', 'Scripts, workflows, custom records', ['Type (Script / Workflow / Custom Record):'], 3),
      sectionDef('ds-data', 'Data Migration Plan', 'Data migration approach', ['Source system:', 'Record types:', 'Volume estimates:', 'Cleansing needs:'], 4),
      sectionDef('ds-integrations', 'Integration Design', 'Integration specifications', ['System — Method (REST/SOAP/File) — Frequency'], 5),
      sectionDef('ds-risks', 'Risks & Assumptions', 'Known risks and assumptions', [], 6),
      sectionDef('ds-decisions', 'Open Decisions', 'Decisions still to be made', [], 7),
      sectionDef('ds-actions', 'Action Items', 'Action items', [], 8),
    ],
  },
  issue: {
    name: 'Issue',
    color: '#ef4444',
    sections: [
      sectionDef('i-summary', 'Issue Summary', 'Brief description of the issue', [], 0),
      sectionDef('i-details', 'Details', 'Severity, module, reporter', ['Severity: High / Medium / Low', 'Module / Area:', 'Reported by:', 'Date identified:'], 1),
      sectionDef('i-impact', 'Business Impact', 'How does this affect the business?', [], 2),
      sectionDef('i-steps', 'Steps to Reproduce', 'How to reproduce the issue', [], 3),
      sectionDef('i-expected', 'Expected Behavior', 'What should happen?', [], 4),
      sectionDef('i-actual', 'Actual Behavior', 'What actually happens?', [], 5),
      sectionDef('i-root', 'Root Cause Analysis', 'Root cause investigation', [], 6),
      sectionDef('i-resolution', 'Resolution / Workaround', 'How was it resolved?', [], 7),
      sectionDef('i-actions', 'Follow-up Actions', 'Follow-up items', [], 8),
    ],
  },
  general: {
    name: 'General',
    color: '#6b7280',
    sections: [
      sectionDef('g-notes', 'Notes', 'General notes', [], 0),
    ],
  },
};
