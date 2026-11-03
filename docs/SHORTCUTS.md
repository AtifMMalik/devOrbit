# devOrbit Keyboard Shortcuts Reference

devOrbit provides keyboard shortcuts designed for high-velocity software development.

---

## 1. Global Navigation & Actions

All global shortcuts use capture-phase event listeners to suppress default browser actions. Because macOS Chrome/Safari intercepts `⌘N`, `⌘T`, and `⌘S` at the native application menu level in regular browser tabs, devOrbit provides dual `⌥` (Option/Alt) key combinations and single-key shortcuts when not typing in an input field:

| Primary Shortcut (macOS) | Alt Shortcut | Single-Key (Non-Input) | Windows / Linux | Action |
|---|---|---|---|---|
| `⌘ + N` | `⌥ + N` | `n` / `c` | `Ctrl + N` / `Alt + N` | **Create New Task Screen** |
| `⌘ + ⇧ + N` | `⌥ + ⇧ + N` | `p` | `Ctrl + ⇧ + N` / `Alt + ⇧ + N` | **Create New Project Screen** |
| `⌘ + S` | `⌥ + S` | — | `Ctrl + S` / `Alt + S` | **Save Task / Save Project** (Global save on new/edit screens) |
| `⌘ + T` / `⌘ + B` | `⌥ + T` / `⌥ + B` | `[` | `Ctrl + T` / `Ctrl + B` | **Toggle Sidebar** (Full 260px vs Thin 56px dock) |
| `⌘ + F` / `⌘ + K` | `⌥ + F` | `/` | `Ctrl + F` / `Ctrl + K` | **Focus Searchbar / Find on Page** |
| `⌘ + Z` | `⌥ + Z` | `u` | `Ctrl + Z` / `Alt + Z` | **Undo** (Move task back to previous list, undo creation, or recover deleted task/project) |
| `⌘ + Y` / `⌘ + ⇧ + Z` | `⌥ + Y` | `r` | `Ctrl + Y` / `Ctrl + ⇧ + Z` / `Alt + Y` | **Redo** (Move task forward to next list, redo creation, or re-delete task/project) |
| `Escape` | — | `Escape` | `Escape` | **Dismiss Search & Close Modals** |

---

## 2. In-Page Search & Keyword Navigation

When the searchbar is active:

| Action | Shortcut | Description |
|---|---|---|
| **Find Next Match** | `Enter` (or click badge) | Smoothly scrolls to and highlights the next matching keyword on the page |
| **Find Previous Match** | `Shift + Enter` | Smoothly scrolls to and highlights the previous matching keyword on the page |
| **Clear Highlights** | `(X)` Button | Instantly clears highlights across all task views and resets search |

---

## 3. Kanban Board Multi-Select & Clipboard Operations

When interacting with tasks on the Kanban board:

| Shortcut | Description |
|---|---|
| `⌘ + Click` / `Ctrl + Click` | **Multi-Select**: Select or deselect individual task cards |
| `⌘ + A` / `Ctrl + A` | **Select All**: Select all task cards in the currently hovered column |
| `⌘ + C` / `Ctrl + C` | **Copy**: Copy selected tasks to internal clipboard |
| `⌘ + X` / `Ctrl + X` | **Cut**: Cut selected tasks to internal clipboard |
| `⌘ + V` / `Ctrl + V` | **Paste**: Paste clipboard tasks into hovered column |
| `Delete` / `Backspace` | **Move to Bin**: Soft-delete all selected tasks to the Recycle Bin |
| `Escape` | **Clear Selection**: Deselect all currently selected tasks |
| **Double-Click** | **Full Task Screen**: Navigate to unified task screen for viewing/editing |

---

## 4. Global Undo / Redo Workflow (`⌘Z` / `⌘Y`)

devOrbit maintains an internal reversible history stack for actions performed across the workspace:
- **Task Movements Across Lists**: Moving a task from `Hot Fix` to `Current` or `Later` pushes a reversible state. Pressing `⌘Z` moves it back to `Hot Fix`. Pressing `⌘Y` moves it forward again.
- **Sequential Task Creation**: You can create multiple tasks sequentially; pressing `⌘Z` undoes each creation one by one, and `⌘Y` re-creates them.
- **Task & Project Deletions**: Deleting tasks or projects can be immediately undone with `⌘Z`, popping from the stack and restoring them to their original location.

---

## 5. Suppression of Browser Defaults

To prevent accidental browser tab/window opening while working in the app, `useKeyboardShortcuts.js` registers its keydown listener with:

```javascript
window.addEventListener('keydown', handleKeyDown, { capture: true });
```

This guarantees predictable application-level shortcuts across browsers, progressive web apps (PWAs), and desktop environments.
