import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

/**
 * Escapes HTML entities to prevent XSS attacks while rendering raw user markdown.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlights matches of keyword within HTML safely.
 */
function applyHighlight(html, keyword) {
  if (!keyword || !keyword.trim()) return html;
  const escapedKey = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?![^<]*>)(${escapedKey})`, 'gi');
  return html.replace(regex, '<mark class="search-highlight">$1</mark>');
}

export function toggleChecklistInMarkdown(markdown, targetIndex) {
  if (!markdown) return '';
  let currentIdx = 0;
  // Matches task checkboxes: `[]`, `[ ]`, `[.]`, `[x]`, `[X]`
  const regex = /((?:^|\n)[ \t]*(?:[-*]\s*)?\[)([.xX\s]*)(\]\s*[^\n]+)/g;
  return markdown.replace(regex, (match, prefix, checkVal, suffix) => {
    if (currentIdx === targetIndex) {
      currentIdx++;
      const isChecked = checkVal.trim() === '.' || checkVal.trim().toLowerCase() === 'x';
      const nextVal = isChecked ? ' ' : '.';
      return `${prefix}${nextVal}${suffix}`;
    }
    currentIdx++;
    return match;
  });
}

export const MarkdownRenderer = ({
  content = '',
  highlight = '',
  className = '',
  style = {},
  compact = false,
  onToggleCheckbox,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

  let navigate = null;
  try {
    navigate = useNavigate();
  } catch (err) {
    // router context not available
  }

  let workspace = {};
  try {
    workspace = useWorkspace ? useWorkspace() : {};
  } catch (err) {}

  const projects = workspace?.projects || [];
  const tasks = workspace?.tasks || [];
  const setActiveProjectId = workspace?.setActiveProjectId;

  let toast = {};
  try {
    toast = useToast ? useToast() : {};
  } catch (err) {}

  const handleOpenMention = (type, targetName) => {
    if (!targetName) return;
    const cleanTarget = targetName.trim().toLowerCase();

    if (type === 'project') {
      let match = projects.find(
        (p) => (p.name && p.name.toLowerCase() === cleanTarget) || (p.id && p.id.toLowerCase() === cleanTarget)
      );
      if (!match) {
        match = projects.find(
          (p) => p.name && p.name.toLowerCase().includes(cleanTarget)
        );
      }
      if (match) {
        if (setActiveProjectId) setActiveProjectId(match.id);
        const url = `/project/${match.id}/tasks`;
        if (navigate) navigate(url);
        else window.location.href = url;
        if (toast?.toastInfo) toast.toastInfo(`Opened project "${match.name}"`);
      } else {
        if (toast?.toastError) toast.toastError(`Project "${targetName}" not found`);
      }
    } else if (type === 'task') {
      let match = tasks.find(
        (t) => (t.title && t.title.toLowerCase() === cleanTarget) || (t.id && t.id.toLowerCase() === cleanTarget)
      );
      if (!match) {
        match = tasks.find(
          (t) => t.title && t.title.toLowerCase().includes(cleanTarget)
        );
      }
      if (match) {
        if (setActiveProjectId && match.projectId) setActiveProjectId(match.projectId);
        const url = match.projectId
          ? `/project/${match.projectId}/tasks/${match.id}`
          : `/tasks/${match.id}`;
        if (navigate) navigate(url);
        else window.location.href = url;
        if (toast?.toastInfo) toast.toastInfo(`Opened task "${match.title}"`);
      } else {
        if (toast?.toastError) toast.toastError(`Task "${targetName}" not found`);
      }
    }
  };

  if (!content || !content.trim()) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic', ...style }}>
        No content provided.
      </div>
    );
  }

  // Pre-process: extract fenced code blocks to prevent inner markdown processing
  const codeBlocks = [];
  let processed = content.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({
      lang: lang || 'text',
      code: code.trimEnd(),
    });
    return placeholder;
  });

  // Escape HTML
  let html = escapeHtml(processed);

  // Headers
  html = html.replace(/^#### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Horizontal divider
  html = html.replace(/^(?:---|\*\*\*|___)$/gim, '<hr class="md-hr" />');

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

  // Task list checkboxes with clickable on-the-spot toggling:
  let checkboxCount = 0;
  html = html.replace(/^[ \t]*(?:[-*]\s*)?\[([.xX\s]*)\]\s*(.*$)/gim, (match, checkVal, text) => {
    const isChecked = checkVal.trim() === '.' || checkVal.trim().toLowerCase() === 'x';
    const index = checkboxCount++;
    const interactiveClass = onToggleCheckbox ? 'interactive' : '';
    return `<div class="md-checkbox ${isChecked ? 'checked' : ''} ${interactiveClass}" data-check-index="${index}"><span class="md-check-btn" data-check-index="${index}">${isChecked ? '✓' : ''}</span><span class="md-check-text">${text}</span></div>`;
  });

  // Inline checkboxes
  html = html.replace(/(?:^|\s)\[(?:\.|[xX])\](?:\s|$)/gm, ' <span class="md-check-inline checked" style="color: var(--status-done-solid); font-weight: bold;">☑</span> ');
  html = html.replace(/(?:^|\s)\[(?:\s*)\](?:\s|$)/gm, ' <span class="md-check-inline" style="color: var(--text-muted); font-weight: bold;">☐</span> ');

  // Object mentions: #[Project Name] -> mention pill for projects (must not be inside HTML tags)
  html = html.replace(/(?![^<]*>)#\[([^\]]+)\]/g, '<span class="mention-pill mention-project" data-mention-type="project" data-mention-target="$1" title="⌘+Click to open"><span class="mention-symbol">#</span>$1</span>');
  // Object mentions: @[Task Title] -> mention pill for tasks
  html = html.replace(/(?![^<]*>)@\[([^\]]+)\]/g, '<span class="mention-pill mention-task" data-mention-type="task" data-mention-target="$1" title="⌘+Click to open"><span class="mention-symbol">@</span>$1</span>');

  // Standalone word mentions (only outside HTML tags and only if preceded by whitespace/start):
  html = html.replace(/(?![^<]*>)(?<=(?:^|[\s(]))@([a-zA-Z0-9_-]+)(?=(?:[\s).,!?:;]|$))/g, '<span class="mention-pill mention-task" data-mention-type="task" data-mention-target="$1" title="⌘+Click to open"><span class="mention-symbol">@</span>$1</span>');
  html = html.replace(/(?![^<]*>)(?<=(?:^|[\s(]))#([a-zA-Z0-9_-]+)(?=(?:[\s).,!?:;]|$))/g, '<span class="mention-pill mention-project" data-mention-type="project" data-mention-target="$1" title="⌘+Click to open"><span class="mention-symbol">#</span>$1</span>');

  // Unordered list items
  html = html.replace(/^[-*] (.*$)/gim, '<li class="md-li">$1</li>');

  // Inline formatting
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Images ![alt](url) - handle images before standard links
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" style="max-width: 100%; max-height: 500px; height: auto; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 8px 0; display: block; box-shadow: var(--shadow-sm);" loading="lazy" />');

  // Standalone image URLs (e.g. https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png)
  html = html.replace(
    /(?<!src=["']|href=["'])(https?:\/\/[^\s<>'"]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff)(?:\?[^\s<>'"]*)?(?:#[^\s<>'"]*)?)/gi,
    '<img src="$1" alt="Image" class="md-img" style="max-width: 100%; max-height: 500px; height: auto; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 8px 0; display: block; box-shadow: var(--shadow-sm);" loading="lazy" />'
  );

  // Links [text](url) - negative lookbehind ensures not part of an image
  html = html.replace(/(?<!\!)\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '<br/><br/>');
  html = html.replace(/(?<!>)\n(?!<)/g, '<br/>');

  // Restore code blocks with clean UI
  codeBlocks.forEach((block, index) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    const escapedCode = escapeHtml(block.code);
    const codeId = `code-block-${index}`;
    const codeHtml = `
      <div class="md-code-block-container" data-code-index="${index}">
        <div class="md-code-header">
          <span class="md-code-lang">${escapeHtml(block.lang)}</span>
          <button type="button" class="md-code-copy-btn" data-index="${index}">Copy</button>
        </div>
        <pre><code id="${codeId}" class="language-${escapeHtml(block.lang)}">${escapedCode}</code></pre>
      </div>
    `;
    html = html.replace(placeholder, codeHtml);
  });

  // Apply search query highlight if present
  if (highlight) {
    html = applyHighlight(html, highlight);
  }

  const handleContainerClick = (e) => {
    const copyBtn = e.target.closest('.md-code-copy-btn');
    if (copyBtn) {
      const index = parseInt(copyBtn.getAttribute('data-index'), 10);
      if (!isNaN(index) && codeBlocks[index]) {
        navigator.clipboard.writeText(codeBlocks[index].code);
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      }
      return;
    }

    const mentionPill = e.target.closest('.mention-pill');
    if (mentionPill && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      const type = mentionPill.getAttribute('data-mention-type');
      const targetName = mentionPill.getAttribute('data-mention-target');
      handleOpenMention(type, targetName);
      return;
    }

    const checkTarget = e.target.closest('[data-check-index]');
    if (checkTarget && onToggleCheckbox) {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(checkTarget.getAttribute('data-check-index'), 10);
      if (!isNaN(index)) {
        onToggleCheckbox(index);
      }
    }
  };

  return (
    <div
      className={`markdown-rendered-content ${compact ? 'compact' : ''} ${className}`}
      style={{
        lineHeight: compact ? 1.4 : 1.6,
        fontSize: compact ? '11.5px' : 'var(--text-xs)',
        color: 'var(--text-secondary)',
        wordBreak: 'break-word',
        ...style,
      }}
      onClick={handleContainerClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

