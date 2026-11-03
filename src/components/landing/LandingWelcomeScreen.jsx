import React from 'react';
import {
  FolderPlus,
  Sparkles,
  Kanban,
  FileText,
  Flame,
  CheckCircle2,
  Terminal,
  Shield,
  Zap,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { Button } from '../common/Button';
import { DevOrbitLogo } from '../common/DevOrbitLogo';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const LandingWelcomeScreen = ({ onNewProject }) => {
  const { createProject, createTask, setActiveProjectId } = useWorkspace();
  const { toastSuccess } = useToast();

  const handleCreateSampleProject = () => {
    const sample = createProject({
      name: 'devOrbit Core Platform',
      description: 'Engineering platform architecture, reactive Kanban board, and developer documentation workspace.',
      author: 'devOrbit Engineering',
      liveUrl: 'https://devorbit.app',
      githubUrl: 'https://github.com/atifmalik/devOrbit',
      readme: `# devOrbit Platform Architecture\n\nWelcome to **devOrbit** — the developer-first workspace engineered for tracking projects, tasks, checklists, and momentum.\n\n### Core Pillars\n- **Agile Task Delivery**: Kanban board with Current, Later, and collapsible Done queues.\n- **Prompt Engineering**: One-click copyable task prompts for AI pairing & code generators.\n- **Quality & Reliability**: Dedicated To-Dos and Testing checklists on every project.\n- **Recycle Bin**: 30-day recoverable soft delete.`,
      color: '#0084ff',
      tags: ['core', 'engineering', 'pwa'],
      todos: [
        { id: 'todo_welcome_1', text: 'Review project README and architecture contracts', completed: true },
        { id: 'todo_welcome_2', text: 'Test keyboard shortcuts (⌘F search, ⌘N new task, ⌘T sidebar)', completed: false },
      ],
      testing: [
        { id: 'test_welcome_1', text: 'Verify multi-select drag & drop on Kanban board', completed: true },
        { id: 'test_welcome_2', text: 'Verify 1-click prompt copy on task cards', completed: false },
      ],
    });

    createTask({
      projectId: sample.id,
      title: 'Audit responsive performance & Core Web Vitals',
      description: 'Run lighthouse audit and ensure Largest Contentful Paint (LCP) remains under 1.2s across mobile devices.',
      taskPrompt: 'Analyze bundle size using vite-bundle-visualizer and optimize unused icon imports.',
      status: 'current',
      priority: 'high',
      tags: ['performance', 'optimization'],
      subtasks: [
        { id: 'sub_sample_1', text: 'Audit network waterfalls', completed: true },
        { id: 'sub_sample_2', text: 'Verify code-splitting chunks', completed: false },
      ],
    });

    createTask({
      projectId: sample.id,
      title: 'Critical hotfix for session token invalidation',
      description: 'Ensure token expiration triggers graceful redirect without UI stutter.',
      taskPrompt: 'Implement proactive token refresh hook with 5-minute jitter before expiry.',
      status: 'current',
      priority: 'urgent',
      isHotfix: true,
      tags: ['hotfix', 'security'],
      subtasks: [
        { id: 'sub_sample_3', text: 'Write regression test for refresh flow', completed: false },
      ],
    });

    createTask({
      projectId: sample.id,
      title: 'Implement GraphQL Mesh Federation fallback',
      description: 'Schema stitching for legacy REST endpoints to prepare for Q4 catalog migration.',
      taskPrompt: 'Create declarative schema resolvers with automatic dataloader batching.',
      status: 'later',
      priority: 'medium',
      tags: ['api', 'graphql'],
      subtasks: [],
    });

    createTask({
      projectId: sample.id,
      title: 'Setup PWA offline service worker and cache manifest',
      description: 'Cache app shell assets for instant zero-latency loads when offline.',
      taskPrompt: 'Configure workbox precache manifest with CacheFirst strategy for immutable static assets.',
      status: 'done',
      priority: 'high',
      completionNote: 'PWA fully configured with offline asset caching and service worker lifecycle updates.',
      tags: ['pwa', 'offline'],
      subtasks: [
        { id: 'sub_sample_4', text: 'Manifest configuration', completed: true },
        { id: 'sub_sample_5', text: 'Cache invalidation test', completed: true },
      ],
    });

    setActiveProjectId(sample.id);
    toastSuccess('Sample project created! Explore tasks, prompts, and hotfixes.');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%',
        gap: 'var(--space-8)',
      }}
    >
      {/* Hero Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-3)',
          maxWidth: '680px',
        }}
      >
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <DevOrbitLogo variant="horizontal" height={36} />
        </div>

        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Engineering Momentum for Developers
        </h1>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          A minimalist, local-first workspace for engineering projects. Organize tasks with agile kanban boards, rich markdown specifications, 30-day soft-delete recovery, and instant prompt copying.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-4)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="primary"
            size="lg"
            icon={FolderPlus}
            onClick={() => onNewProject && onNewProject(null)}
            style={{
              padding: '10px 20px',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              boxShadow: '0 4px 14px rgba(0, 132, 255, 0.3)',
            }}
          >
            Create Your First Project
          </Button>

          <Button
            variant="secondary"
            size="lg"
            icon={Sparkles}
            onClick={handleCreateSampleProject}
            style={{
              padding: '10px 18px',
              fontSize: 'var(--text-xs)',
            }}
          >
            Explore Sample Project
          </Button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
          width: '100%',
        }}
      >
        {/* Feature 1 */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 132, 255, 0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Kanban size={18} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
            Agile Kanban & Batch Control
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Current & Later columns with a space-saving collapsible Done drawer. Select tasks with <kbd style={{ fontSize: '10px' }}>⌘+Click</kbd>, cut (<kbd style={{ fontSize: '10px' }}>⌘X</kbd>), copy (<kbd style={{ fontSize: '10px' }}>⌘C</kbd>), and paste (<kbd style={{ fontSize: '10px' }}>⌘V</kbd>).
          </p>
        </div>

        {/* Feature 2 */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--status-done-solid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Terminal size={18} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
            1-Click Copyable Prompts
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Attach AI prompts and task instructions directly to task cards. Expand to view or copy in a single click directly to your clipboard.
          </p>
        </div>

        {/* Feature 3 */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={18} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
            Hot Fix Triage & Checklists
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Mark critical production issues with high-visibility Hot Fix badges. Track To-Dos and Testing checklists on every project hierarchy.
          </p>
        </div>

        {/* Feature 4 */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: 'var(--status-later-solid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} />
          </div>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>
            30-Day Recycle Bin & Recovery
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Never lose accidental deletions. Deleted tasks are soft-deleted and recoverable for 30 days, then permanently purged upon app startup.
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
          fontSize: '11px',
          color: 'var(--text-muted)',
          padding: 'var(--space-3) var(--space-5)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-default)',
        }}
      >
        <span><kbd style={{ fontSize: '10px' }}>⌘F</kbd> Search workspace</span>
        <span>·</span>
        <span><kbd style={{ fontSize: '10px' }}>⌘N</kbd> New task</span>
        <span>·</span>
        <span><kbd style={{ fontSize: '10px' }}>⌘⇧N</kbd> New project</span>
        <span>·</span>
        <span><kbd style={{ fontSize: '10px' }}>⌘T</kbd> Toggle sidebar</span>
      </div>
    </div>
  );
};

