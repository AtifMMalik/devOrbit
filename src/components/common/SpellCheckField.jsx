import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sparkles, Check, Plus, X } from 'lucide-react';
import {
  analyzeTextSpelling,
  addToUserDictionary,
  ignoreWordForSession,
} from '../../utils/spellChecker';

/**
 * Word / Google Docs-style Floating Suggestions Popover
 * Rendered directly anchored beneath the misspelled word in the text.
 */
export const SpellCheckTooltip = ({
  error,
  position,
  onApplySuggestion,
  onIgnore,
  onAddToDictionary,
  onClose,
}) => {
  if (!error) return null;

  return (
    <div
      className="glass-panel animate-pop"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-xl), 0 8px 30px rgba(0,0,0,0.4)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: '220px',
        maxWidth: '320px',
        fontSize: 'var(--text-xs)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Spelling suggestion:
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="btn-icon"
          style={{ width: 18, height: 18 }}
          title="Dismiss"
        >
          <X size={11} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: '#f43f5e', textDecoration: 'line-through' }}>
          {error.word}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        {error.suggestions && error.suggestions.length > 0 ? (
          error.suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onApplySuggestion(error, sug)}
              style={{
                backgroundColor: 'rgba(0, 132, 255, 0.12)',
                color: 'var(--color-primary)',
                border: '1px solid rgba(0, 132, 255, 0.3)',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 8px',
                fontSize: '11.5px',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title={`Replace "${error.word}" with "${sug}"`}
            >
              {sug}
            </button>
          ))
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
            No direct suggestions
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 4,
          marginTop: 2,
        }}
      >
        <button
          type="button"
          onClick={() => onIgnore(error.word)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
          title="Ignore this spelling for now"
        >
          <Check size={11} />
          Ignore
        </button>

        <button
          type="button"
          onClick={() => onAddToDictionary(error.word)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
          title="Add word to custom dictionary"
        >
          <Plus size={11} />
          Add to dictionary
        </button>
      </div>
    </div>
  );
};

/**
 * Splits text into segments (plain text and misspelled words with red squiggly underlines)
 */
