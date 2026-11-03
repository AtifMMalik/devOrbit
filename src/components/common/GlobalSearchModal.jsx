import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckSquare, FileText, CornerDownLeft, X, ExternalLink, Flame, CheckCircle2, ListTodo, Layers } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusBadge, PriorityBadge } from './Badge';
import { ProjectAvatar } from './ProjectAvatar';

/**
 * Highlights matches of query string inside text.
 */
function highlightText(text, query) {
  if (!text || !query || !query.trim()) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const { projects, tasks, notes, setActiveProjectId, searchKeyword, setSearchKeyword } = useWorkspace();
  const [query, setQuery] = useState(searchKeyword || '');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery(searchKeyword || '');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, searchKeyword]);

  // Sync keyword to WorkspaceContext so highlights remain active across the app until cleared
  const handleQueryChange = (val) => {
    setQuery(val);
    setSearchKeyword(val);
    setSelectedIndex(0);
  };

  const handleClearQuery = (e) => {
    if (e) e.stopPropagation();
    setQuery('');
    setSearchKeyword('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // 1. Projects search
    const matchedProjects = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q) ||
          p.readme?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 5)
      .map((p) => ({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: p.description ? `Project · ${p.description}` : 'Project',
        projectId: p.id,
        route: `/project/${p.id}/overview`,
        raw: p,
      }));

    // 2. Tasks search (title, description, prompt, completionNote, subtasks, tags)
    const matchedTasks = tasks
      .filter((t) => {
        const inTitle = t.title.toLowerCase().includes(q);
        const inDesc = t.description?.toLowerCase().includes(q);
        const inPrompt = t.taskPrompt?.toLowerCase().includes(q);
        const inNote = t.completionNote?.toLowerCase().includes(q);
        const inTags = t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q));
        const inSubtasks = t.subtasks && t.subtasks.some((s) => s.text?.toLowerCase().includes(q));
        return inTitle || inDesc || inPrompt || inNote || inTags || inSubtasks;
      })
      .slice(0, 10)
      .map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        let matchContext = 'Task';
        if (t.taskPrompt?.toLowerCase().includes(q)) matchContext = 'Matched in Task Prompt';
        else if (t.completionNote?.toLowerCase().includes(q)) matchContext = 'Matched in Completion Note';
        else if (t.description?.toLowerCase().includes(q)) matchContext = 'Matched in Description';
        else if (t.subtasks?.some((s) => s.text?.toLowerCase().includes(q))) matchContext = 'Matched in Subtask';

        return {
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: `${proj ? proj.name : 'Task'} · ${matchContext}`,
          projectId: t.projectId,
          route: `/project/${t.projectId}/tasks/${t.id}`,
          raw: t,
        };
      });

    // 3. Project Notes / Docs search
    const matchedNotes = notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))
      .slice(0, 4)
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

    // 4. Checklist items (todos & testing) search
    const matchedChecklists = [];
    projects.forEach((p) => {
      if (Array.isArray(p.todos)) {
        p.todos.forEach((todo) => {
          if (todo.text?.toLowerCase().includes(q)) {
            matchedChecklists.push({
              type: 'todo',
              id: todo.id,
              title: todo.text,
              subtitle: `To-Do checklist in ${p.name}`,
              projectId: p.id,
              route: `/project/${p.id}/tasks`,
              raw: todo,
            });
          }
        });
      }
      if (Array.isArray(p.testing)) {
        p.testing.forEach((test) => {
          if (test.text?.toLowerCase().includes(q)) {
            matchedChecklists.push({
              type: 'testing',
              id: test.id,
              title: test.text,
              subtitle: `Testing item in ${p.name}`,
              projectId: p.id,
              route: `/project/${p.id}/tasks`,
              raw: test,
            });
          }
        });
      }
    });

    return [...matchedTasks, ...matchedProjects, ...matchedNotes, ...matchedChecklists.slice(0, 4)];
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
        paddingTop: '12vh',
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
          maxWidth: '620px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl), 0 0 50px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Input Bar with Cross button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2-5)',
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <Search size={16} style={{ color: 'var(--color-primary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all data (tasks, prompts, projects, notes, tags)..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
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

          {/* Cross button (X) to clear keyword and highlight */}
          {query && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="btn-icon"
              style={{ width: 22, height: 22 }}
              title="Clear search query and remove highlight"
            >
              <X size={14} />
            </button>
          )}

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
            ⌘F / ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: '380px',
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
              Type keywords to search across projects, task prompts, checklists, and notes.
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                let Icon = FileText;
                if (item.type === 'task') Icon = CheckSquare;
                if (item.type === 'todo' || item.type === 'testing') Icon = ListTodo;

                return (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2-5) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
                      {item.type === 'project' ? (
                        <ProjectAvatar project={item.raw} size={20} showGlow />
                      ) : (
                        <Icon size={14} style={{ color: item.type === 'task' ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          className="truncate"
                        >
                          {item.raw?.isHotfix && (
                            <span style={{ fontSize: '9px', color: '#f43f5e', fontWeight: 'bold' }}>🔥 HOT FIX</span>
                          )}
                          <span>{highlightText(item.title, query)}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                          }}
                          className="truncate"
                        >
                          {highlightText(item.subtitle, query)}
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
                      <span style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        Open <ExternalLink size={11} />
                      </span>
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
            <span>↵ Direct Link</span>
            <span>Click ✕ on searchbar to clear highlight</span>
          </div>
          {searchKeyword && (
            <span style={{ color: 'var(--color-primary)' }}>
              Highlighting: "{searchKeyword}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
