/**
 * Preloaded developer sample data for devOrbit
 */
export const INITIAL_SAMPLE_DATA = {
  version: '1.0.0',
  projects: [
    {
      id: 'proj_devorbit',
      parentId: null,
      name: 'devOrbit Platform',
      description: 'Unified developer workspace & multi-project task orchestration system.',
      color: '#0084ff',
      icon: 'Orbit',
      tags: ['react', 'dashboard', 'productivity'],
      todos: [
        { id: 'todo_1', text: 'Verify PWA desktop install prompt and offline caching', completed: true },
        { id: 'todo_2', text: 'Add global keyboard shortcuts modal (? or Cmd+/)', completed: false },
        { id: 'todo_3', text: 'Benchmark localStorage sync with 500+ tasks', completed: false }
      ],
      testing: [
        { id: 'test_1', text: 'Test responsive grid layout under 768px viewport width', completed: true },
        { id: 'test_2', text: 'Verify task drag-and-drop between columns and reordering', completed: true },
        { id: 'test_3', text: 'Test markdown sync import and export with subtask checklists', completed: false },
        { id: 'test_4', text: 'Verify PWA service worker offline reload fallback', completed: false }
      ],
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-06T12:00:00.000Z'
    },
    {
      id: 'proj_devorbit_core',
      parentId: 'proj_devorbit',
      name: 'Core UI & Design System',
      description: 'Design tokens, theme.css, glassmorphic components, and keyboard navigation.',
      color: '#06b6d4',
      icon: 'Palette',
      tags: ['css', 'ui/ux', 'tokens'],
      todos: [
        { id: 'todo_c1', text: 'Review dark mode contrast for muted text tokens', completed: true },
        { id: 'todo_c2', text: 'Audit accessible tap targets and keyboard focus rings', completed: false }
      ],
      testing: [
        { id: 'test_c1', text: 'Test theme toggle persistence across browser tabs', completed: true },
        { id: 'test_c2', text: 'Verify smooth transitions on sidebar collapse', completed: true }
      ],
      createdAt: '2026-09-02T11:00:00.000Z',
      updatedAt: '2026-09-06T12:30:00.000Z'
    },
    {
      id: 'proj_devorbit_storage',
      parentId: 'proj_devorbit',
      name: 'Storage & Sync Engine',
      description: 'LocalStorage caching, JSON backup/restore, and Markdown task importer/exporter.',
      color: '#10b981',
      icon: 'Database',
      tags: ['storage', 'markdown', 'sync'],
      todos: [
        { id: 'todo_s1', text: 'Add schema versioning migration checks on load', completed: true }
      ],
      testing: [
        { id: 'test_s1', text: 'Test JSON export file parsing and restore validation', completed: true }
      ],
      createdAt: '2026-09-03T09:30:00.000Z',
      updatedAt: '2026-09-06T13:00:00.000Z'
    },
    {
      id: 'proj_ecommerce',
      parentId: null,
      name: 'E-Commerce Cloud Architecture',
      description: 'Distributed microservices architecture with Next.js storefront and Go backend.',
      color: '#f59e0b',
      icon: 'ShoppingBag',
      tags: ['microservices', 'nextjs', 'golang'],
      todos: [
        { id: 'todo_e1', text: 'Limit single user / device from requesting too many OTPs', completed: false },
        { id: 'todo_e2', text: 'Activate customer grievance management system', completed: false },
        { id: 'todo_e3', text: 'Restrict customer orders when no delivery partners are available', completed: false }
      ],
      testing: [
        { id: 'test_e1', text: 'Test cart rows are properly displayed as per label and value in JSON', completed: true },
        { id: 'test_e2', text: 'Test product tags for "AI and New" category filters', completed: true },
        { id: 'test_e3', text: 'Verify app version header is sent to backend on handshake', completed: false },
        { id: 'test_e4', text: 'Test continuous unidirectional banner slider animation', completed: false }
      ],
      createdAt: '2026-08-15T08:00:00.000Z',
      updatedAt: '2026-09-05T16:00:00.000Z'
    },
    {
      id: 'proj_ecommerce_checkout',
      parentId: 'proj_ecommerce',
      name: 'Checkout & Payment Service',
      description: 'Stripe integration, webhooks, multi-currency support and fraud detection.',
      color: '#ec4899',
      icon: 'CreditCard',
      tags: ['stripe', 'payments', 'security'],
      createdAt: '2026-08-20T14:00:00.000Z',
      updatedAt: '2026-09-04T10:00:00.000Z'
    },
    {
      id: 'proj_mobile_app',
      parentId: null,
      name: 'Pulse Mobile Client',
      description: 'Cross-platform React Native app for real-time developer metrics and notifications.',
      color: '#8b5cf6',
      icon: 'Smartphone',
      tags: ['react-native', 'mobile', 'ios', 'android'],
      createdAt: '2026-08-28T09:00:00.000Z',
      updatedAt: '2026-09-06T10:00:00.000Z'
    }
  ],
  tasks: [
    // Tasks for devOrbit Platform
    {
      id: 'task_1',
      projectId: 'proj_devorbit',
      title: 'Build Markdown Task Importer & Exporter',
      description: 'Allow developers to import their existing markdown checklists and export live tasks back to clean markdown format.',
      status: 'current',
      priority: 'urgent',
      tags: ['feature', 'documentation'],
      dueDate: '2026-09-10',
      subtasks: [
        { id: 'sub_1', text: 'Parse #tags and [Status] labels from markdown', completed: true },
        { id: 'sub_2', text: 'Generate formatted markdown string with categories', completed: true },
        { id: 'sub_3', text: 'Add 1-click copy and file download', completed: false }
      ],
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-06T14:00:00.000Z'
    },
    {
      id: 'task_2',
      projectId: 'proj_devorbit',
      title: 'Implement Global Search (Cmd+K)',
      description: 'Fast fuzzy search across all projects, sub-projects, tasks, and notes.',
      status: 'current',
      priority: 'high',
      tags: ['feature', 'ui/ux'],
      dueDate: '2026-09-08',
      subtasks: [
        { id: 'sub_4', text: 'Add keyboard listener for Cmd/Ctrl + K', completed: true },
        { id: 'sub_5', text: 'Highlight matching characters', completed: false }
      ],
      createdAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-06T11:00:00.000Z'
    },
    {
      id: 'task_3',
      projectId: 'proj_devorbit',
      title: 'Add Drag & Drop Kanban Reordering',
      description: 'Smooth column movement and card reordering with visual drop indicators.',
      status: 'later',
      priority: 'medium',
      tags: ['feature', 'ui/ux'],
      dueDate: '2026-09-15',
      subtasks: [],
      createdAt: '2026-09-05T12:00:00.000Z',
      updatedAt: '2026-09-05T12:00:00.000Z'
    },
    {
      id: 'task_4',
      projectId: 'proj_devorbit',
      title: 'Confetti celebration on task completion',
      description: 'Trigger joyful particle animation when moving tasks to Done status.',
      status: 'done',
      priority: 'low',
      tags: ['ui/ux'],
      dueDate: '2026-09-06',
      subtasks: [
        { id: 'sub_6', text: 'Install canvas-confetti package', completed: true },
        { id: 'sub_7', text: 'Trigger confetti on done toggle', completed: true }
      ],
      createdAt: '2026-09-03T15:00:00.000Z',
      updatedAt: '2026-09-06T10:00:00.000Z'
    },
    {
      id: 'task_5',
      projectId: 'proj_devorbit',
      title: 'Dark / Light theme state switcher',
      description: 'Persistent theme switching with CSS variables in theme.css',
      status: 'done',
      priority: 'medium',
      tags: ['refactor', 'ui/ux'],
      dueDate: '2026-09-05',
      subtasks: [],
      createdAt: '2026-09-02T14:00:00.000Z',
      updatedAt: '2026-09-05T18:00:00.000Z'
    },

    // Tasks for Core UI & Design System
    {
      id: 'task_6',
      projectId: 'proj_devorbit_core',
      title: 'Create theme.css design token specifications',
      description: 'Define comprehensive CSS variables for colors, spacings, typography, tone variations and glassmorphism.',
      status: 'done',
      priority: 'urgent',
      tags: ['refactor', 'documentation'],
      dueDate: '2026-09-06',
      subtasks: [
        { id: 'sub_8', text: 'Define dark & light palette', completed: true },
        { id: 'sub_9', text: 'Define tag & status colors', completed: true }
      ],
      createdAt: '2026-09-06T08:00:00.000Z',
      updatedAt: '2026-09-06T15:00:00.000Z'
    },
    {
      id: 'task_7',
      projectId: 'proj_devorbit_core',
      title: 'Responsive Collapsible Sidebar Navigation',
      description: 'Expand/collapse states with tooltip support and sub-project tree rendering.',
      status: 'current',
      priority: 'high',
      tags: ['ui/ux', 'feature'],
      dueDate: '2026-09-09',
      subtasks: [],
      createdAt: '2026-09-06T09:00:00.000Z',
      updatedAt: '2026-09-06T13:00:00.000Z'
    },

    // Tasks for Storage & Sync Engine
    {
      id: 'task_8',
      projectId: 'proj_devorbit_storage',
      title: 'Full Workspace JSON Export & Import',
      description: 'Download whole workspace as a timestamped JSON file and allow instant restore.',
      status: 'current',
      priority: 'high',
      tags: ['feature', 'api'],
      dueDate: '2026-09-12',
      subtasks: [
        { id: 'sub_10', text: 'Validate schema on file upload', completed: true },
        { id: 'sub_11', text: 'Add migration fallback', completed: false }
      ],
      createdAt: '2026-09-05T14:00:00.000Z',
      updatedAt: '2026-09-06T11:00:00.000Z'
    },
    {
      id: 'task_9',
      projectId: 'proj_devorbit_storage',
      title: 'IndexedDB backend fallback for large attachments',
      description: 'Support larger storage for project attachments and screenshots.',
      status: 'later',
      priority: 'low',
      tags: ['refactor', 'storage'],
      dueDate: '2026-09-30',
      subtasks: [],
      createdAt: '2026-09-05T15:00:00.000Z',
      updatedAt: '2026-09-05T15:00:00.000Z'
    },

    // Tasks for E-Commerce Cloud Architecture
    {
      id: 'task_10',
      projectId: 'proj_ecommerce',
      title: 'Migrate Product Catalog to GraphQL Mesh',
      description: 'Unify legacy REST endpoints into a federated GraphQL gateway.',
      status: 'current',
      priority: 'urgent',
      tags: ['api', 'refactor'],
      dueDate: '2026-09-18',
      subtasks: [
        { id: 'sub_12', text: 'Schema definition and resolver stubs', completed: true },
        { id: 'sub_13', text: 'Redis caching layer integration', completed: false }
      ],
      createdAt: '2026-08-25T10:00:00.000Z',
      updatedAt: '2026-09-05T16:00:00.000Z'
    },
    {
      id: 'task_11',
      projectId: 'proj_ecommerce_checkout',
      title: 'Stripe 3D-Secure 2.0 Webhook Verification',
      description: 'Ensure idempotency and cryptographic signature checks on all incoming events.',
      status: 'done',
      priority: 'high',
      tags: ['security', 'testing'],
      dueDate: '2026-09-01',
      subtasks: [
        { id: 'sub_14', text: 'Write end-to-end integration tests', completed: true }
      ],
      createdAt: '2026-08-20T11:00:00.000Z',
      updatedAt: '2026-09-01T17:00:00.000Z'
    },

    // Tasks for Pulse Mobile Client
    {
      id: 'task_12',
      projectId: 'proj_mobile_app',
      title: 'Push notification sound customized per alert severity',
      description: 'Configure APNS and FCM notification channels with custom sound assets.',
      status: 'later',
      priority: 'medium',
      tags: ['feature', 'mobile'],
      dueDate: '2026-09-22',
      subtasks: [],
      createdAt: '2026-08-29T10:00:00.000Z',
      updatedAt: '2026-08-29T10:00:00.000Z'
    }
  ],
  notes: [
    {
      id: 'note_1',
      projectId: 'proj_devorbit',
      title: 'devOrbit Architecture & Tool Roadmap',
      content: `# devOrbit Architecture Notes

## Overview
devOrbit solves the developer friction of managing multiple sprawling projects, sub-projects, and fragmented task notes.

## Built-in Tools:
1. **Tasks & Issues Manager**: Kanban + List views with status filters (\`Current\`, \`Later\`, \`Done\`, \`Backlog\`, \`Blocked\`).
2. **Markdown Sync**: Seamlessly import existing MD task lists and export live boards back to clean Markdown.
3. **Project Documentation**: In-app markdown editor for architecture notes and meeting logs.
4. **Global Search**: \`Cmd+K\` quick navigation across all entities.

## Future Tools:
- API Playground & Endpoint Monitor
- Snippet & Secret Vault
- Release Changelog Generator
`,
      updatedAt: '2026-09-06T15:00:00.000Z'
    },
    {
      id: 'note_2',
      projectId: 'proj_ecommerce',
      title: 'Deployment & CI/CD Pipelines',
      content: `# E-Commerce Deployment Architecture

- **Storefront**: Deployed on Vercel Edge Network
- **Gateway**: Kubernetes cluster running in us-east-1
- **Database**: Aurora PostgreSQL Multi-AZ cluster

### Environment Matrix:
- \`staging.devorbit-shop.internal\`
- \`prod.devorbit-shop.com\`
`,
      updatedAt: '2026-09-04T12:00:00.000Z'
    }
  ]
};
