# Advanced CRM Dashboard

A complete Next.js + TypeScript CRM dashboard based on the supplied task brief.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components (Radix primitives)
- TanStack Query
- @dnd-kit for drag-and-drop
- next-themes + Sonner

## Features
Customer search, sorting, pagination (10/25/50), advanced filters, saved filters, filter templates, add/edit/delete, details modal, validation, bulk status updates, CSV export, dark/light mode, debounced search, keyboard shortcut Ctrl/Cmd+K, and drag/reorder saved filters.

## Run
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

Data is persisted in browser localStorage so mutations survive refreshes without requiring a separate database/API server.
