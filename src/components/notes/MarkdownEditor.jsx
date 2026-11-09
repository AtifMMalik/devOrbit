import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Eye, Edit3, Save, Copy, Check, Folder, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { MarkdownRenderer, toggleChecklistInMarkdown } from '../common/MarkdownRenderer';
import { getCaretCoordinates } from '../../utils/caretCoordinates';

export const MarkdownEditor = ({
  initialTitle = '',
  initialContent = '',
  onSave,
}) => {
  const { toastSuccess } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState('preview'); // Default to 'preview'
  const [copied, setCopied] = useState(false);

  // Split view center resizer (default 50% / 50%)
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = moveEvent.clientX - rect.left;
      const newRatio = Math.max(20, Math.min(80, (offsetX / rect.width) * 100));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSave = () => {
    onSave(title, content);
    toastSuccess('Document saved successfully');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toastSuccess('Notes copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleChecklist = (targetIdx) => {
    const updated = toggleChecklistInMarkdown(content, targetIdx);
    setContent(updated);
  };

  const workspace = useWorkspace ? useWorkspace() : {};
  const projects = workspace?.projects || [];
  const tasks = workspace?.tasks || [];
  const textareaRef = useRef(null);
  const mentionMenuRef = useRef(null);
  const [inlineMention, setInlineMention] = useState(null);

  const checkMentionTrigger = useCallback((ta) => {
    if (!ta) return;
    const caret = typeof ta.selectionStart === 'number' ? ta.selectionStart : (ta.value || '').length;
    const val = ta.value || '';
    const beforeCaret = val.slice(0, caret);

    const lastHashBracket = beforeCaret.lastIndexOf('#[');
    const lastAtBracket = beforeCaret.lastIndexOf('@[');

    let trigger = null;
    let triggerIndex = -1;

    if (lastHashBracket > lastAtBracket) {
      trigger = '#[';
      triggerIndex = lastHashBracket;
    } else if (lastAtBracket > -1) {
      trigger = '@[';
      triggerIndex = lastAtBracket;
    }

    if (triggerIndex !== -1) {
      const textAfterTrigger = beforeCaret.slice(triggerIndex + 2);
      if (!textAfterTrigger.includes('\n') && !textAfterTrigger.includes(']')) {
        const query = textAfterTrigger.trim().toLowerCase();
        const coords = getCaretCoordinates(ta, caret);

        setInlineMention((prev) => {
          const prevIndex =
            prev && prev.isOpen && prev.triggerIndex === triggerIndex && prev.query === query
              ? prev.selectedIndex
              : 0;
          return {
            isOpen: true,
            type: trigger === '#[' ? 'project' : 'task',
            query,
            triggerIndex,
            caretIndex: caret,
            coords: {
              top: (coords.top || 0) + (coords.height || 18) + 4,
              left: Math.min(window.innerWidth - 260, Math.max(12, coords.left || 20)),
            },
            selectedIndex: prevIndex,
          };
        });
        return;
      }
    }

    setInlineMention(null);
  }, []);

  const inlineMentionItems = useMemo(() => {
    if (!inlineMention || !inlineMention.isOpen) return [];
    if (inlineMention.type === 'project') {
      const list = projects || [];
      return list
        .filter((p) => !inlineMention.query || (p.name && p.name.toLowerCase().includes(inlineMention.query)))
        .slice(0, 8);
    } else {
      const list = tasks || [];
      return list
        .filter((t) => !inlineMention.query || (t.title && t.title.toLowerCase().includes(inlineMention.query)))
        .slice(0, 8);
    }
  }, [inlineMention, projects, tasks]);

  const handleSelectInlineMention = (item) => {
    if (!inlineMention || !item) return;
    const { triggerIndex, caretIndex, type } = inlineMention;
    const insertStr = type === 'project' ? `#[${item.name}] ` : `@[${item.title}] `;

    const before = content.slice(0, triggerIndex);
    const after = content.slice(caretIndex);
    const nextContent = before + insertStr + after;

    setContent(nextContent);
    setInlineMention(null);
    toastSuccess(`Mentioned ${type === 'project' ? item.name : item.title}`);

    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const newCaret = triggerIndex + insertStr.length;
        ta.setSelectionRange(newCaret, newCaret);
      }
    }, 30);
  };

  const handleTextareaKeyDown = (e) => {
    if (!inlineMention || !inlineMention.isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setInlineMention((prev) => {
        if (!prev) return null;
        const total = inlineMentionItems.length;
        if (total === 0) return prev;
        return {
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % total,
        };
      });
      return;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setInlineMention((prev) => {
        if (!prev) return null;
        const total = inlineMentionItems.length;
        if (total === 0) return prev;
        return {
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + total) % total,
        };
      });
      return;
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (inlineMentionItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        const selected = inlineMentionItems[inlineMention.selectedIndex] || inlineMentionItems[0];
        handleSelectInlineMention(selected);
      }
      return;
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setInlineMention(null);
      return;
    }
  };

  useEffect(() => {
    const handleGlobalPointerDown = (e) => {
      if (
        mentionMenuRef.current &&
        !mentionMenuRef.current.contains(e.target) &&
        (!textareaRef.current || !textareaRef.current.contains(e.target))
      ) {
        setInlineMention(null);
      }
    };
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => window.removeEventListener('pointerdown', handleGlobalPointerDown);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 280px)',
        minHeight: '480px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar with document title and view controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-5)',
          borderBottom: '1px solid var(--border-muted)',
          backgroundColor: 'var(--bg-card-subtle)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <input
          type="text"
          placeholder="Document Title (e.g. Architecture Overview, API Contracts)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          spellCheck={true}
          style={{
            maxWidth: '420px',
            fontWeight: 'var(--font-weight-semibold)',
            fontSize: 'var(--text-base)',
            border: 'none',
            background: 'transparent',
            padding: 0,
            boxShadow: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('edit')}
              style={{
                padding: 'var(--space-1) var(--space-2-5)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: mode === 'edit' ? 'var(--bg-surface-active)' : 'transparent',
                color: mode === 'edit' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              style={{
                padding: 'var(--space-1) var(--space-2-5)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: mode === 'split' ? 'var(--bg-surface-active)' : 'transparent',
                color: mode === 'split' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              style={{
                padding: 'var(--space-1) var(--space-2-5)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: mode === 'preview' ? 'var(--bg-surface-active)' : 'transparent',
                color: mode === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      {/* Editor / Preview Body with VS Code-style draggable center divider */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Edit Panel */}
        {(mode === 'edit' || mode === 'split') && (
          <div
            style={{
              width: mode === 'split' ? `${splitRatio}%` : '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <textarea
              ref={textareaRef}
              className="no-resize-textarea"
              placeholder="# Write your project architecture, specs, or release logs in Markdown here..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                checkMentionTrigger(e.target);
              }}
              onKeyUp={(e) => {
                if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
                checkMentionTrigger(e.target);
              }}
              onClick={(e) => checkMentionTrigger(e.target)}
              onKeyDown={handleTextareaKeyDown}
              spellCheck={true}
              style={{
                height: '100%',
                width: '100%',
                padding: 'var(--space-4)',
                border: 'none',
                borderRadius: 0,
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.6,
                resize: 'none',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        )}

        {/* Center Draggable Divider Handle (VS Code style) */}
        {mode === 'split' && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '6px',
              cursor: 'col-resize',
              backgroundColor: isDragging ? 'var(--color-primary)' : 'var(--border-default)',
              transition: isDragging ? 'none' : 'background-color var(--transition-fast)',
              position: 'relative',
              zIndex: 10,
              userSelect: 'none',
              flexShrink: 0,
            }}
            title="Drag to resize split view panels"
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '24px',
                backgroundColor: isDragging ? '#ffffff' : 'var(--text-muted)',
                borderRadius: '1px',
              }}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            style={{
              width: mode === 'split' ? `${100 - splitRatio}%` : '100%',
              height: '100%',
              padding: 'var(--space-6)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              minWidth: 0,
            }}
          >
            <MarkdownRenderer content={content} onToggleCheckbox={handleToggleChecklist} />
          </div>
        )}
      </div>

      {/* Floating Cursor Autocomplete Modal for Mentions */}
      {inlineMention && inlineMention.isOpen && (
        <div
          ref={mentionMenuRef}
          className="glass-panel animate-pop"
          style={{
            position: 'fixed',
            top: Math.min(window.innerHeight - 260, Math.max(10, inlineMention.coords.top)),
            left: Math.min(window.innerWidth - 260, Math.max(10, inlineMention.coords.left)),
            zIndex: 99999,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl), 0 8px 32px rgba(0,0,0,0.4)',
            padding: '4px',
            minWidth: '220px',
            maxWidth: '300px',
            maxHeight: '240px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontSize: 'var(--text-xs)',
            textAlign: 'left',
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 2,
            }}
          >
            {inlineMention.type === 'project' ? 'Mention Project' : 'Mention Task'}
          </div>
          {inlineMentionItems.length > 0 ? (
            inlineMentionItems.map((item, idx) => {
              const isSelected = idx === inlineMention.selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={(el) => {
                    if (isSelected && el) el.scrollIntoView({ block: 'nearest' });
                  }}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectInlineMention(item);
                  }}
                  onClick={() => handleSelectInlineMention(item)}
                  onMouseMove={() => {
                    if (inlineMention.selectedIndex !== idx) {
                      setInlineMention((prev) => (prev ? { ...prev, selectedIndex: idx } : null));
                    }
                  }}
                >
                  {inlineMention.type === 'project' ? (
                    <Folder
                      size={13}
                      style={{ color: item.color || 'var(--color-primary)', flexShrink: 0 }}
                    />
                  ) : (
                    <FileText size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <span
                    className="truncate"
                    style={{
                      fontWeight: isSelected ? '600' : 'normal',
                      textAlign: 'left',
                      flex: 1,
                    }}
                  >
                    {inlineMention.type === 'project' ? item.name : item.title}
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              No {inlineMention.type === 'project' ? 'projects' : 'tasks'} found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
