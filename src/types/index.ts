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

export interface NoteSection {
  id: string;
  title: string;
  bullets: string[];
  content: string;
  order: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // BlockNote JSON stringified (legacy)
  sections: NoteSection[]; // new section-based content
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

// ─── Data Workbench types (Phase 4) ──────────────────────────

export type NetSuiteRecordType =
  | 'customer'
  | 'vendor'
  | 'inventoryItem'
  | 'salesOrder'
  | 'purchaseOrder'
  | 'journalEntry'
  | 'contact'
  | 'employee';

export const NETSUITE_RECORD_TYPES: { value: NetSuiteRecordType; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'inventoryItem', label: 'Inventory Item' },
  { value: 'salesOrder', label: 'Sales Order' },
  { value: 'purchaseOrder', label: 'Purchase Order' },
  { value: 'journalEntry', label: 'Journal Entry' },
  { value: 'contact', label: 'Contact' },
  { value: 'employee', label: 'Employee' },
];

export type DetectedColumnType = 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'currency' | 'mixed';

export interface ValueFrequency {
  value: string;
  count: number;
}

export interface ColumnProfile {
  name: string;
  detectedType: DetectedColumnType;
  nonNullCount: number;
  nullCount: number;
  uniqueCount: number;
  duplicateCount: number;
  min: string | null;
  max: string | null;
  topValues: ValueFrequency[];
  sampleValues: string[];
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: string;
}

export interface MappingTemplate {
  id: string;
  userId: string;
  name: string;
  recordType: NetSuiteRecordType;
  mappings: FieldMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NetSuiteFieldDef {
  fieldId: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'currency' | 'boolean' | 'select';
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface ExportResult {
  csvContent: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  issues: ValidationIssue[];
}

export type WorkbenchStep = 'upload' | 'profile' | 'map' | 'export';

// ─── Note Template types ────────────────────────────────────
export interface TemplateSectionDef {
  id: string;
  title: string;
  description: string;
  defaultBullets: string[];
  order: number;
}

export interface NoteTemplate {
  id: string;
  userId: string;
  name: string;
  noteType: NoteType;
  sections: TemplateSectionDef[];
  isBuiltIn: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
