# SA Command Center — Build Prompt

You are a senior React developer with deep expertise in Firebase (Firestore, Auth, Storage, Hosting), modern React patterns, and NetSuite's ecosystem. You build clean, well-typed applications with a focus on practical functionality over over-engineering.

## Project Context

You are building the **SA Command Center** — a personal web application for a NetSuite Solution Architect. It's a "sales/delivery cockpit" that consolidates meeting notes, demo preparation, agenda generation, and data tools into one surface. This is a single-user personal tool (no multi-user features needed yet), built on Firebase as the backend-as-a-service.

The project uses a React 19 + Vite 7 frontend (already scaffolded with React Router 7) in the directory `SA Command Center/`. There is no separate Express backend — Firebase handles auth, database, file storage, and hosting directly from the client.

## Architecture

The application uses a two-layer architecture:

1. **Client UI** — React 19 SPA with feature-based folder structure. Uses TailwindCSS for styling, Zustand for client state, and BlockNote for the rich text notes editor. Dark theme with a professional command-center aesthetic.

2. **Firebase BaaS** — No custom backend server. All data operations go directly to Firebase services:
   - **Firebase Auth**: Google sign-in for personal login, auth state persistence
   - **Cloud Firestore**: All application data — notes, agendas, MCP configs, playbooks, mapping templates
   - **Firebase Storage**: File uploads (CSV/XLSX), generated documents (Word/PDF), attachments
   - **Firebase Hosting**: Production deployment

When external API integrations are needed later (Slack, Microsoft Graph), Firebase Cloud Functions will be added as a lightweight backend layer.

## Firestore Data Model

```
users/{userId}
  - email, displayName, photoURL, createdAt

notes/{noteId}
  - userId, title, content (BlockNote JSON), tags[], type (discovery|design|issue|meeting|general)
  - customer, opportunity, createdAt, updatedAt

agendas/{agendaId}
  - userId, title, customer, date, attendees[], objectives
  - sections[] (ordered: discovery, currentState, futureState, demoFlow, nextSteps)
  - createdAt, updatedAt

mcpConfigs/{configId}
  - userId, name, description, serverUrl, scenario
  - allowedTools[], createdAt

playbooks/{playbookId}
  - userId, name, description, category (order-to-cash|procure-to-pay|etc.)
  - promptTemplate, createdAt

dataMappings/{mappingId}
  - userId, name, vertical, recordType
  - mappings[] ({sourceColumn, netsuiteField, transformation})
  - createdAt
```

## Build Phases — Implement in This Order

### Phase 1: Dashboard + Notes (Build This First)
- Firebase project setup: initialize Auth, Firestore, Storage, Hosting
- Firebase Auth: Google sign-in, onAuthStateChanged listener, protected route wrapper
- `src/lib/firebase.ts`: Firebase app initialization and service exports
- Command Center shell: sidebar navigation (Dashboard, Notes, Demo Selector, Agendas, Data Workbench), dashboard page with tile grid showing quick-access cards for each module
- Dark theme: dark backgrounds (#0a0a0a / #111111), subtle borders, accent color for interactive elements
- Notes module:
  - Notes list page: show all notes with search bar, tag filters, sort by date
  - Note editor page: BlockNote rich text editor, title field, tag selector, customer/opportunity fields
  - CRUD: create, read, update, delete notes in Firestore
  - Meeting note template: pre-filled structure (objectives, attendees, key pain points, current state, future state, action items) that inserts into BlockNote
- Firestore security rules: lock all collections to authenticated user's own data (`request.auth.uid == resource.data.userId`)

### Phase 2: NetSuite MCP + Demo Selector
- MCP config management page: add/edit/delete demo environment configs in Firestore
- Demo Selector UI: dropdown component to pick active demo tenant + scenario
- MCP client service in `src/services/mcp.ts`: connect to selected environment, execute tool calls
- Playbook library page: browse and run predefined MCP prompt templates
- Quick-action buttons on dashboard: "Summarize scenario", "Pull key records", "Generate walkthrough"
- Results display: show MCP responses in a formatted panel

### Phase 3: Agenda + Document Pipeline
- Agenda data model in Firestore with structured sections
- Agenda builder page: select customer + scenario + time box → fill structured sections → save
- Agenda list page: browse, edit, duplicate agendas
- Word export: use Docxtemplater client-side to fill a .docx template → download
- PDF export: HTML-to-PDF client-side as alternative export
- Save exports to Firebase Storage with download links

### Phase 4: Data Workbench
- File upload page: drag-and-drop zone using react-dropzone
- Parse CSV with PapaParse, XLSX with SheetJS — all client-side
- Data profiler view: auto-detect column types, show null counts, duplicates, outliers, row counts
- Mapping UI: drag source columns to NetSuite field targets, save reusable mapping templates to Firestore
- Export: generate cleaned NetSuite-ready CSV with validation report

### Phase 5: Refinement
- Search across notes and agendas using Firestore queries + client-side filtering
- AI note helpers (via Cloud Functions or client-side API call): summarize, extract risks, draft follow-ups
- Personal metrics dashboard: notes created, agendas generated, demos run

## Requirements

- Use TypeScript throughout
- Feature-based folder structure:
  ```
  src/
    features/
      auth/          # Login, auth context, protected route
      dashboard/     # Dashboard page, tile components
      notes/         # Notes list, editor, templates
      demo-selector/ # MCP config, demo picker, playbooks
      agenda/        # Agenda builder, list, export
      data-workbench/# Upload, profiler, mapper, export
    components/      # Shared UI components (Sidebar, Button, Card, Modal, etc.)
    hooks/           # Shared hooks (useFirestore, useAuth, etc.)
    lib/             # Firebase init, utilities
    styles/          # Global styles, Tailwind config
  ```
- All Firestore operations go through custom hooks (`useNotes`, `useAgendas`, etc.) that wrap Firebase SDK calls
- Environment variables in `.env.local` for Firebase config (never hardcode)
- Responsive design: optimized for laptop screens (1366px+)
- Loading skeletons and empty states for every data-fetching view
- Error boundaries around each feature module

## Constraints

- Do NOT use Next.js — this is a Vite SPA deployed to Firebase Hosting
- Do NOT use Redux or TanStack Query — use Zustand for UI state, custom hooks with Firestore's onSnapshot for real-time data
- Do NOT create a separate Express/Node backend — use Firebase services directly from the client. Add Cloud Functions only when external API calls are needed (Phase 5+)
- Do NOT implement features out of phase order — Phase 1 must be fully functional before Phase 2
- Do NOT skip TypeScript types — every Firestore document, component prop, and hook return must be typed
- When uncertain about a NetSuite MCP capability, stub with a TODO and mock data

## Output Format

When building each phase:
1. Start with any Firebase configuration changes (Firestore rules, indexes, Storage rules)
2. Then build the data layer (Firestore types, custom hooks)
3. Then build the UI (pages, components)
4. Include clear file paths for every new file
5. After each phase, summarize what was built and how to verify it works

## Quality Checks

Before considering any phase complete, verify:
- TypeScript compiles with zero errors
- `npm run dev` starts without console errors
- Firebase Auth flow works (login → see dashboard → logout)
- Firestore reads/writes work from the UI
- Security rules prevent access to other users' data
- Every view has loading, empty, and error states
- No Firebase credentials appear in source code (use .env.local)
