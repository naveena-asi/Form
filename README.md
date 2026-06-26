# VENUSPRO — Dynamic Form Platform

> One Platform. Unlimited Possibilities.
> A metadata-driven Form Builder, Rule & Rating Engine — built as a navigable visual
> prototype with a fully **live** runtime for the worked Commercial Auto example.

This is a faithful, interactive build of the VENUSPRO blueprint. Every form is described
as **metadata** (the "single source of truth"); a runtime renderer reads that metadata and
renders, validates, calculates and rates the form — no per-form code.

Styling follows the [mevak.in](https://mevak.in) aesthetic — clean modern SaaS: Inter
typography, generous whitespace, flat surfaces, subtle radii — over the VENUSPRO brand
(navy + emerald).

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173 (web only)
npm run dev:full   # web + AI backend (needs ANTHROPIC_API_KEY for real AI)
npm run build      # type-check (tsc) + production build
```

Requires Node.js ≥ 18. For AI Form Generation, copy `.env.example` to `.env` and set
`ANTHROPIC_API_KEY`; without it, AI Generate falls back to a local heuristic draft.

## What's live vs. prototyped

The **Runtime Preview** (`/preview`) is wired for real against the
`Commercial Auto Application` metadata in `src/data/commercialAuto.ts`:

- **Conditional logic** — selecting Business Type = *Trucking* reveals the Vehicle section;
  Coverage = *Full Coverage* hides the liability limit; > 5 vehicles requires driver details.
- **Repeating grids** — the Vehicles / Drivers tables support add / clone / delete rows.
- **Formula engine** — the estimated premium recomputes live (`src/engines/formulaEngine.ts`).
- **Validation engine** — field, cross-field and form checks at blocker / warning / info levels.
- **Rating engine** — IF-THEN rules produce premium, tier, eligibility, referrals and messages.

Use **Load Sample Data** on the Preview / Formula / Rule screens to populate a realistic
scenario instantly.

### Two personas (Admin ↔ Customer)

A **persona switcher** ("Viewing as …") in the top bar toggles between:

- **Admin Console** — the full designer/builder app described here.
- **Customer Portal** (`/portal`) — a self-service experience for an end customer:
  **Home** (account summary + quick actions), **My Policies** (`/portal/policies`), and a
  **Policy detail** view (coverages, documents, premium) with actions to **Request a Change
  (endorse)**, **File a Claim**, **Renew**, or **Cancel**. Each action loads the matching
  metadata-driven form and opens a clean, branded **applicant flow** (`/apply`) — guided steps,
  friendly validation, review, and a confirmation/quote. The same engines power both personas.

The **authoring & builder screens are fully editable** — every add / edit / delete writes back
to the shared `useDesignerStore` (persisted to `localStorage`), and the change is reflected
live in Preview:

- **Section Builder** — add / reorder / delete sections, edit layout, columns, collapsible, required.
- **Field Builder** — click any of the 30+ field types to add it, edit label / API name / help /
  options / formula / required, reorder and delete.
- **Conditional Logic / Validation / Rule&Rating** — modal editors (with a shared condition
  builder) to create, edit and delete rules; rating rules show a live "fires now" indicator.
- **Lookup Builder** — create tables, edit cells, add / delete rows.
- **Workflow, Form Basic Info, Versioning** — persist nav style, form metadata, clone / rollback / publish.

All global chrome is wired too: the topbar product tabs, search, notifications and user menu
navigate; the Form Library rows have action menus; **Settings → Danger Zone → Reset Everything**
restores the seeded defaults. Toasts confirm every action.

## Architecture

```
Metadata (src/data/types.ts, commercialAuto.ts)
        │  single source of truth
        ▼
Engines (src/engines/)            Store (src/store/useFormStore.ts)
  conditionEngine  ─┐               answers + grid rows, localStorage
  validationEngine  ├─ useRuntime ──┘
  formulaEngine     │  (src/runtime/useRuntime.ts)
  ratingEngine     ─┘
        │
        ▼
Renderer (src/components/runtime/, src/pages/RuntimePreview.tsx)
```

## Project layout

| Path | Purpose |
|------|---------|
| `src/data/` | Metadata model + sample form, lookups, rules, audit, field catalog |
| `src/engines/` | condition / validation / formula / rating engines |
| `src/runtime/` | `useRuntime` — runs all engines against live answers |
| `src/store/` | `useDesignerStore` (editable form metadata) · `useFormStore` (answers) · `useToast` |
| `src/components/ui/` | Reusable UI kit (Button, Card, Table, Tabs, Modal, Dropdown, ConfirmDialog, Toaster…) |
| `src/components/designer/` | Shared condition editor used by rule/rating modals |
| `src/components/runtime/` | Field + grid renderers |
| `src/components/layout/` | App shell, sidebar, topbar, nav |
| `src/pages/` | The ~20 blueprint screens |

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router · Zustand · lucide-react.

## Phases 2–4

Beyond the Phase-1 core, the following blueprint capabilities are implemented:

- **Phase 2** — Repeating grids, formula engine, lookup tables (all live & editable).
- **Phase 3** — Rule/Rating engine; Runtime Preview honours all four **navigation styles**
  (Wizard / Tabs / Accordion / Single Page) with section-level gating; **versioning** takes
  real form-definition snapshots you can clone & restore; **true PDF generation** (jsPDF,
  field-mapped) on Outputs and Review & Submit.
- **Phase 4** — **Drag-and-drop** reordering of sections & fields (`src/lib/useReorder.ts`);
  **AI Form Generation** (`/ai`) — a plain-English description → Claude (Opus 4.8, structured
  outputs) via the `server/` Express proxy → normalized into editable metadata, with a local
  fallback when no key is set.

## Roadmap (remaining)

REST backend + database for forms/submissions · external lookup/rating integrations ·
true Word generation · multi-tenancy & SSO.
