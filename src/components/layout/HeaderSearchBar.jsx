import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CheckSquare, FileText, Flame, ExternalLink, CornerDownLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { highlightText, cycleOnPageMatch } from '../../utils/searchHighlight';

export const HeaderSearchBar = ({ isMobile = false }) => {
  const navigate = useNavigate();
  const {
    projects,
    tasks,
    notes,
    searchKeyword,
    setSearchKeyword,
    setActiveProjectId,
  } = useWorkspace();

  const [query, setQuery] = useState(searchKeyword || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [onPageMatchCount, setOnPageMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external searchKeyword changes into query
  useEffect(() => {
    if (searchKeyword !== undefined && searchKeyword !== query) {
      setQuery(searchKeyword);
    }
  }, [searchKeyword]);

  // Compute on-page matches dynamically
  useEffect(() => {
    if (!query.trim()) {
      setOnPageMatchCount(0);
      setCurrentMatchIndex(-1);
      return;
    }
    const timer = setTimeout(() => {
      const matches = document.querySelectorAll('mark.search-highlight');
      setOnPageMatchCount(matches.length);
      if (matches.length > 0 && currentMatchIndex === -1) {
        setCurrentMatchIndex(0);
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [query, searchKeyword]);

  // Click outside to immediately dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for global Cmd+F / Cmd+K focus event
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
      setIsOpen(true);
    };
    window.addEventListener('devorbit:focus-search', handleFocusSearch);
    return () => window.removeEventListener('devorbit:focus-search', handleFocusSearch);
  }, []);

  // Compute search results across projects, tasks, prompts, descriptions, subtasks, and notes
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // 1. Projects
    const matchedProjects = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q) ||
          p.readme?.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 4)
      .map((p) => ({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: p.description ? `Project · ${p.description}` : 'Project',
        projectId: p.id,
        route: `/project/${p.id}/overview`,
        raw: p,
      }));

    // 2. Tasks (title, prompt, description, completion note, subtasks)
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
      .slice(0, 8)
      .map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        let matchContext = 'Task';
        if (t.taskPrompt?.toLowerCase().includes(q)) matchContext = 'Matched in Task Prompt';
        else if (t.completionNote?.toLowerCase().includes(q)) matchContext = 'Matched in Completion Note';
        else if (t.description?.toLowerCase().includes(q)) matchContext = 'Matched in Description';

        return {
          type: 'task',
          id: t.id,
          title: t.title,
          subtitle: `${proj ? proj.name : 'Unknown'} · ${matchContext}`,
          projectId: t.projectId,
          route: `/project/${t.projectId}/tasks/${t.id}`,
          raw: t,
        };
      });

    // 3. Notes
    const matchedNotes = notes
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
      .slice(0, 3)
      .map((n) => {
        const proj = projects.find((p) => p.id === n.projectId);
        return {
          type: 'note',
          id: n.id,
          title: n.title,
          subtitle: `${proj ? proj.name : 'Project'} · Note`,
          projectId: n.projectId,
          route: `/project/${n.projectId}/notes`,
          raw: n,
        };
      });

    return [...matchedProjects, ...matchedTasks, ...matchedNotes];
  }, [query, projects, tasks, notes]);

  const handleSelectResult = (item) => {
    if (item.projectId) {
      setActiveProjectId(item.projectId);
    }
    // Persist search keyword in context
    setSearchKeyword(query);
    setIsOpen(false);
    navigate(item.route);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setSearchKeyword(query);
      if (e.shiftKey) {
        // Shift+Enter: Jump to previous on-page match
        const res = cycleOnPageMatch('prev', currentMatchIndex);
        setCurrentMatchIndex(res.currentIndex);
        setOnPageMatchCount(res.total);
      } else if (results.length > 0 && isOpen && results[selectedIndex] && selectedIndex !== -1) {
        handleSelectResult(results[selectedIndex]);
      } else {
        // Enter: Jump to next on-page match
        setIsOpen(false);
        const res = cycleOnPageMatch('next', currentMatchIndex);
        setCurrentMatchIndex(res.currentIndex);
        setOnPageMatchCount(res.total);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuery('');
    setSearchKeyword('');
    setOnPageMatchCount(0);
    setCurrentMatchIndex(-1);
    setIsOpen(false);
    document.querySelectorAll('mark.search-highlight.active-match').forEach((el) => {
      el.classList.remove('active-match');
    });
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: isMobile ? '160px' : '260px',
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          backgroundColor: 'var(--bg-surface)',
          border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 8px',
          gap: 'var(--space-2)',
          boxShadow: isOpen ? '0 0 0 2px var(--color-primary-light)' : 'none',
          transition: 'all var(--transition-fast)',
        }}
      >
        <Search size={13} style={{ color: isOpen ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder={isMobile ? 'Search...' : 'Search workspace (⌘F)...'}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setSearchKeyword(val);
            setSelectedIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          spellCheck={true}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            outline: 'none',
            width: '100%',
          }}
        />

        {/* On-Page Matches Badge */}
        {onPageMatchCount > 0 && (
          <span
            style={{
              fontSize: '9.5px',
              fontWeight: 'var(--font-weight-medium)',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              color: '#d97706',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onClick={() => {
              const res = cycleOnPageMatch('next', currentMatchIndex);
              setCurrentMatchIndex(res.currentIndex);
            }}
            title="Page matches found. Click or press Enter to jump to next match"
          >
            {currentMatchIndex >= 0 ? `${currentMatchIndex + 1}/${onPageMatchCount}` : `${onPageMatchCount}`}
          </span>
        )}

        {query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            title="Clear search keyword"
          >
            <X size={13} />
          </button>
        ) : (
          !isMobile && (
            <kbd
              style={{
                fontSize: '10px',
                padding: '1px 4px',
                backgroundColor: 'var(--bg-surface-active)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              ⌘F
            </kbd>
          )
        )}
      </div>

      {/* Inline Suggestions Dropdown (Directly below header search bar) */}
      {isOpen && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: isMobile ? '280px' : '420px',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {results.length > 0 ? (
            <div style={{ padding: 'var(--space-1-5)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  fontSize: '10.5px',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 4,
                }}
              >
                <span>Found {results.length} result(s)</span>
                <span>Press ↵ Enter to persist keyword</span>
              </div>

              {results.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isHot = item.type === 'task' && (item.raw?.isHotfix || item.raw?.tags?.includes('hotfix'));

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onMouseDown={(e) => {
                      // Prevent input blur before click registers
                      e.preventDefault();
                      handleSelectResult(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2-5)',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    {/* Icon */}
                    <div style={{ flexShrink: 0 }}>
                      {item.type === 'project' ? (
                        <ProjectAvatar project={item.raw} size={22} />
                      ) : item.type === 'task' ? (
                        isHot ? (
                          <Flame size={16} style={{ color: '#f43f5e' }} />
                        ) : (
                          <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
                        )
                      ) : (
                        <FileText size={16} style={{ color: 'var(--color-warning)' }} />
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                        }}
                        className="truncate"
                      >
                        {highlightText(item.title, query)}
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

                    {/* Metadata badge or jump hint */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {item.type === 'task' && item.raw?.status && (
                        <StatusBadge status={item.raw.status} />
                      )}
                      {isSelected && (
                        <CornerDownLeft size={12} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 'var(--space-6) var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              No matching projects, tasks, or documents found.
              <div style={{ marginTop: 4, fontSize: '11px' }}>
                Press ↵ Enter to keep highlighting "{query}".
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