function buildUnderlaySegments(text, errors, markIdPrefix) {
  if (!text) return null;
  if (!errors || errors.length === 0) {
    return <span>{text}</span>;
  }

  const elements = [];
  let lastIndex = 0;

  errors.forEach((err, idx) => {
    if (err.start > lastIndex) {
      elements.push(
        <span key={`plain-${lastIndex}`}>
          {text.slice(lastIndex, err.start)}
        </span>
      );
    }

    elements.push(
      <mark
        key={`err-${err.start}-${idx}`}
        id={`${markIdPrefix}-${err.start}`}
        className="spellcheck-error-wavy"
      >
        {err.word}
      </mark>
    );

    lastIndex = err.end;
  });

  if (lastIndex < text.length) {
    elements.push(
      <span key={`plain-tail`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  // Ensure trailing newline is respected in height calculation
  if (text.endsWith('\n')) {
    elements.push(<span key="tail-br">{'\n'}</span>);
  }

  return elements;
}

/**
 * Word-Style SpellCheckTextarea:
 * Underlines misspelled words directly on the word itself (no extra bottom boxes).
 * Right-clicking or clicking on a misspelled word opens Word-style suggestions popover.
 */
export const SpellCheckTextarea = ({
  value = '',
  onChange,
  placeholder,
  rows = 4,
  style = {},
  className = '',
  onPaste,
  onDrop,
  onDragOver,
  inputRef,
  onKeyDown,
  ...rest
}) => {
  const [activeError, setActiveError] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const underlayRef = useRef(null);
  const instanceId = useMemo(() => 'spell-ta-' + Math.random().toString(36).substring(2, 8), []);

  const errors = useMemo(() => {
    return analyzeTextSpelling(value);
  }, [value, refreshKey]);

  // Synchronize scroll position between textarea and underlay
  const handleScroll = () => {
    if (textareaRef.current && underlayRef.current) {
      underlayRef.current.scrollTop = textareaRef.current.scrollTop;
      underlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const checkCaretForError = (offset) => {
    if (typeof offset !== 'number') return null;
    return errors.find((err) => offset >= err.start && offset <= err.end) || null;
  };

  const showSuggestionsForError = (err) => {
    if (!err) {
      setActiveError(null);
      return;
    }

    const markEl = document.getElementById(`${instanceId}-${err.start}`);
    if (markEl) {
      const rect = markEl.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 150, rect.bottom + 4);
      const left = Math.min(window.innerWidth - 240, Math.max(10, rect.left));
      setPopoverPos({ top, left });
      setActiveError(err);
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
      setActiveError(err);
    }
  };

  const handlePointerOrCaret = () => {
    if (!textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const err = checkCaretForError(caret);
    if (err) {
      showSuggestionsForError(err);
    } else {
      setActiveError(null);
    }
  };

  const handleContextMenu = (e) => {
    if (!textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const err = checkCaretForError(caret);
    if (err) {
      e.preventDefault();
      showSuggestionsForError(err);
    }
  };

  const handleApplySuggestion = (err, replacement) => {
    if (!onChange) return;
    const before = value.slice(0, err.start);
    const after = value.slice(err.end);
    const nextValue = before + replacement + after;
    onChange({ target: { value: nextValue } });
    setActiveError(null);

    // Restore focus to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextCaret = err.start + replacement.length;
        textareaRef.current.setSelectionRange(nextCaret, nextCaret);
      }
    }, 50);
  };

  const handleIgnore = (word) => {
    ignoreWordForSession(word);
    setActiveError(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAddToDict = (word) => {
    addToUserDictionary(word);
    setActiveError(null);
    setRefreshKey((k) => k + 1);
  };

  // Close tooltip on outside click or escape
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (activeError && containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveError(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveError(null);
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeError]);

  const underlayContent = useMemo(() => {
    return buildUnderlaySegments(value, errors, instanceId);
  }, [value, errors, instanceId]);

  return (
    <div
      ref={containerRef}
      className="spellcheck-field-container"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'var(--bg-input)',
        border: `1px solid ${isFocused ? 'var(--border-active)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-sm)',
        transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
        overflow: 'hidden',
      }}
    >
      {/* Synchronized Underlay: renders red wavy underlines directly beneath misspelled words */}
      <div
        ref={underlayRef}
        aria-hidden="true"
        className="spellcheck-underlay"
        style={{
          fontFamily: style.fontFamily || 'var(--font-sans)',
          fontSize: style.fontSize || 'var(--text-xs)',
          lineHeight: style.lineHeight || 1.5,
          padding: '7px 11px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {underlayContent}
      </div>

      {/* Main Transparent Textarea */}
      <textarea
        ref={(el) => {
          textareaRef.current = el;
          if (typeof inputRef === 'function') inputRef(el);
          else if (inputRef) inputRef.current = el;
        }}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        onClick={(e) => {
          handlePointerOrCaret(e);
          if (rest.onClick) rest.onClick(e);
        }}
        onKeyUp={(e) => {
          handlePointerOrCaret(e);
          if (rest.onKeyUp) rest.onKeyUp(e);
        }}
        onKeyDown={onKeyDown}
        onContextMenu={handleContextMenu}
        onFocus={(e) => {
          setIsFocused(true);
          if (rest.onFocus) rest.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (rest.onBlur) rest.onBlur(e);
        }}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragOver={onDragOver}
        placeholder={placeholder}
        rows={rows}
        spellCheck={true}
        className={className}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          caretColor: 'var(--text-primary)',
          fontFamily: style.fontFamily || 'var(--font-sans)',
          fontSize: style.fontSize || 'var(--text-xs)',
          lineHeight: style.lineHeight || 1.5,
          padding: '7px 11px',
          boxSizing: 'border-box',
          resize: 'vertical',
          ...style,
        }}
        {...rest}
      />

      {/* Word-Style Floating Tooltip */}
      {activeError && (
        <SpellCheckTooltip
          error={activeError}
          position={popoverPos}
          onApplySuggestion={handleApplySuggestion}
          onIgnore={handleIgnore}
          onAddToDictionary={handleAddToDict}
          onClose={() => setActiveError(null)}
        />
      )}
    </div>
  );
};

/**
 * Word-Style SpellCheckInput:
 * Underlines misspelled words directly on the word in single-line inputs.
 */
export const SpellCheckInput = ({
  type = 'text',
  value = '',
  onChange,
  placeholder,
  style = {},
  className = '',
  required = false,
  autoFocus = false,
  ...rest
}) => {
  const [activeError, setActiveError] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const underlayRef = useRef(null);
  const instanceId = useMemo(() => 'spell-in-' + Math.random().toString(36).substring(2, 8), []);

  const errors = useMemo(() => {
    return analyzeTextSpelling(value);
  }, [value, refreshKey]);

  const handleScroll = () => {
    if (inputRef.current && underlayRef.current) {
      underlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  const checkCaretForError = (offset) => {
    if (typeof offset !== 'number') return null;
    return errors.find((err) => offset >= err.start && offset <= err.end) || null;
  };

  const showSuggestionsForError = (err) => {
    if (!err) {
      setActiveError(null);
      return;
    }

    const markEl = document.getElementById(`${instanceId}-${err.start}`);
    if (markEl) {
      const rect = markEl.getBoundingClientRect();
      const top = Math.min(window.innerHeight - 150, rect.bottom + 4);
      const left = Math.min(window.innerWidth - 240, Math.max(10, rect.left));
      setPopoverPos({ top, left });
      setActiveError(err);
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 4, left: rect.left });
      setActiveError(err);
    }
  };

  const handlePointerOrCaret = () => {
    if (!inputRef.current) return;
    const caret = inputRef.current.selectionStart;
    const err = checkCaretForError(caret);
    if (err) {
      showSuggestionsForError(err);
    } else {
      setActiveError(null);
    }
  };

  const handleContextMenu = (e) => {
    if (!inputRef.current) return;
    const caret = inputRef.current.selectionStart;
    const err = checkCaretForError(caret);
    if (err) {
      e.preventDefault();
      showSuggestionsForError(err);
    }
  };

  const handleApplySuggestion = (err, replacement) => {
    if (!onChange) return;
    const before = value.slice(0, err.start);
    const after = value.slice(err.end);
    const nextValue = before + replacement + after;
    onChange({ target: { value: nextValue } });
    setActiveError(null);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextCaret = err.start + replacement.length;
        inputRef.current.setSelectionRange(nextCaret, nextCaret);
      }
    }, 50);
  };

  const handleIgnore = (word) => {
    ignoreWordForSession(word);
    setActiveError(null);
    setRefreshKey((k) => k + 1);
  };

  const handleAddToDict = (word) => {
    addToUserDictionary(word);
    setActiveError(null);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (activeError && containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveError(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveError(null);
    };

    window.addEventListener('mousedown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeError]);

  const underlayContent = useMemo(() => {
    return buildUnderlaySegments(value, errors, instanceId);
  }, [value, errors, instanceId]);

  return (
    <div
      ref={containerRef}
      className="spellcheck-field-container"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'var(--bg-input)',
        border: `1px solid ${isFocused ? 'var(--border-active)' : 'var(--border-default)'}`,
        borderRadius: 'var(--radius-sm)',
        transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
        overflow: 'hidden',
      }}
    >
      {/* Synchronized Underlay: renders red wavy underline directly on word */}
      <div
        ref={underlayRef}
        aria-hidden="true"
        className="spellcheck-underlay"
        style={{
          fontFamily: style.fontFamily || 'var(--font-sans)',
          fontSize: style.fontSize || 'var(--text-xs)',
          lineHeight: style.lineHeight || 1.5,
          padding: '7px 11px',
          whiteSpace: 'pre',
          overflow: 'hidden',
        }}
      >
        {underlayContent}
      </div>

      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        onClick={handlePointerOrCaret}
        onKeyUp={handlePointerOrCaret}
        onContextMenu={handleContextMenu}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        spellCheck={true}
        className={className}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          caretColor: 'var(--text-primary)',
          fontFamily: style.fontFamily || 'var(--font-sans)',
          fontSize: style.fontSize || 'var(--text-xs)',
          padding: '7px 11px',
          boxSizing: 'border-box',
          ...style,
        }}
        {...rest}
      />

      {/* Floating Word-Style Tooltip */}
      {activeError && (
        <SpellCheckTooltip
          error={activeError}
          position={popoverPos}
          onApplySuggestion={handleApplySuggestion}
          onIgnore={handleIgnore}
          onAddToDictionary={handleAddToDict}
          onClose={() => setActiveError(null)}
        />
      )}
    </div>
  );
};
