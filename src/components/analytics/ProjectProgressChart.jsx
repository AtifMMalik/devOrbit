import React from 'react';
import { CheckSquare, FlaskConical } from 'lucide-react';
import { TagBadge, PriorityBadge } from '../common/Badge';

export const ProjectProgressChart = ({ analytics, projectTitle = 'Project Progress' }) => {
  if (!analytics) return null;

  const {
    totalTasks,
    currentCount,
    laterCount,
    doneCount,
    completionRate,
    priorityCounts,
    todosCount,
    doneTodos,
    todoRate,
    testingCount,
    doneTesting,
    testRate,
    totalSubtasks,
    doneSubtasks,
    tagCounts,
  } = analytics;

  // SVG circular gauge geometry
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
      {/* 1. Completion & Status Distribution Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Work Completion & Flow
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Overall task delivery and active pipeline
            </p>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {doneCount}/{totalTasks} tasks done
          </span>
        </div>

        {/* Circular Gauge & Metric Stats Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          {/* Circular Progress Meter */}
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="var(--bg-surface-active)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0084ff" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {completionRate}%
              </span>
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Done
              </span>
            </div>
          </div>

          {/* Status Breakdown Bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {/* Current */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                <span style={{ color: 'var(--status-current-text)', fontWeight: 'var(--font-weight-medium)' }}>
                  Current ({currentCount})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {totalTasks > 0 ? Math.round((currentCount / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 5, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (currentCount / totalTasks) * 100 : 0}%`,
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>

            {/* Later */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                <span style={{ color: 'var(--status-later-text)', fontWeight: 'var(--font-weight-medium)' }}>
                  Later ({laterCount})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {totalTasks > 0 ? Math.round((laterCount / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 5, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (laterCount / totalTasks) * 100 : 0}%`,
                    backgroundColor: 'var(--status-later-text)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>

            {/* Done */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: 3 }}>
                <span style={{ color: 'var(--status-done-text)', fontWeight: 'var(--font-weight-medium)' }}>
                  Done ({doneCount})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 5, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0}%`,
                    backgroundColor: 'var(--status-done-solid)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Checklist Readiness (To-Dos & Testing) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Checklists & Quality Readiness
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            To-Do completion and QA test verification pass rates
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', flex: 1, justifyContent: 'center' }}>
          {/* To-Dos Progress Bar */}
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <CheckSquare size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  To-Dos Progress
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-bold)' }}>
                {doneTodos}/{todosCount} ({todoRate}%)
              </span>
            </div>
            <div style={{ height: 6, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${todoRate}%`,
                  backgroundColor: 'var(--color-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Testing QA Progress Bar */}
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FlaskConical size={15} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                  Testing & QA Pass Rate
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 'var(--font-weight-bold)' }}>
                {doneTesting}/{testingCount} ({testRate}%)
              </span>
            </div>
            <div style={{ height: 6, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${testRate}%`,
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          {/* Subtasks metric */}
          {totalSubtasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', padding: '0 4px' }}>
              <span>Task Checklist Subtasks:</span>
              <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                {doneSubtasks}/{totalSubtasks} completed ({Math.round((doneSubtasks / totalSubtasks) * 100)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Priority Matrix Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Priority Distribution
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Task urgency and priority allocation
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2-5)' }}>
          <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PriorityBadge priority="urgent" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {priorityCounts.urgent}
            </span>
          </div>

          <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PriorityBadge priority="high" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {priorityCounts.high}
            </span>
          </div>

          <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PriorityBadge priority="medium" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {priorityCounts.medium}
            </span>
          </div>

          <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PriorityBadge priority="low" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
              {priorityCounts.low}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tags Breakdown Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Tags & Domains
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Categorization across features, bugs, UI/UX and architecture
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)', flex: 1, alignItems: 'flex-start' }}>
          {Object.entries(tagCounts).map(([tag, count]) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-muted)',
                fontSize: '11px',
              }}
            >
              <TagBadge tag={tag} />
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'bold' }}>{count}</span>
            </div>
          ))}

          {Object.keys(tagCounts).length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
              No tagged tasks yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
