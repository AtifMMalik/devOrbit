# devOrbit

> **Developer-first workspace engineered for tracking projects, agile task flows, specification prompts, and development momentum.**

![devOrbit Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-8.2-646cff.svg)
![Tests](https://img.shields.io/badge/tests-24%20passed-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## Overview

**devOrbit** is a local-first engineering productivity hub designed to bridge software planning and developer velocity. Built with React 19 and Vite, devOrbit delivers high-performance project hierarchy management, a customizable Kanban board, prompt engineering integration, and offline persistence.

---

## Key Features

### 1. Hierarchical Projects
- **Rich Project Metadata**: Author attribution, markdown README specifications, deployed live links, and GitHub repository badges.
- **Visual Branding**: Custom color tone picker along with preset developer palette swatches, plus SVG and image logo optimization.
- **Nested Subprojects**: Unlimited subproject depth for organizing microservices, frontend clients, or documentation tiers.

### 2. Multi-Queue Kanban Board
- **Dedicated Hot Fix Queue**: Immediate separation of critical issues into a dedicated `🔥 HOT FIX` list.
- **Lifecycle Queues**: Top rows for `Hot Fix`, `Current`, and `Later` deliverables.
- **Collapsible Done Section**: Completed tasks reside in an elegant collapsible bottom drawer with confetti celebrations on completion.

### 3. Specification Prompts for AI Pairing
- **1-Click Copy**: Every task includes an AI-ready prompt box that can be copied directly from the task card in a single click.
- **Expandable Specs**: Expand prompts directly on the board or in full detail view without cluttering card dimensions.

### 4. Developer Clipboard & Multi-Select Operations
- **Multi-Selection**: `⌘ + Click` / `Ctrl + Click` to select multiple tasks simultaneously.
- **Clipboard Shortcuts**: `⌘C` (Copy), `⌘X` (Cut), `⌘V` (Paste into hovered column), `⌘A` (Select all in column).
- **Batch Drag & Drop**: Dragging any selected card moves all selected items together.

### 5. Unified Full-Screen Task & Project Management
- **Zero Modal Dialogs**: Creating or editing tasks and projects opens in dedicated, minimal, full-screen workflows (`/project/:projectId/tasks/:taskId`, `/project/:projectId/edit`, etc.).
- **Global Save (`⌘S`)**: Direct keyboard saving with `⌘S` (`Ctrl+S`) and unambiguous **"Save Task"** and **"Save Project"** buttons.
- **Double-Click Navigation**: Double-clicking any Kanban card opens it directly in the unified full task view.
- **Full Markdown Engine**: Live edit and preview tabs, subtasks with completion percentages, timestamps, deadlines, prompt specifications, and completion notes.

### 6. Header Search with Persistent Keyword Highlighting
- **Inline Suggestions**: Non-blocking search dropdown directly below the header searchbar.
- **Auto-Dismissal**: Suggestions disappear immediately upon focus-out or clicking outside.
- **Persistent Highlighting**: Pressing `Enter` persists the keyword in the searchbar and keeps matches highlighted (`<mark>`) across task cards and the full task screen until cleared.
- **Shortcut**: `⌘F` (or `⌘K`) instantly focuses the header searchbar.

### 7. Dual History Undo / Redo Engine (`⌘Z` & `⌘Y`)
- **Move Undo/Redo**: Moving tasks between columns (e.g. `Hot Fix` to `Current`) can be reversed with `⌘Z` and reapplied with `⌘Y`.
- **Sequential Task Creation**: Create multiple tasks in sequence and undo them one by one with `⌘Z`, or redo with `⌘Y`.
- **30-Day Recycle Bin & Recovery**: Soft-deleted tasks and projects are retained for 30 days and can be immediately restored via `⌘Z` or the Recycle Bin drawer.
- **Automated Purging**: A 2.2-second sober app preloader purges soft-deleted items older than 30 days on startup.

### 8. Thin Collapsible Sidebar (56px Mini-Dock)
- **Always Accessible**: Collapsing the sidebar transitions into a sleek 56px mini-dock containing the DevOrbit logo, toggle button, Overview (`/`) and Analytics (`/analytics`) icons, scrollable project icons, and bottom icons for Recycle Bin and Settings.

---

## Keyboard Shortcuts

| Shortcut (macOS) | Shortcut (Windows/Linux) | Action |
|---|---|---|
| `⌘ + N` / `⌥ + N` | `Ctrl + N` / `Alt + N` | **New Task Screen** |
| `⌘ + ⇧ + N` / `⌥ + ⇧ + N` | `Ctrl + Shift + N` / `Alt + Shift + N` | **New Project Screen** |
| `⌘ + S` / `⌥ + S` | `Ctrl + S` / `Alt + S` | **Save Task / Save Project** |
| `⌘ + T` / `⌥ + T` | `Ctrl + T` / `Alt + T` | **Toggle Sidebar** (Full 260px vs Thin 56px dock) |
| `⌘ + F` / `⌘ + K` | `Ctrl + F` / `Ctrl + K` | **Focus Searchbar / Find on Page** |
| `⌘ + Z` / `⌥ + Z` | `Ctrl + Z` / `Alt + Z` | **Undo** (Move to previous list, undo creation, recover deleted item) |
| `⌘ + Y` / `⌘ + ⇧ + Z` | `Ctrl + Y` / `Ctrl + ⇧ + Z` | **Redo** (Move to next list, redo creation, re-delete item) |
| `⌘ + Click` | `Ctrl + Click` | **Multi-Select Task Cards** |
| `⌘ + A` | `Ctrl + A` | **Select All Cards in Column** |
| `⌘ + C` | `Ctrl + C` | **Copy Selected Tasks** |
| `⌘ + X` | `Ctrl + X` | **Cut Selected Tasks** |
| `⌘ + V` | `Ctrl + V` | **Paste Tasks into Column** |
| `Delete` / `Backspace` | `Delete` / `Backspace` | **Move Selected to Recycle Bin** |
| `Escape` | `Escape` | **Close Modals / Deselect** |

---

## Developer Documentation

Comprehensive technical documentation is maintained in the [`docs/`](./docs) directory:

- [**System Architecture**](./docs/ARCHITECTURE.md): Component hierarchy, routing layout, and design system variables.
- [**Data Model & Storage**](./docs/DATA_MODEL.md): TypeScript interfaces, schema normalization, and 30-day purge mechanics.
- [**State Management**](./docs/STATE_MANAGEMENT.md): React context architecture, optimistic updates, and `Cmd+Z` deletion stack.
- [**Features Guide**](./docs/FEATURES_GUIDE.md): Deep-dive into Kanban queues, AI prompts, color pickers, and search highlights.
- [**Keyboard Shortcuts Reference**](./docs/SHORTCUTS.md): Full shortcut matrix and browser default suppression logic.
- [**Contributing & Testing**](./docs/CONTRIBUTING.md): Local environment setup, test runner commands, and code conventions.

---

## Quick Start

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/your-username/devOrbit.git
cd devOrbit

# Install dependencies
npm install

# Start local dev server (http://localhost:5173)
npm run dev

# Run automated unit tests
npm test

# Build production bundle
npm run build

# Run Oxlint
npm run lint
```

---

## Testing

devOrbit features an automated unit test suite using Node's native test runner (`node:test`):

```bash
npm test
```

```text
▶ Markdown Task Parser & Exporter (25ms)
▶ Recycle Bin & Soft Delete Logic (2.7ms)
▶ Storage & Data Sanitization (3.2ms)
▶ Task Operations & Clipboard & Drafts (1.9ms)
ℹ tests 17
ℹ suites 4
ℹ pass 17
ℹ fail 0
```

---

## License

This project is licensed under the MIT License.
