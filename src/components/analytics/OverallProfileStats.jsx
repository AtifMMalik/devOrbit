import React from 'react';

export const OverallProfileStats = ({ tasks = [] }) => {
  const totalTasks = tasks.length;
  const currentTasks = tasks.filter((t) => t.status === 'current').length;
  const laterTasks = tasks.filter((t) => t.status === 'later').length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const hotfixTasks = tasks.filter(
    (t) => t.status === 'hotfix' || ((t.isHotfix || (t.tags && t.tags.includes('hotfix'))) && t.status !== 'done')
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
          Workspace Task Delivery
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-2-5)' }}>
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

        <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: '#f43f5e' }}>
            {hotfixTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Hot Fixes</div>
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
  );
};
