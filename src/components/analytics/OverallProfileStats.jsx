import React from 'react';
import { Orbit, Sparkles, FolderTree, CheckCircle2, FileCode2 } from 'lucide-react';
import { calculateProductivityStats } from '../../utils/activityGenerator';

export const OverallProfileStats = ({ projects = [], tasks = [], notes = [], calendarData = [] }) => {
  const stats = calculateProductivityStats(calendarData);

  const rootProjectsCount = projects.filter((p) => !p.parentId).length;
  const subProjectsCount = projects.filter((p) => Boolean(p.parentId)).length;

  const totalTasks = tasks.length;
  const currentTasks = tasks.filter((t) => t.status === 'current').length;
  const laterTasks = tasks.filter((t) => t.status === 'later').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalTodos = projects.reduce((acc, p) => acc + (p.todos?.length || 0), 0);
  const doneTodos = projects.reduce((acc, p) => acc + (p.todos?.filter((t) => t.completed).length || 0), 0);

  const totalTesting = projects.reduce((acc, p) => acc + (p.testing?.length || 0), 0);
  const doneTesting = projects.reduce((acc, p) => acc + (p.testing?.filter((t) => t.completed).length || 0), 0);

  // Overall developer productivity score (0-100)
  const taskFactor = totalTasks > 0 ? (doneTasks / totalTasks) * 50 : 25;
  const activityFactor = Math.min(stats.totalContributions * 2, 30);
  const streakFactor = Math.min(stats.currentStreak * 4, 20);
  const productivityScore = Math.min(Math.round(taskFactor + activityFactor + streakFactor), 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
      {/* 1. Developer Profile Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
        }}
      >
        {/* Glow ambient background */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${stats.rankColor}25 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Profile Info Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {/* Avatar Orbit Aura */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: `linear-gradient(135deg, ${stats.rankColor}, #0084ff)`,
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${stats.rankColor}40`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stats.rankColor,
              }}
            >
              <Orbit size={28} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                devOrbit Developer
              </h2>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: `${stats.rankColor}20`,
                  color: stats.rankColor,
                  fontWeight: 'var(--font-weight-semibold)',
                  border: `1px solid ${stats.rankColor}40`,
                }}
              >
                Level {stats.developerRank}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {stats.developerLevel} • Workspace Velocity Engine
            </p>
          </div>
        </div>

        {/* Developer Productivity Gauge */}
        <div
          style={{
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Sparkles size={16} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              Productivity Index
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
              {productivityScore}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>
      </div>

      {/* 2. Workspace Velocity & Health Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Workspace Task Delivery
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Total completion rate across all root & sub-modules
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2-5)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-current-text)' }}>
              {currentTasks}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>In Progress</div>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-later-text)' }}>
              {laterTasks}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Queued / Later</div>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-done-text)' }}>
              {doneTasks}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Completed</div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ marginTop: 'var(--space-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span>Overall Completion</span>
            <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              {completionRate}% ({doneTasks}/{totalTasks})
            </span>
          </div>
          <div style={{ height: 6, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${completionRate}%`,
                background: 'linear-gradient(90deg, #0084ff, #10b981)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Hierarchy & Quality Readiness */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Architecture & Quality Assurance
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Structure breakdown and QA verification status
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <FolderTree size={14} style={{ color: 'var(--color-primary)' }} />
              <span>Project Hierarchy</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              {rootProjectsCount} root • {subProjectsCount} sub-modules
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
              <span>Checklist Items Resolved</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: '#10b981' }}>
              {doneTodos + doneTesting}/{totalTodos + totalTesting} (
              {totalTodos + totalTesting > 0 ? Math.round(((doneTodos + doneTesting) / (totalTodos + totalTesting)) * 100) : 0}%)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
              <FileCode2 size={14} style={{ color: 'var(--color-accent)' }} />
              <span>Documentation Logs</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              {notes.length} doc files
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
