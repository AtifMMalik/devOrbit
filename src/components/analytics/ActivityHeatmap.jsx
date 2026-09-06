import React, { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { Flame, Calendar, Trophy, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { calculateProductivityStats } from '../../utils/activityGenerator';

export const ActivityHeatmap = ({
  data = [],
  title = 'Work Activity & Contributions',
  subtitle = 'Daily tasks, checklist completions & documentation history',
  showStats = true,
  maxDays = 365,
}) => {
  const { theme } = useTheme();

  const calendarData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    if (maxDays && maxDays < data.length) {
      return data.slice(data.length - maxDays);
    }
    return data;
  }, [data, maxDays]);

  const stats = useMemo(() => {
    return calculateProductivityStats(calendarData);
  }, [calendarData]);

  // GitHub style palette tailored to devOrbit dark & light themes
  const customTheme = {
    dark: [
      '#131826', // level 0 (empty)
      '#0e4429', // level 1
      '#006d32', // level 2
      '#26a641', // level 3
      '#39d353', // level 4 (highest)
    ],
    light: [
      '#ebedf0', // level 0
      '#9be9a8', // level 1
      '#40c463', // level 2
      '#30a14e', // level 3
      '#216e39', // level 4
    ],
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        padding: 'var(--space-5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Developer Rank Badge */}
        {showStats && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: `${stats.rankColor}18`,
              border: `1px solid ${stats.rankColor}40`,
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: stats.rankColor,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Trophy size={13} />
            <span>{stats.developerLevel}</span>
          </div>
        )}
      </div>

      {/* Streak / Metric Quick Strip */}
      {showStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Activities
            </span>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.totalContributions}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Flame size={11} style={{ color: '#f97316' }} /> Current Streak
            </span>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: '#f97316', marginTop: 2 }}>
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Zap size={11} style={{ color: '#fbbf24' }} /> Longest Streak
            </span>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)', marginTop: 2 }}>
              {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Days
            </span>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-done-text)', marginTop: 2 }}>
              {stats.activeDays}
            </span>
          </div>
        </div>
      )}

      {/* GitHub Activity Heatmap Calendar */}
      <div
        style={{
          width: '100%',
          overflowX: 'auto',
          padding: 'var(--space-2) 0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {calendarData.length > 0 ? (
          <div style={{ minWidth: '680px', width: '100%' }}>
            <ActivityCalendar
              data={calendarData}
              theme={customTheme}
              colorScheme={theme === 'dark' ? 'dark' : 'light'}
              blockSize={12}
              blockRadius={3}
              blockMargin={3}
              fontSize={11}
              labels={{
                totalCount: '{{count}} activities in the last year',
                legend: {
                  less: 'Less',
                  more: 'More',
                },
              }}
              showWeekdayLabels
            />
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
            No activity records found yet.
          </div>
        )}
      </div>
    </div>
  );
};
