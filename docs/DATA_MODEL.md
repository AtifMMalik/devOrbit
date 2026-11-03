# devOrbit Data Model & Storage Specification

This document details the data structures, schemas, validation rules, and persistence mechanisms utilized across devOrbit.

---

## 1. Core Schema Overview

All workspace state is encapsulated in a single structured entity:

```typescript
interface WorkspaceData {
  version: string;                    // Semantic schema version (e.g. "1.0.0")
  projects: Project[];               // Active project records
  tasks: Task[];                     // Active task records
  notes: Note[];                     // Project documentation pages
  deletedTasks: DeletedTask[];       // Soft-deleted tasks (30-day retention)
  deletedProjects: DeletedProject[]; // Soft-deleted projects (30-day retention)
}
```

---

## 2. Project Entity Schema

```typescript
interface Project {
  id: string;                        // Unique project ID (e.g. "proj_a1b2c3d4")
  parentId: string | null;           // Parent project ID for hierarchy, null for root
  name: string;                      // Project display name
  description: string;               // Scope and goals description
  author: string;                    // Project author or team lead
  readme: string;                    // Markdown specifications (README.md)
  liveUrl: string;                   // Deployed website or live service URL
  githubUrl: string;                 // GitHub repository link
  color: string;                     // Hex color tone (e.g. "#6366f1")
  logo: string | null;               // Compressed base64 data URI of logo/icon
  icon: string;                      // Lucide icon identifier (fallback)
  tags: string[];                    // Categorization tags
  todos: ChecklistItem[];            // Pre-flight to-do checklist
  testing: ChecklistItem[];          // Quality assurance testing checklist
  createdAt: string;                 // ISO 8601 timestamp
  updatedAt: string;                 // ISO 8601 timestamp
}
```

---

## 3. Task Entity Schema

```typescript
interface Task {
  id: string;                        // Unique task ID (e.g. "task_e5f6g7h8")
  projectId: string;                 // Associated project ID
  title: string;                     // Task summary / title
  description: string;               // Markdown description with acceptance criteria
  status: 'hotfix' | 'current' | 'later' | 'done'; // Kanban lifecycle stage
  priority: 'urgent' | 'high' | 'medium' | 'low';  // Execution priority
  tags: string[];                    // Search and filter tags
  deadline: string;                  // Target completion deadline (YYYY-MM-DD)
  dueDate: string;                   // Legacy alias synchronized with deadline
  taskPrompt: string;                // 1-click copyable specification prompt
  completionNote: string;            // Remarks, PR links, deployment commit hash
  isHotfix: boolean;                 // Flag marking critical urgent issue
  subtasks: Subtask[];               // Granular checklist items
  createdAt: string;                 // ISO 8601 creation timestamp
  updatedAt: string;                 // ISO 8601 update timestamp
}

interface Subtask {
  id: string;                        // Unique subtask ID
  text: string;                      // Subtask description
  completed: boolean;                // Completion status
}
```

---

## 4. Soft-Deleted Entities (Recycle Bin)

When tasks or projects are deleted, they are **soft-deleted** to protect against accidental data loss:

```typescript
interface DeletedTask extends Task {
  deletedAt: string;                 // ISO 8601 deletion timestamp
}

interface DeletedProject extends Project {
  deletedAt: string;                 // ISO 8601 deletion timestamp
  associatedTasks: Task[];           // Preserved tasks belonging to this project
  associatedNotes: Note[];           // Preserved notes belonging to this project
  childProjects?: Project[];         // Preserved subprojects
}
```

### 30-Day Auto-Purge Policy
1. On each application launch, `AppPreloader.jsx` invokes `purgeExpiredTasks()`.
2. `purgeExpiredDeletedItems()` calculates `Date.now() - new Date(deletedAt).getTime()`.
3. Items where elapsed time exceeds **30 calendar days** (`30 * 24 * 60 * 60 * 1000 ms`) are permanently removed from storage.
4. Users can manually restore or permanently delete items earlier via the Recycle Bin modal.

---

## 5. Storage Normalization Engine (`src/utils/storage.js`)

The `sanitizeWorkspaceData(rawData)` function ensures zero runtime crashes by:
- Normalizing statuses: recognizes `hotfix`, `current`, `later`, and `done`.
- Normalizing priorities: ensures values conform to `urgent`, `high`, `medium`, or `low`.
- Normalizing project color inputs: validates hex format, supporting custom color pickers and preset palettes.
- Deduplicating and validating subtasks, todos, and testing checklists.
- Pruning obsolete legacy template mock IDs.

