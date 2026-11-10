import React, { useRef, useEffect } from 'react';
import { Search, LayoutGrid, List, Layers, X, Flame, FileDown } from 'lucide-react';

export const TaskFilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  tagFilter,
  onTagChange,
  priorityFilter,
  onPriorityChange,
  hotfixFilter = false,
  onToggleHotfix,
  viewMode,
  onViewModeChange,
  includeSubprojects,
  onToggleIncludeSubprojects,
  availableTags = [],
  totalTasks = 0,
  onOpenExport,
}) => {
  const inputRef = useRef(null);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || tagFilter !== 'all' || priorityFilter !== 'all' || hotfixFilter;

  const clearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onTagChange('all');
    onPriorityChange('all');
    if (onToggleHotfix && hotfixFilter) {
      onToggleHotfix();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) 0',
      }}
    >
      {/* Left side: Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
        {/* Search Input with Clear 'X' button & Shortcut Hint */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 'var(--space-2-5)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks (⌘F)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            spellCheck={true}
            style={{
              paddingLeft: 'var(--space-6)',
              paddingRight: searchQuery ? '24px' : 'var(--space-2)',
              paddingTop: '4px',
              paddingBottom: '4px',
              fontSize: 'var(--text-xs)',
              height: '28px',
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Clear search query"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={{ width: 'auto', fontSize: 'var(--text-xs)', height: '28px', padding: '0 var(--space-2)' }}
        >
          <option value="all">Status: All</option>
          <option value="hotfix">🔥 Hot Fix</option>
          <option value="current">Ongoing tasks</option>
          <option value="later">Queued tasks</option>
          <option value="done">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          style={{ width: 'auto', fontSize: 'var(--text-xs)', height: '28px', padding: '0 var(--space-2)' }}
        >
          <option value="all">Priority: All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Hot Fix Toggle Filter */}
        {onToggleHotfix && (
          <button
            type="button"
            onClick={onToggleHotfix}
            style={{
              height: '28px',
              padding: '0 var(--space-2-5)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              backgroundColor: hotfixFilter ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              border: `1px solid ${hotfixFilter ? '#f43f5e' : 'var(--border-default)'}`,
              color: hotfixFilter ? '#f43f5e' : 'var(--text-secondary)',
              fontWeight: hotfixFilter ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Filter by Hot Fix issues"
          >
            <Flame size={12} style={{ color: hotfixFilter ? '#f43f5e' : 'var(--text-muted)' }} />
            <span>Hot Fixes</span>
          </button>
        )}

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => onTagChange(e.target.value)}
            style={{ width: 'auto', fontSize: 'var(--text-xs)', height: '28px', padding: '0 var(--space-2)' }}
          >
            <option value="all">Tag: All</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}

        {/* Include Sub-projects Toggle */}
        <button
          type="button"
          onClick={onToggleIncludeSubprojects}
          style={{
            height: '28px',
            padding: '0 var(--space-2-5)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            backgroundColor: includeSubprojects ? 'var(--bg-surface-active)' : 'transparent',
            border: `1px solid ${includeSubprojects ? 'var(--color-primary-border)' : 'var(--border-default)'}`,
            color: includeSubprojects ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
          title="Include tasks from sub-projects"
        >
          <Layers size={12} />
          <span>Sub-projects</span>
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost"
            style={{ fontSize: 'var(--text-xs)', padding: '0 var(--space-1-5)', height: '28px' }}
            title="Reset filters"
          >
            <X size={12} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Right side: Export & Kanban vs List switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {onOpenExport && (
          <button
            type="button"
            onClick={onOpenExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px',
              fontSize: 'var(--text-xs)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            title="Export or Copy issues as Markdown or JSON"
          >
            <FileDown size={13} style={{ color: 'var(--color-primary)' }} />
            <span>Export Issues</span>
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
          }}
        >
        <button
          type="button"
          onClick={() => onViewModeChange('kanban')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            fontSize: 'var(--text-xs)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: viewMode === 'kanban' ? 'var(--bg-surface-active)' : 'transparent',
            color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: viewMode === 'kanban' ? 'var(--font-weight-medium)' : 'normal',
          }}
        >
          <LayoutGrid size={12} />
          <span>Board</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            fontSize: 'var(--text-xs)',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: viewMode === 'list' ? 'var(--bg-surface-active)' : 'transparent',
            color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: viewMode === 'list' ? 'var(--font-weight-medium)' : 'normal',
          }}
        >
          <List size={12} />
          <span>List</span>
        </button>
      </div>
    </div>
  </div>
  );
};
