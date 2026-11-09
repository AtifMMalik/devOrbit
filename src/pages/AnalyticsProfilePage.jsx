import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { generateActivityData, calculateProjectAnalytics } from '../utils/activityGenerator';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { OverallProfileStats } from '../components/analytics/OverallProfileStats';
import { ProjectProgressChart } from '../components/analytics/ProjectProgressChart';
import { BrandFooter } from '../components/common/BrandFooter';

export const AnalyticsProfilePage = () => {
  const { projects, tasks, notes } = useWorkspace();

  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [timeRangeDays, setTimeRangeDays] = useState(365); // 365 | 180 | 90

  // Selected project object if filtered
  const selectedProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Generate Activity Data
  const calendarData = useMemo(() => {
    return generateActivityData(
      tasks,
      projects,
      notes,
      selectedProjectId === 'all' ? null : selectedProjectId,
      timeRangeDays
    );
  }, [tasks, projects, notes, selectedProjectId, timeRangeDays]);

  // Overall or project analytics
  const analytics = useMemo(() => {
    return calculateProjectAnalytics(selectedProject, tasks, projects);
  }, [selectedProject, tasks, projects]);

  return (
    <div className="page-container" style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
      {/* Page Title & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            <h1 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              Work Analytics & Developer Profile
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Project Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                fontSize: 'var(--text-xs)',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">Entire Workspace (All Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parentId ? `↳ ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selector */}
          <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg-surface-active)', padding: 2, borderRadius: 'var(--radius-sm)' }}>
            <button
              type="button"
              onClick={() => setTimeRangeDays(365)}
              style={{
                border: 'none',
                background: timeRangeDays === 365 ? 'var(--bg-card)' : 'transparent',
                color: timeRangeDays === 365 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: timeRangeDays === 365 ? 'bold' : 'normal',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              1 Year
            </button>
            <button
              type="button"
              onClick={() => setTimeRangeDays(180)}
              style={{
                border: 'none',
                background: timeRangeDays === 180 ? 'var(--bg-card)' : 'transparent',
                color: timeRangeDays === 180 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: timeRangeDays === 180 ? 'bold' : 'normal',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRangeDays(90)}
              style={{
                border: 'none',
                background: timeRangeDays === 90 ? 'var(--bg-card)' : 'transparent',
                color: timeRangeDays === 90 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: timeRangeDays === 90 ? 'bold' : 'normal',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
              }}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      {/* Developer Profile & Workspace Velocity Summary */}
      <OverallProfileStats tasks={tasks} />

      {/* GitHub Activity Contribution Calendar */}
      <ActivityHeatmap
        data={calendarData}
        title={selectedProject ? `Activity Calendar: ${selectedProject.name}` : 'Workspace Contribution Calendar'}
        showStats
      />

      {/* Progress & Work Done Charts */}
      <ProjectProgressChart
        analytics={analytics}
      />

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <BrandFooter />
      </div>
    </div>
  );
};
