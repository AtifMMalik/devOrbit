# devOrbit Features & User Experience Guide

This document describes the key features and workflows available in devOrbit.

---

## 1. Kanban Board & Full Viewport Width

The devOrbit Kanban board organizes project development into structured columns that dynamically stretch across the entire viewport width (`flex: 1 1 0`):

```text
+-----------------------+-----------------------+-----------------------+
|     🔥 HOT FIX        |        CURRENT        |         LATER         |
|                       |                       |                       |
| [Critical bugs/issues]| [Active deliverables] | [Planned / Backlog]   |
+-----------------------+-----------------------+-----------------------+
|  ▼ DONE (Collapsible milestone drawer at bottom)                      |
+-----------------------------------------------------------------------+
```

### Hotfix Transitions
- **Separate List**: Hotfix has its own dedicated column alongside Current and Later.
- **Auto-Move**: Any task tagged with `isHotfix: true` or the `#hotfix` tag automatically moves to the Hotfix list.
- **Drag Transitions**:
  - Dragging a task into `🔥 Hot Fix` marks `isHotfix = true` and updates status to `hotfix`.
  - Dragging a task out of `🔥 Hot Fix` into `Current` or `Later` updates status, sets `isHotfix: false`, and strips `'hotfix'` from tags so it lands cleanly without being trapped.
  - Dragging any task into the bottom `Done` drawer marks it as complete with a confetti celebration.

---

## 2. Multi-Item Selection & Clipboard Operations

The Kanban board supports developer-speed batch operations:

| Interaction | Shortcut | Action |
|---|---|---|
| **Toggle Selection** | `Cmd + Click` or `Ctrl + Click` | Adds/removes card from selection set |
| **Select All** | `Cmd + A` or `Ctrl + A` | Selects all cards in the hovered column |
| **Copy Tasks** | `Cmd + C` or `Ctrl + C` | Copies selected cards to clipboard |
| **Cut Tasks** | `Cmd + X` or `Ctrl + X` | Stages selected cards for movement |
| **Paste Tasks** | `Cmd + V` or `Ctrl + V` | Pastes cards into currently hovered column |
| **Batch Move** | Drag any selected card | Moves all selected cards together |
| **Delete to Bin** | `Delete` or `Backspace` | Soft-deletes all selected cards to Recycle Bin |

---

## 3. Unified Screens for Creation & Editing (Zero Modals)

Instead of restrictive modal dialog popups, devOrbit uses dedicated, minimal, full-screen experiences for both creating and editing items:

- **Unified Task Screen (`/project/:projectId/tasks/new` or `/project/:projectId/tasks/:taskId`)**:
  - When creating a task, initializes an empty draft with title, hotfix toggle, prompt box, description editor with live preview, and subtask list.
  - When editing a task, loads all existing data, displays breadcrumb navigation back to project tasks, reveals completion notes if marked completed, and provides a "Move to Recycle Bin" option.
  - Primary button is clearly labeled **"Save Task"**.
  - Supports `Cmd + S` (`Ctrl + S`) to save instantly without moving the hand to the mouse.
  - Bottom-right Floating Action Button (FAB) is automatically hidden when on this screen to eliminate UI noise.
  - **Auto-Draft Persistence**: New task inputs are automatically persisted as drafts in `localStorage` if navigated away before saving.
  - **Search Highlight Integration**: When navigated from global search, matching keywords are highlighted in title, prompt, description, and subtasks.

- **Unified Project Screen (`/project/new` or `/project/:projectId/edit`)**:
  - Handles new project configuration and existing project updates in one clean screen.
  - Primary button is clearly labeled **"Save Project"**.
  - Supports `Cmd + S` (`Ctrl + S`) for instant keyboard saving.
  - Features project logo upload with automatic square thumbnail generation, hierarchy selector, author, live URL, GitHub URL, color palette presets + custom hex picker, and full README markdown editor with preview tab.

---

## 4. Global Undo & Redo Engine (`⌘Z` & `⌘Y`)

devOrbit tracks user workspace actions using a dual-stack history engine:
- **Task Column Movements**: Moving a task from `Hot Fix` to `Current` or `Later` pushes a move state. Pressing `⌘Z` returns it back to `Hot Fix`. Pressing `⌘Y` (or `⌘⇧Z`) advances it forward again.
- **Multiple Sequential Tasks**: A developer can create multiple tasks sequentially; pressing `⌘Z` reverses each task creation step by step. Pressing `⌘Y` re-creates them.
- **Soft Deletions**: Deleting tasks or projects pushes to the stack; pressing `⌘Z` instantly recovers the last deleted item.

---

## 5. Thin Collapsible Sidebar (56px Mini-Dock)

The sidebar is never completely hidden on desktop. When collapsed, it transitions into a 56px thin icon dock featuring:
1. **DevOrbit Logo**: Clickable brand icon linking back to workspace root.
2. **Toggle Button**: Located right below the DevOrbit icon for rapid expand/collapse.
3. **Project Overview & Work Analysis**: Direct icon links to `/` (Projects Overview) and `/analytics` (Work Analytics).
4. **Projects' Icons**: Vertically scrollable stack of project avatars with active border indicator and a quick `+` button to add new projects.
5. **Bottom Icons**: Dedicated shortcuts for **Recycle Bin** (with dynamic badge showing active soft-deleted count) and **Settings**.

---

## 6. In-Page Search & Keyword Highlighting

- **Inline Suggestions in Header**: Global searchbar displays live suggestion popover directly beneath the header without dimming modals.
- **Focus-Out Dismissal**: Focus shifts away from searchbar automatically dismisses suggestions.
- **Persistent Search & Highlighting**:
  - Typing a keyword and pressing `Enter` highlights occurrences on the page with `<mark class="search-highlight">`.
  - Pressing `Enter` cycles forward to the next match and smoothly scrolls it into view.
  - Pressing `Shift + Enter` cycles backward to the previous match.
  - Clicking the `(X)` icon clears the search query and strips highlights across all views.

---

## 7. Project Color Presets & Custom Hex Picker

Project accent styling offers:
- **Palette Presets**: Curated developer-friendly color swatches.
- **Custom Color Picker**: HTML5 native dropper/picker swatch supporting any hex color.
- **Direct Hex Input**: Monospace hex input field with live validation for exact brand alignment.

---

## 8. Vertical-Only Textarea Expansions

All textareas across devOrbit (task descriptions, prompts, completion notes, project READMEs) are strictly constrained to vertical expansion:
```css
textarea {
  resize: vertical !important;
}
```
This guarantees clean horizontal alignment across responsive layouts.

---

## 9. 30-Day Recycle Bin & Automatic Purge

- **Soft Delete**: Deleting a project or task moves it to `deletedTasks` or `deletedProjects`.
- **30-Day Expiration**: Items remain recoverable for 30 days.
- **Startup Purge**: During the 2-second app preloader on launch, expired items (> 30 days) are permanently cleaned from storage automatically.
