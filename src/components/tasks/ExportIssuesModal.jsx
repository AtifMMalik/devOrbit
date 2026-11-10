import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Download,
  ArrowUp,
  ArrowDown,
  FileText,
  FileCode,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  DEFAULT_MARKDOWN_FIELDS,
  formatTasksToMarkdown,
  formatTasksToJson,
} from '../../utils/issueExporter';

export const ExportIssuesModal = ({
  isOpen,
  onClose,
  initialList = 'all', // 'all' | 'hotfix' | 'current' | 'later' | 'done'
  tasks = [],
  currentProject,
}) => {
  const { getProjectTasks } = useWorkspace();

  const [mode, setMode] = useState('markdown'); // 'markdown' | 'json'
  const [selectedList, setSelectedList] = useState(initialList);
  const [fields, setFields] = useState(DEFAULT_MARKDOWN_FIELDS);
  const [isCopied, setIsCopied] = useState(false);

  // JSON Mode State
  const [jsonScope, setJsonScope] = useState('list'); // 'list' | 'project' | 'subprojects' | 'custom'
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [issueSearch, setIssueSearch] = useState('');

  // Update selected list when initialList changes
  React.useEffect(() => {
    if (initialList) {
      setSelectedList(initialList);
    }
  }, [initialList]);

  // Determine tasks based on selected list and scope
  const targetTasks = useMemo(() => {
    let baseList = tasks;

    if (mode === 'json') {
      if (jsonScope === 'project' && currentProject) {
        baseList = getProjectTasks(currentProject.id, false);
      } else if (jsonScope === 'subprojects' && currentProject) {
        baseList = getProjectTasks(currentProject.id, true);
      }
    }

    if (mode === 'json' && jsonScope === 'custom') {
      return baseList.filter((t) => selectedTaskIds.has(t.id));
    }

    if (selectedList === 'all') {
      return baseList;
    }

    return baseList.filter((t) => {
      const norm = (t.status || 'current').toLowerCase();
      if (selectedList === 'hotfix') {
        if (norm === 'done') return false;
        return norm === 'hotfix' || Boolean(t.isHotfix) || (t.tags && t.tags.includes('hotfix'));
      }
      return norm === selectedList;
    });
  }, [tasks, selectedList, mode, jsonScope, currentProject, getProjectTasks, selectedTaskIds]);

  // Select all tasks for custom JSON export initially
  React.useEffect(() => {
    if (tasks.length > 0 && selectedTaskIds.size === 0) {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  }, [tasks]);

  // Move a field up in order
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setFields((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move a field down in order
  const handleMoveDown = (index) => {
    if (index >= fields.length - 1) return;
    setFields((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Toggle field inclusion
  const handleToggleField = (id) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  // Generated markdown preview
  const markdownContent = useMemo(() => {
    return formatTasksToMarkdown(targetTasks, fields);
  }, [targetTasks, fields]);

  // Generated JSON preview
  const jsonContent = useMemo(() => {
    return formatTasksToJson(targetTasks);
  }, [targetTasks]);

  const previewContent = mode === 'markdown' ? markdownContent : jsonContent;

  const handleCopy = async () => {
    if (!previewContent) return;
    try {
      await navigator.clipboard.writeText(previewContent);
      setIsCopied(true);
      toastSuccess(
        `Copied ${targetTasks.length} issue(s) as ${mode.toUpperCase()} to clipboard!`
      );
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_e) {
      // Ignore
    }
  };

  const handleDownload = () => {
    if (!previewContent) return;
    const extension = mode === 'markdown' ? 'md' : 'json';
    const mimeType = mode === 'markdown' ? 'text/markdown' : 'application/json';
    const listLabel = selectedList !== 'all' ? selectedList : 'all-issues';
    const filename = `${currentProject?.name || 'devorbit'}-${listLabel}-${Date.now()}.${extension}`;

    const blob = new Blob([previewContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toastSuccess(`Downloaded ${filename}`);
  };

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleSelectAllCustom = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const filteredTasksForCustom = useMemo(() => {
    if (!issueSearch.trim()) return tasks;
    const q = issueSearch.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [tasks, issueSearch]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export & Copy Issues" maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Format Selector Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-app)',
            padding: 4,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('markdown')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: mode === 'markdown' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'markdown' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'markdown' ? 'var(--font-weight-semibold)' : 'normal',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              boxShadow: mode === 'markdown' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileText size={14} />
            Markdown
          </button>

          <button
            type="button"
            onClick={() => setMode('json')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: mode === 'json' ? 'var(--bg-surface)' : 'transparent',
              color: mode === 'json' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: mode === 'json' ? 'var(--font-weight-semibold)' : 'normal',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              boxShadow: mode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileCode size={14} />
            JSON
          </button>
        </div>

        {/* Controls Bar: List selection & JSON scope */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
          }}
        >
          {/* Target List Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>
              Source List:
            </label>
            <select
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}
            >
              <option value="all">All Lists (Hotfix, Ongoing, Queued, Done)</option>
              <option value="hotfix">Hot Fix List Only</option>
              <option value="current">Ongoing tasks List Only</option>
              <option value="later">Queued tasks List Only</option>
              <option value="done">Done / Completed Only</option>
            </select>
          </div>

          {/* JSON Scope Selection */}
          {mode === 'json' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-secondary)' }}>
                Export Scope:
              </label>
              <select
                value={jsonScope}
                onChange={(e) => setJsonScope(e.target.value)}
                style={{ fontSize: 'var(--text-xs)', padding: '4px 8px' }}
              >
                <option value="list">Selected List ({selectedList})</option>
                <option value="project">Current Project Only</option>
                <option value="subprojects">Project + All Sub-Projects</option>
                <option value="custom">Select Individual Issues...</option>
              </select>
            </div>
          )}

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Exporting <strong>{targetTasks.length}</strong> issue{targetTasks.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Markdown Mode: Field Selector & Custom Reordering */}
        {mode === 'markdown' && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Select Fields & Adjust Order:
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Use ▲ ▼ arrows to reorder output fields
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1-5)',
              }}
            >
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: field.enabled ? 'var(--bg-surface-active)' : 'var(--bg-app)',
                    border: `1px solid ${field.enabled ? 'var(--color-primary)' : 'var(--border-subtle)'}`,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: field.enabled ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: field.enabled ? 'bold' : 'normal',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => handleToggleField(field.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    {field.label}
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="btn-icon"
                      style={{ width: 18, height: 18, opacity: idx === 0 ? 0.3 : 1 }}
                      title="Move up"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === fields.length - 1}
                      className="btn-icon"
                      style={{ width: 18, height: 18, opacity: idx === fields.length - 1 ? 0.3 : 1 }}
                      title="Move down"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON Mode: Individual Issues Checklist (If jsonScope === 'custom') */}
        {mode === 'json' && jsonScope === 'custom' && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              maxHeight: '180px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={toggleSelectAllCustom}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {selectedTaskIds.size === tasks.length ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{selectedTaskIds.size === tasks.length ? 'Deselect All' : 'Select All'}</span>
                </button>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({selectedTaskIds.size}/{tasks.length} selected)
                </span>
              </div>

              <div style={{ position: 'relative', width: '180px' }}>
                <Search size={12} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter issues..."
                  value={issueSearch}
                  onChange={(e) => setIssueSearch(e.target.value)}
                  style={{ padding: '2px 6px 2px 22px', fontSize: '11px', width: '100%' }}
                  spellCheck={true}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {filteredTasksForCustom.map((t) => {
                const isSelected = selectedTaskIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleSelectTask(t.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare size={13} style={{ color: 'var(--color-primary)' }} />
                    ) : (
                      <Square size={13} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Preview Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Preview Output ({mode.toUpperCase()}):
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {previewContent.length.toLocaleString()} characters
            </span>
          </div>

          <textarea
            readOnly
            value={previewContent || '/* No issues match the selected criteria */'}
            rows={8}
            style={{
              width: '100%',
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              lineHeight: 1.5,
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              padding: 'var(--space-3)',
              color: 'var(--text-primary)',
            }}
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-default)',
            paddingTop: 'var(--space-3)',
          }}
        >
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              type="button"
              variant="secondary"
              icon={isCopied ? Check : Copy}
              onClick={handleCopy}
              disabled={!previewContent}
            >
              {isCopied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </Button>

            <Button
              type="button"
              variant="primary"
              icon={Download}
              onClick={handleDownload}
              disabled={!previewContent}
            >
              Download {mode === 'markdown' ? '.md' : '.json'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

