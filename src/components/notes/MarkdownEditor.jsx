import React, { useState } from 'react';
import { Eye, Edit3, Save, Copy, Check } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

export const MarkdownEditor = ({
  initialTitle = '',
  initialContent = '',
  onSave,
}) => {
  const { toastSuccess } = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState('split'); // 'edit' | 'preview' | 'split'
  const [copied, setCopied] = useState(false);

  // Simple, resilient markdown renderer without external heavy parsers
  const renderMarkdown = (text) => {
    if (!text) return '<p style="color: var(--text-muted); font-style: italic;">No content written yet...</p>';

    // Escape HTML to prevent XSS
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: var(--text-base); margin: var(--space-3) 0 var(--space-1) 0; color: var(--text-primary);">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: var(--text-lg); margin: var(--space-4) 0 var(--space-2) 0; color: var(--text-primary); border-bottom: 1px solid var(--border-muted); padding-bottom: 4px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: var(--text-xl); margin: var(--space-4) 0 var(--space-2) 0; color: var(--text-primary);">$1</h1>');

    // Bold, Italic, Code
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--text-primary); font-weight: 600;">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/gim, '<code style="background: var(--bg-surface-active); color: var(--color-accent); padding: 2px 6px; border-radius: var(--radius-xs); font-size: 0.85em;">$1</code>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--color-primary); padding-left: var(--space-3); color: var(--text-secondary); margin: var(--space-2) 0;">$1</blockquote>');

    // Checkboxes & lists
    html = html.replace(/^- \[x\] (.*$)/gim, '<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0; color: var(--text-muted); text-decoration: line-through;"><span style="color: var(--status-done-solid);">☑</span> $1</div>');
    html = html.replace(/^- \[ \] (.*$)/gim, '<div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;"><span style="color: var(--text-muted);">☐</span> $1</div>');
    html = html.replace(/^- (.*$)/gim, '<li style="margin: 3px 0; margin-left: 18px; color: var(--text-secondary);">$1</li>');

    // Paragraphs / line breaks
    html = html.replace(/\n\n/gim, '<br/><br/>');

    return html;
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
          {/* View Mode */}
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
              }}
            >
              Split
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

      {/* Editor / Preview Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mode === 'split' ? '1fr 1fr' : '1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Edit Panel */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            placeholder="# Write your project architecture, specs, or release logs in Markdown here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
              borderRight: mode === 'split' ? '1px solid var(--border-muted)' : 'none',
            }}
          />
        )}

        {/* Preview Panel */}
        {(mode === 'preview' || mode === 'split') && (
          <div
            style={{
              height: '100%',
              padding: 'var(--space-6)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              fontSize: 'var(--text-sm)',
              lineHeight: 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </div>
  );
};
