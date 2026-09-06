import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Folder, CheckSquare, FileText, CornerDownLeft, X } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusBadge, PriorityBadge } from './Badge';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const { projects, tasks, notes, setActiveProjectId } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matchedProjects = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 4)
      .map((p) => ({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: p.description || 'Project',
        projectId: p.id,
        route: `/project/${p.id}/overview`,
        raw: p,
      }));

    const matchedTasks = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      )
      .slice(0, 6)
      .map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        return {
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: proj ? `In ${proj.name}` : 'Task',
          projectId: t.projectId,
          route: `/project/${t.projectId}/tasks`,
          raw: t,
        };
      });

    const matchedNotes = notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((n) => {
        const proj = projects.find((p) => p.id === n.projectId);
        return {
          type: 'note',
          id: n.id,
          title: n.title,
          subtitle: proj ? `Doc in ${proj.name}` : 'Doc Note',
          projectId: n.projectId,
          route: `/project/${n.projectId}/notes`,
          raw: n,
        };
      });

    return [...matchedProjects, ...matchedTasks, ...matchedNotes];
  }, [query, projects, tasks, notes]);

  const handleSelect = (item) => {
    if (!item) return;
    if (item.projectId) {
      setActiveProjectId(item.projectId);
    }
    navigate(item.route);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '14vh',
        backgroundColor: 'var(--bg-overlay)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-pop"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2-5)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, tags, docs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 'var(--text-sm)',
              boxShadow: 'none',
              padding: 0,
            }}
          />
          <kbd
            style={{
              fontSize: '10px',
              padding: '1px 5px',
              backgroundColor: 'var(--bg-surface-active)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: '340px',
            overflowY: 'auto',
            padding: 'var(--space-1-5)',
          }}
        >
          {query.trim() === '' ? (
            <div
              style={{
                padding: 'var(--space-6) var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              Type keywords to search across your workspace
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-6) var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              No results found for "{query}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                const Icon =
                  item.type === 'project'
                    ? Folder
                    : item.type === 'task'
                    ? CheckSquare
                    : FileText;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
                      <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)',
                          }}
                          className="truncate"
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                          className="truncate"
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                      {item.type === 'task' && (
                        <>
                          <StatusBadge status={item.raw.status} />
                          <PriorityBadge priority={item.raw.priority} />
                        </>
                      )}
                      {isSelected && (
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          <CornerDownLeft size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-2) var(--space-4)',
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-card-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
