# devOrbit Developer & Contributing Guide

Welcome to the devOrbit developer guide. This document outlines setup instructions, script commands, testing guidelines, and conventions.

---

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **Package Manager**: npm v10+

---

## 2. Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/devOrbit.git
cd devOrbit
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `npm run dev` | Launches local Vite development server with HMR |
| `build` | `npm run build` | Compiles optimized production bundle with Vite |
| `preview` | `npm run preview` | Serves the production build locally |
| `lint` | `npm run lint` | Runs Oxlint across all source files |
| `test` | `npm test` | Runs the automated Node test runner test suites |

---

## 4. Testing Guidelines

Tests are written using Node's native test runner (`node:test` and `node:assert`). They run fast and require zero external dependencies:

```bash
npm test
```

### Test Suites (`tests/`)
- `tests/storage.test.js`: Verifies data sanitization, schema normalization, 30-day purge for tasks and projects, and backwards compatibility.
- `tests/recycleBin.test.js`: Validates soft delete, project recovery, task restoration, 30-day countdown calculations, and `Cmd+Z` undo stack logic.
- `tests/markdownParser.test.js`: Ensures markdown task export and import parsing work reliably.
- `tests/taskOperations.test.js`: Tests multi-selection sets, clipboard copy/cut/paste transitions, and task draft persistence.

When adding new features or fields:
1. Ensure `sanitizeWorkspaceData` in `src/utils/storage.js` handles default values defensively.
2. Add corresponding test assertions in `tests/`.
3. Verify that `npm test` and `npm run build` pass with zero errors.

---

## 5. Code Style & Architecture Rules

1. **Non-Breaking Changes**: Never mutate saved user data destructively. Always provide backwards-compatible fallback values for newly introduced fields.
2. **Local Storage Guards**: Check `typeof localStorage !== 'undefined'` before accessing browser storage to ensure Node test runners and headless environments function without errors.
3. **Vertical-Only Textareas**: Never remove `textarea { resize: vertical !important; }`. Keep textareas bounded vertically to protect responsive layouts.
4. **Capture Phase Shortcuts**: Register application-wide hotkeys with `{ capture: true }` and explicitly call `e.preventDefault()` and `e.stopPropagation()` when intercepting browser default shortcuts.

