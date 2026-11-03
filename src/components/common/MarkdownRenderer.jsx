import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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

export const MarkdownRenderer = ({
  content = '',
  highlight = '',
  className = '',
  style = {},
  compact = false,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);

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

  // Task list checkboxes
  html = html.replace(/^- \[x\] (.*$)/gim, '<div class="md-checkbox checked"><span class="md-check-icon">☑</span> <span>$1</span></div>');
  html = html.replace(/^- \[ \] (.*$)/gim, '<div class="md-checkbox"><span class="md-check-icon">☐</span> <span>$1</span></div>');

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

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

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

