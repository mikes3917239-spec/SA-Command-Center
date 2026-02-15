export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
  uploadedAt: Date;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // BlockNote JSON stringified
  tags: string[];
  type: NoteType;
  customer: string;
  opportunity: string;
  websiteUrl: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type NoteType = 'meeting' | 'discovery' | 'design' | 'issue' | 'general';

export interface Tag {
  label: string;
  color: string;
}

export const NOTE_TYPES: { value: NoteType; label: string; color: string }[] = [
  { value: 'meeting', label: 'Meeting', color: '#3b82f6' },
  { value: 'discovery', label: 'Discovery', color: '#8b5cf6' },
  { value: 'design', label: 'Design', color: '#06b6d4' },
  { value: 'issue', label: 'Issue', color: '#ef4444' },
  { value: 'general', label: 'General', color: '#6b7280' },
];

export const PRESET_TAGS = [
  'customer',
  'opportunity',
  'follow-up',
  'demo',
  'order-to-cash',
  'procure-to-pay',
  'financial-close',
  'inventory',
  'crm',
];

// Demo Account types
export type DemoEnvironment = 'sandbox' | 'production';
export type DemoStatus = 'connected' | 'disconnected' | 'unknown';

export interface DemoAccount {
  id: string;
  userId: string;
  name: string;
  description: string;
  environment: DemoEnvironment;
  accountId: string;
  suiteAppUrl: string;
  status: DemoStatus;
  lastChecked: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEMO_ENVIRONMENTS: { value: DemoEnvironment; label: string; color: string }[] = [
  { value: 'sandbox', label: 'Sandbox', color: '#f59e0b' },
  { value: 'production', label: 'Production', color: '#3b82f6' },
];

export const DEMO_STATUSES: { value: DemoStatus; label: string; color: string }[] = [
  { value: 'connected', label: 'Connected', color: '#10b981' },
  { value: 'disconnected', label: 'Disconnected', color: '#ef4444' },
  { value: 'unknown', label: 'Unknown', color: '#6b7280' },
];

// ─── Shared Document types (Phase 3 PDF exports + Phase 4 uploads) ───
export type DocumentType = 'pdf' | 'csv' | 'xlsx' | 'json' | 'other';
export type DocumentSourceType = 'agenda' | 'data-workbench';

export interface Document {
  id: string;
  userId: string;
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  storagePath: string;
  downloadUrl: string;
  sourceType: DocumentSourceType;
  sourceId: string;
  createdAt: Date;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'json', label: 'JSON' },
  { value: 'other', label: 'Other' },
];

// ─── Agenda types ───────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface AgendaSection {
  id: string;
  title: string;
  timeSlot: string;
  duration: number;
  subItems: string[];
  enabled: boolean;
  isCustom: boolean;
  order: number;
}

export type AgendaStatus = 'draft' | 'final';

export interface Agenda {
  id: string;
  userId: string;
  customerName: string;
  title: string;
  dateTime: string;
  timezone: string;
  customerTeam: TeamMember[];
  netsuiteTeam: TeamMember[];
  sections: AgendaSection[];
  status: AgendaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const AGENDA_STATUSES: { value: AgendaStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#f59e0b' },
  { value: 'final', label: 'Final', color: '#10b981' },
];
