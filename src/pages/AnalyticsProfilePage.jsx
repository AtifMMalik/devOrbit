import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { generateActivityData, calculateProjectAnalytics } from '../utils/activityGenerator';
import { ActivityHeatmap } from '../components/analytics/ActivityHeatmap';
import { OverallProfileStats } from '../components/analytics/OverallProfileStats';
import { ProjectProgressChart } from '../components/analytics/ProjectProgressChart';
import { Button } from '../components/common/Button';

export const AnalyticsProfilePage = () => {
  const { projects, tasks, notes, getRootProjects } = useWorkspace();
  const navigate = useNavigate();

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

  const rootProjects = getRootProjects();

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1200px' }}>
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
          <p style={{ marginTop: '2px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Track your coding momentum, task velocity, GitHub-style contribution heatmap, and completion rates.
          </p>
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
      <OverallProfileStats
        projects={projects}
        tasks={tasks}
        notes={notes}
        calendarData={calendarData}
      />

      {/* GitHub Activity Contribution Calendar */}
      <ActivityHeatmap
        data={calendarData}
        title={selectedProject ? `Activity Calendar: ${selectedProject.name}` : 'Workspace Contribution Calendar'}
        subtitle={`Heatmap of all tasks, checklist updates & doc activity over the past ${timeRangeDays} days`}
        showStats
      />

      {/* Progress & Work Done Charts */}
      <ProjectProgressChart
        analytics={analytics}
        projectTitle={selectedProject ? selectedProject.name : 'Workspace Wide'}
      />

      {/* Project Velocity Breakdown Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Project Velocity & Completion Breakdown ({rootProjects.length} Root Projects)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
          {rootProjects.map((proj) => {
            const projStats = calculateProjectAnalytics(proj, tasks, projects);
            const subProjects = projects.filter((p) => p.parentId === proj.id);

            return (
              <div
                key={proj.id}
                onClick={() => navigate(`/project/${proj.id}/analytics`)}
                className="card card-hoverable"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  cursor: 'pointer',
                  padding: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: proj.color || 'var(--color-primary)',
                      }}
                    />
                    <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                      {proj.name}
                    </span>
                  </div>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>{projStats.doneCount}/{projStats.totalTasks} Tasks Done</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{projStats.completionRate}%</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--bg-surface-active)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${projStats.completionRate}%`,
                        backgroundColor: proj.color || 'var(--color-primary)',
                        borderRadius: 'var(--radius-full)',
                      }}
                    />
                  </div>
                </div>

                {/* Sub projects and checklists pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-2)' }}>
                  <span>{subProjects.length} sub-projects</span>
                  <span>•</span>
                  <span>{projStats.todosCount} to-dos</span>
                  <span>•</span>
                  <span>{projStats.testingCount} tests</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
