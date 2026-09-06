import React, { useState, useMemo } from 'react';
import { Copy, Download, Upload, Check, FileCode, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { exportTasksToMarkdown, parseMarkdownToTasks } from '../../utils/markdownParser';

export const MarkdownSyncModal = ({
  isOpen,
  onClose,
  project,
}) => {
  const { getProjectTasks, importTasks } = useWorkspace();
  const { toastSuccess, toastError } = useToast();

  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  const tasks = useMemo(() => {
    return project ? getProjectTasks(project.id, false) : [];
  }, [project, getProjectTasks]);

  const markdownContent = useMemo(() => {
    if (!project) return '';
    return exportTasksToMarkdown(tasks, project.name);
  }, [project, tasks]);

  const parsedImportTasks = useMemo(() => {
    if (!importText.trim() || !project) return [];
    return parseMarkdownToTasks(importText, project.id);
  }, [importText, project]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      toastSuccess('Markdown copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toastError('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeProjectName = (project?.name || 'tasks').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${safeProjectName}_tasks.md`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toastSuccess('Downloaded tasks markdown file');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setImportText(content);
        toastSuccess(`Loaded file "${file.name}"`);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (parsedImportTasks.length === 0) {
      toastError('No valid tasks found in the markdown text.');
      return;
    }

    importTasks(parsedImportTasks);
    toastSuccess(`Successfully imported ${parsedImportTasks.length} tasks!`);
    setImportText('');
    onClose();
  };

  if (!project) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Markdown Sync & Importer / Exporter"
      subtitle={`Seamlessly sync tasks between devOrbit and your Markdown notes for "${project.name}"`}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface-hover)',
            padding: 3,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === 'export' ? 'var(--font-weight-semibold)' : 'normal',
              backgroundColor: activeTab === 'export' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'export' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: activeTab === 'export' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Export to Markdown ({tasks.length} tasks)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            style={{
              flex: 1,
              padding: 'var(--space-2) 0',
              fontSize: 'var(--text-xs)',
              fontWeight: activeTab === 'import' ? 'var(--font-weight-semibold)' : 'normal',
              backgroundColor: activeTab === 'import' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'import' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: activeTab === 'import' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Import from Markdown
          </button>
        </div>

        {/* Export View */}
        {activeTab === 'export' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
              Here is your live task list formatted into Markdown with Current, Later, Done sections, tags, and checklist items.
            </p>

            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                rows={12}
                value={markdownContent}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  lineHeight: 1.5,
                  backgroundColor: 'var(--bg-card-subtle)',
                  color: 'var(--text-primary)',
                  padding: 'var(--space-3)',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy Markdown'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={handleDownload}
              >
                Download .md File
              </Button>
            </div>
          </div>
        ) : (
          /* Import View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
              }}
            >
              <span>Paste your markdown checklist or upload a file:</span>
              <label
                style={{
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 'var(--text-xs)',
                }}
              >
                <Upload size={13} />
                <span>Upload .md file</span>
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <textarea
              rows={9}
              placeholder={`# Project Tasks
## Current
- [ ] Build user onboarding #feature
  - [ ] Welcome modal
  - [ ] Guided tour

## Later
- [ ] Optimize database indexing #refactor

## Done
- [x] Set up CI/CD pipeline #devops
`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                backgroundColor: 'var(--bg-card-subtle)',
                padding: 'var(--space-3)',
              }}
            />

            {/* Parsed Preview status */}
            {parsedImportTasks.length > 0 && (
              <div
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-done-bg)',
                  border: '1px solid var(--status-done-border)',
                  color: 'var(--status-done-text)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle2 size={16} />
                  <span>
                    Detected <strong>{parsedImportTasks.length} tasks</strong> ready to import!
                  </span>
                </div>
                <span>
                  {parsedImportTasks.filter((t) => t.status === 'current').length} Current,{' '}
                  {parsedImportTasks.filter((t) => t.status === 'later').length} Later,{' '}
                  {parsedImportTasks.filter((t) => t.status === 'done').length} Done
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={parsedImportTasks.length === 0}
                onClick={handleExecuteImport}
              >
                Import {parsedImportTasks.length > 0 ? `(${parsedImportTasks.length}) Tasks` : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
