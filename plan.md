# SA Command Center — Project Plan (Personal Edition)

## Project Overview

The SA Command Center is a personal NetSuite-centric "sales/delivery cockpit" — a single web app where you manage notes, agendas, demo prep, and data tools for your Solution Architect workflow. Built as a single-user app on Firebase, designed to grow into a multi-user platform later. Slack and Microsoft 365 integrations are deferred until the core app is solid.

## Goals & Success Criteria

| Goal | Success Metric |
|------|---------------|
| Personal SA dashboard | One UI for all pre-meeting prep, notes, and demo tools |
| Notes system | Create, tag, search, and template meeting notes with rich text |
| NetSuite MCP integration | Connect to demo environments, run playbook actions from UI |
| Agenda generation | Build agendas from templates, export to Word/PDF |
| Data workbench | Upload CSV/XLSX → profile → map to NetSuite fields → export |
| Firebase-powered | Firestore for data, Firebase Auth for login, Storage for files, Hosting for deploy |

## Target Audience

- **You** — a NetSuite Solution Architect who needs one place to prep for demos, take structured notes, and manage data

## Technical Architecture

### Simplified Two-Layer Stack (No Separate Backend)

```
┌──────────────────────────────────────────────┐
│  Client UI — React 19 + Vite + React Router  │
│  TailwindCSS, BlockNote, Zustand             │
├──────────────────────────────────────────────┤
│  Firebase (BaaS — no Express backend needed) │
│  ├─ Firebase Auth (Google sign-in)           │
│  ├─ Firestore (notes, agendas, configs)      │
│  ├─ Firebase Storage (file uploads, exports) │
│  └─ Firebase Hosting (deploy)                │
├──────────────────────────────────────────────┤
│  Future Integration Layer (deferred)         │
│  ├─ NetSuite MCP Client                     │
│  ├─ Microsoft Graph (Word/Outlook)           │
│  ├─ Slack Bolt                               │
│  └─ Cloud Functions (when backend needed)    │
└──────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, React Router 7, TailwindCSS, BlockNote (rich text editor), Zustand (state) |
| Auth | Firebase Auth (Google sign-in) |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Hosting | Firebase Hosting |
| Document gen (Phase 3) | Docxtemplater (Word), html-pdf (PDF) |
| Data processing (Phase 4) | PapaParse (CSV), SheetJS (XLSX) |
| Backend (when needed) | Firebase Cloud Functions |

## Feature Breakdown (MVP → Full)

### Phase 1 — Dashboard + Notes (MVP)
1. **Firebase Auth**: Google sign-in, auth state persistence, protected routes
2. **Command Center shell**: Sidebar nav, dashboard with tile grid, dark command-center theme
3. **Notes module**: BlockNote rich text editor, CRUD to Firestore, tagging (customer/opportunity/meeting/type)
4. **Meeting note template**: Structured template — objectives, attendees, pain points, current state, future state, actions
5. **Notes list**: Search, filter by tag, sort by date

### Phase 2 — NetSuite MCP + Demo Selector
6. **MCP config store**: Firestore collection for demo environments (server URL, credentials, allowed tools)
7. **Demo Selector UI**: Dropdown to pick demo tenant + scenario
8. **MCP client service**: Execute tool calls against selected environment
9. **Playbook library**: Predefined MCP prompt templates stored in Firestore

### Phase 3 — Agenda + Document Pipeline
10. **Agenda schema**: Meeting metadata + structured sections in Firestore
11. **Agenda builder page**: Pick opportunity + scenario → editable outline
12. **Word/PDF export**: Docxtemplater for .docx, HTML-to-PDF for .pdf → save to Firebase Storage
13. **Agenda templates**: Reusable patterns by industry/solution area

### Phase 4 — Data Workbench
14. **File upload**: Drag-and-drop CSV/XLSX via react-dropzone
15. **Data profiler**: Column types, nulls, duplicates, outliers
16. **Mapping UI**: Source columns → NetSuite fields, reusable mapping templates
17. **Export**: Generate NetSuite-ready import files + validation checklist

### Phase 5 — Refinement + Future Integrations
18. **Search**: Full-text search across notes and agendas
19. **AI helpers**: Summarize notes, extract risks, draft follow-up emails
20. **Metrics**: Personal dashboard — demos run, docs generated
21. **Slack + M365** (when ready): Cloud Functions backend for external API calls

## Implementation Phases

| Phase | Duration | Milestone |
|-------|----------|-----------|
| 1 — Dashboard + Notes | Weeks 1–2 | Log in, see dashboard, create/edit/tag/search notes |
| 2 — NetSuite MCP | Weeks 3–4 | Demo selector works, MCP playbooks execute from UI |
| 3 — Agenda + Docs | Weeks 5–6 | Agendas built and exported to Word/PDF |
| 4 — Data Workbench | Weeks 7–8 | CSV/XLSX upload → profile → map → export |
| 5 — Refinement | Weeks 9–10 | Search, AI helpers, metrics |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Firestore query limitations | Design flat collections with composite indexes; avoid deep nesting |
| NetSuite MCP API changes | Abstract MCP calls behind a service layer; pin SuiteApp version |
| No backend for integrations | Use Firebase Cloud Functions when Slack/M365 integrations are added |
| BlockNote learning curve | Start with basic features; extend with custom blocks later |
| Scope creep | Phase 1 must be fully usable before starting Phase 2 |

## Resources & References

- [Firebase Web SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Auth — Google Sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [NetSuite AI Connector Service (MCP)](https://www.netsuite.com/portal/products/artificial-intelligence-ai/mcp-server.shtml)
- [NetSuite MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_143403258.html)
- [BlockNote — Block-based React Editor](https://www.blocknotejs.org/)
- [Docxtemplater](https://docxtemplater.com/)
- [PapaParse — CSV Parser](https://www.papaparse.com/)
- [SheetJS — XLSX Parser](https://www.npmjs.com/package/xlsx)
