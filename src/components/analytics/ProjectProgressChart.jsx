import React from 'react';
import { PriorityBadge } from '../common/Badge';

export const ProjectProgressChart = ({ analytics, showPriority = false }) => {
  if (!analytics) return null;

  const {
    totalTasks = 0,
    currentCount = 0,
    laterCount = 0,
    doneCount = 0,
    hotfixCount = 0,
    completionRate = 0,
    priorityCounts,
  } = analytics;

  const currentPct = totalTasks > 0 ? Math.round((currentCount / totalTasks) * 100) : 0;
  const laterPct = totalTasks > 0 ? Math.round((laterCount / totalTasks) * 100) : 0;
  const donePct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const hotfixPct = totalTasks > 0 ? Math.round((hotfixCount / totalTasks) * 100) : 0;

  // Donut Gauge Geometry
  const size = 156;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2; // 71px
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, completionRate)) / 100) * circumference;

  const flowMetrics = [
    {
      id: 'current',
      label: 'Current',
      count: currentCount,
      pct: currentPct,
      textColor: '#60a5fa', // Blue
      barColor: '#3b82f6',
    },
    {
      id: 'later',
      label: 'Later',
      count: laterCount,
      pct: laterPct,
      textColor: '#fbbf24', // Amber
      barColor: '#f59e0b',
    },
    {
      id: 'done',
      label: 'Done',
      count: doneCount,
      pct: donePct,
      textColor: '#34d399', // Emerald
      barColor: '#10b981',
    },
    {
      id: 'hotfix',
      label: 'Hot Fixes',
      count: hotfixCount,
      pct: hotfixPct,
      textColor: '#fb7185', // Rose
      barColor: '#f43f5e',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showPriority ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: 'var(--space-4)' }}>
      {/* 1. Main Work Completion & Flow Card */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 1.4fr) minmax(180px, 1fr)',
          gap: 'var(--space-6)',
          alignItems: 'center',
          padding: '24px 28px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Left Column: Title, Subtitle, and Progress Bar Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3-5)' }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Work Completion & Flow
            </h3>
            <div
              style={{
                marginTop: '4px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontWeight: 'var(--font-weight-normal)',
              }}
            >
              {doneCount}/{totalTasks} tasks done
            </div>
          </div>

          {/* Metric Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
            {flowMetrics.map((item) => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: item.textColor, fontWeight: 600 }}>
                    {item.label} ({item.count})
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                    {item.pct}%
                  </span>
                </div>

                {/* Progress Bar Track and Fill */}
                <div
                  style={{
                    width: '100%',
                    height: 5,
                    backgroundColor: 'var(--bg-surface-active)',
                    borderRadius: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.pct}%`,
                      minWidth: item.pct > 0 ? 4 : 0,
                      height: '100%',
                      backgroundColor: item.barColor,
                      borderRadius: 9999,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Centered Donut Ring Meter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
          }}
        >
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ transform: 'rotate(-90deg)' }}
            >
              <defs>
                <linearGradient id="completionDonutGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Background Track Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--bg-surface-active)"
                strokeWidth={strokeWidth}
              />

              {/* Foreground Animated Progress Stroke */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="url(#completionDonutGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>

            {/* Centered Percentage and DONE Text */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {completionRate}%
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  marginTop: 6,
                  textTransform: 'uppercase',
                }}
              >
                DONE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Priority Distribution Card (Optional) */}
      {showPriority && priorityCounts && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Priority Distribution
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-2-5)' }}>
            <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PriorityBadge priority="urgent" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {priorityCounts.urgent || 0}
              </span>
            </div>

            <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PriorityBadge priority="high" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {priorityCounts.high || 0}
              </span>
            </div>

            <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PriorityBadge priority="medium" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {priorityCounts.medium || 0}
              </span>
            </div>

            <div style={{ padding: 'var(--space-2-5)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PriorityBadge priority="low" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>
                {priorityCounts.low || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
