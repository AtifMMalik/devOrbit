import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ImagePlus,
  Trash2,
  Maximize2,
  X,
  FileText,
  Eye,
  Edit3,
  Copy,
  Check,
  ZoomIn,
  Link,
  ExternalLink,
  AlertCircle,
  CheckSquare,
  AtSign,
  Folder,
} from 'lucide-react';
import { SpellCheckTextarea } from './SpellCheckField';
import { MarkdownRenderer, toggleChecklistInMarkdown } from './MarkdownRenderer';
import { getCaretCoordinates } from '../../utils/caretCoordinates';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  processDescriptionImage,
  parseMarkdownToBlocks,
  serializeBlocks,
  mergeAdjacentTextBlocks,
  isImageUrl,
  extractImageNameFromUrl,
  RAW_IMAGE_URL_REGEX,
} from '../../utils/imageUtils';
import { useToast } from '../../context/ToastContext';

export { parseMarkdownToBlocks, serializeBlocks };

/**
 * Rich Image Description Editor
 * - Shows embedded images (data URLs and web image URLs) as real, normal visual images in edit mode.
 * - Auto-detects image URLs (e.g. "https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png")
 *   and renders visual image cards automatically without showing raw URLs.
 * - Full spell checking on all text with Word / Google Docs-style squiggly lines & suggestions.
 * - Supports drag & drop, clipboard image paste (Cmd+V), direct file picker, and "Add from URL".
 * - Serializes to/from standard Markdown with 100% data compatibility.
 */
export const RichImageDescriptionEditor = ({
  value = '',
  onChange,
  placeholder = 'Write detailed description, approach, acceptance criteria... (paste or drag & drop images or image URLs)',
  rows = 6,
  style = {},
  highlight = '',
  mode = 'edit', // 'edit' | 'preview'
  onModeChange,
  onCopy,
  isCopied = false,
  showToolbar = true,
  disabled = false,
}) => {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const workspace = useWorkspace ? useWorkspace() : {};
  const projects = workspace?.projects || [];
  const tasks = workspace?.tasks || [];
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value));
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [inlineMention, setInlineMention] = useState(null);
  const textareaRefs = useRef({});
  const mentionMenuRef = useRef(null);

  const fileInputRef = useRef(null);
  const lastSerializedRef = useRef(value);

  const handleTogglePreviewCheckbox = (targetIdx) => {
    const updated = toggleChecklistInMarkdown(value, targetIdx);
    lastSerializedRef.current = updated;
    setBlocks(parseMarkdownToBlocks(updated));
    if (onChange) onChange(updated);
  };

  const checkMentionTrigger = useCallback((blockId, textarea) => {
    if (!textarea) return;
    const caret = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : (textarea.value || '').length;
    const val = textarea.value || '';
    const beforeCaret = val.slice(0, caret);

    // Find the last occurrence of '#[' or '@[' before the caret
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
      // As long as there is no newline or closing bracket, we are inside the mention
      if (!textAfterTrigger.includes('\n') && !textAfterTrigger.includes(']')) {
        const query = textAfterTrigger.trim().toLowerCase();
        const coords = getCaretCoordinates(textarea, caret);

        setInlineMention((prev) => {
          const prevIndex =
            prev && prev.isOpen && prev.triggerIndex === triggerIndex && prev.query === query
              ? prev.selectedIndex
              : 0;
          return {
            isOpen: true,
            type: trigger === '#[' ? 'project' : 'task',
            query,
            blockId,
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
    const { blockId, triggerIndex, caretIndex, type } = inlineMention;
    const insertStr = type === 'project' ? `#[${item.name}] ` : `@[${item.title}] `;

    setBlocks((prev) => {
      const target = prev.find((b) => b.id === blockId);
      if (!target) return prev;
      const curContent = target.content || '';
      const before = curContent.slice(0, triggerIndex);
      const after = curContent.slice(caretIndex);
      const nextContent = before + insertStr + after;

      const next = prev.map((b) => (b.id === blockId ? { ...b, content: nextContent } : b));
      const serialized = serializeBlocks(next);
      lastSerializedRef.current = serialized;
      if (onChange) onChange(serialized);

      setTimeout(() => {
        const ta = textareaRefs.current[blockId];
        if (ta) {
          ta.focus();
          const newCaret = triggerIndex + insertStr.length;
          ta.setSelectionRange(newCaret, newCaret);
        }
      }, 30);

      return next;
    });

    setInlineMention(null);
    toastSuccess(`Mentioned ${type === 'project' ? item.name : item.title}`);
  };

  const handleTextBlockKeyDown = (e, blockId) => {
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
        const selected =
          inlineMentionItems[inlineMention.selectedIndex] || inlineMentionItems[0];
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
        !Object.values(textareaRefs.current).some((el) => el && el.contains(e.target))
      ) {
        setInlineMention(null);
      }
    };
    window.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => window.removeEventListener('pointerdown', handleGlobalPointerDown);
  }, []);

  const handleInsertChecklist = () => {
    setBlocks((prev) => {
      const targetId = activeBlockId || prev[prev.length - 1]?.id;
      const targetIdx = prev.findIndex((b) => b.id === targetId);
      const idx = targetIdx >= 0 ? targetIdx : prev.length - 1;

      const next = [...prev];
      if (next[idx] && next[idx].type === 'text') {
        const curContent = next[idx].content || '';
        const needsNewline = curContent.length > 0 && !curContent.endsWith('\n');
        next[idx] = {
          ...next[idx],
          content: `${curContent}${needsNewline ? '\n' : ''}[] `,
        };
      } else {
        next.push({
          id: 'b-' + Date.now(),
          type: 'text',
          content: '[] ',
        });
      }

      const serialized = serializeBlocks(next);
      lastSerializedRef.current = serialized;
      if (onChange) onChange(serialized);
      return next;
    });
    toastInfo('Added checklist item "[] "');
  };

  const handleInsertMention = (mentionStr) => {
    setBlocks((prev) => {
      const targetId = activeBlockId || prev[prev.length - 1]?.id;
      const targetIdx = prev.findIndex((b) => b.id === targetId);
      const idx = targetIdx >= 0 ? targetIdx : prev.length - 1;

      const next = [...prev];
      if (next[idx] && next[idx].type === 'text') {
        const curContent = next[idx].content || '';
        const space = curContent.length > 0 && !curContent.endsWith(' ') && !curContent.endsWith('\n') ? ' ' : '';
        next[idx] = {
          ...next[idx],
          content: `${curContent}${space}${mentionStr} `,
        };
      } else {
        next.push({
          id: 'b-' + Date.now(),
          type: 'text',
          content: `${mentionStr} `,
        });
      }

      const serialized = serializeBlocks(next);
      lastSerializedRef.current = serialized;
      if (onChange) onChange(serialized);
      return next;
    });
    setShowMentionMenu(false);
    setMentionSearch('');
    toastSuccess(`Mentioned ${mentionStr}`);
  };

  // Sync with external value changes (e.g. initial load, draft restore, task switch)
  useEffect(() => {
    if (value !== lastSerializedRef.current) {
      lastSerializedRef.current = value;
      setBlocks(parseMarkdownToBlocks(value));
    }
  }, [value]);

  // Update a text block's content
  const handleTextBlockChange = useCallback(
    (blockId, newContent) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === blockId ? { ...b, content: newContent } : b));
        const serialized = serializeBlocks(next);
        lastSerializedRef.current = serialized;
        if (onChange) onChange(serialized);
        return next;
      });
    },
    [onChange]
  );

  // Auto-detect image URLs when leaving a text block or on paste
  const handleTextBlockBlur = useCallback(
    (blockId) => {
      setActiveBlockId(null);
      setBlocks((prev) => {
        const blk = prev.find((b) => b.id === blockId);
        if (blk && blk.type === 'text' && blk.content) {
          RAW_IMAGE_URL_REGEX.lastIndex = 0;
          if (RAW_IMAGE_URL_REGEX.test(blk.content)) {
            // Re-parse current blocks through parser to convert detected image URLs into visual cards
            const currentSerialized = serializeBlocks(prev);
            const reloaded = parseMarkdownToBlocks(currentSerialized);
            const newSerialized = serializeBlocks(reloaded);
            lastSerializedRef.current = newSerialized;
            if (onChange) onChange(newSerialized);
            return reloaded;
          }
        }
        return prev;
      });
    },
    [onChange]
  );

  // Directly insert an image file into the description
  const handleInsertImageFile = useCallback(
    async (file, targetBlockId = null) => {
      if (!file) return;
      if (!file.type || !file.type.startsWith('image/')) {
        toastError('Please select a valid image file (PNG, JPG, SVG, WebP, GIF)');
        return;
      }

      try {
        setIsProcessingImg(true);
        const dataUrl = await processDescriptionImage(file);
        const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Issue Image';

        setBlocks((prev) => {
          const insertIdx = targetBlockId
            ? prev.findIndex((b) => b.id === targetBlockId)
            : prev.length - 1;

          const newImgBlock = {
            id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            type: 'image',
            alt: cleanName,
            url: dataUrl,
          };

          const newTailTextBlock = {
            id: 'b-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            type: 'text',
            content: '',
          };

          const next = [...prev];
          const at = insertIdx >= 0 ? insertIdx + 1 : next.length;
          next.splice(at, 0, newImgBlock, newTailTextBlock);

          const serialized = serializeBlocks(next);
          lastSerializedRef.current = serialized;
          if (onChange) onChange(serialized);
          return next;
        });

        toastSuccess(`Added image "${cleanName}"`);
      } catch (err) {
        toastError(err.message || 'Failed to process image');
      } finally {
        setIsProcessingImg(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onChange, toastSuccess, toastError]
  );

  // Directly insert an image from URL
  const handleInsertImageUrl = useCallback(
    (url, targetBlockId = null) => {
      if (!url) return;
      const cleanUrl = url.trim();
      if (!cleanUrl) return;

      const cleanName = extractImageNameFromUrl(cleanUrl);

      setBlocks((prev) => {
        const insertIdx = targetBlockId
          ? prev.findIndex((b) => b.id === targetBlockId)
          : prev.length - 1;

        const newImgBlock = {
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'image',
          alt: cleanName,
          url: cleanUrl,
        };

        const newTailTextBlock = {
          id: 'b-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          type: 'text',
          content: '',
        };

        const next = [...prev];
        const at = insertIdx >= 0 ? insertIdx + 1 : next.length;
        next.splice(at, 0, newImgBlock, newTailTextBlock);

        const serialized = serializeBlocks(next);
        lastSerializedRef.current = serialized;
        if (onChange) onChange(serialized);
        return next;
      });

      setShowUrlInput(false);
      setUrlInputValue('');
      toastSuccess(`Added image "${cleanName}" from URL`);
    },
    [onChange, toastSuccess]
  );

  // File input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInsertImageFile(file, activeBlockId);
    }
  };

  // Clipboard paste on text areas: auto-detects image files AND image URLs!
  const handlePaste = useCallback(
    (e, blockId) => {
      // 1. Check if an image binary file was copied to clipboard
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              handleInsertImageFile(file, blockId);
              return;
            }
          }
        }
      }

      // 2. Check if clipboard text is a standalone Image URL (e.g. https://.../image.png)
      const pastedText = e.clipboardData?.getData('text')?.trim();
      if (pastedText && isImageUrl(pastedText)) {
        e.preventDefault();
        handleInsertImageUrl(pastedText, blockId);
        return;
      }
    },
    [handleInsertImageFile, handleInsertImageUrl]
  );

  // Drag and drop image files
  const handleDrop = useCallback(
    (e, blockId) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type && file.type.startsWith('image/')) {
          handleInsertImageFile(file, blockId);
          return;
        }
      }

      // Dropped URL string
      const droppedText = e.dataTransfer?.getData('text')?.trim();
      if (droppedText && isImageUrl(droppedText)) {
        handleInsertImageUrl(droppedText, blockId);
      }
    },
    [handleInsertImageFile, handleInsertImageUrl]
  );

  // Remove an image block
  const handleRemoveImage = useCallback(
    (blockId) => {
      setBlocks((prev) => {
        const filtered = prev.filter((b) => b.id !== blockId);
        const merged = mergeAdjacentTextBlocks(filtered);
        const serialized = serializeBlocks(merged);
        lastSerializedRef.current = serialized;
        if (onChange) onChange(serialized);
        return merged;
      });
      toastSuccess('Image removed');
    },
    [onChange, toastSuccess]
  );

  // Update image caption / alt text
  const handleImageAltChange = useCallback(
    (blockId, newAlt) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === blockId ? { ...b, alt: newAlt } : b));
        const serialized = serializeBlocks(next);
        lastSerializedRef.current = serialized;
        if (onChange) onChange(serialized);
        return next;
      });
    },
    [onChange]
  );

  // Confirm URL submission
  const handleConfirmAddUrl = () => {
    if (!urlInputValue.trim()) {
      toastError('Please enter an image URL');
      return;
    }
    handleInsertImageUrl(urlInputValue.trim(), activeBlockId);
  };

  // Count attached images
  const imageCount = blocks.filter((b) => b.type === 'image').length;

  return (
    <div
      className="rich-image-description-editor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        width: '100%',
        ...style,
      }}
    >
      {/* Hidden image file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Toolbar / Header */}
      {showToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-default)',
            paddingBottom: 'var(--space-2)',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={15} style={{ color: 'var(--color-primary)' }} />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Description
            </span>
            {imageCount > 0 && (
              <span
                style={{
                  fontSize: '10.5px',
                  backgroundColor: 'rgba(0, 132, 255, 0.12)',
                  color: 'var(--color-primary)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {imageCount} {imageCount === 1 ? 'image' : 'images'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Upload Image File Button */}
            <button
              type="button"
              onClick={() => {
                setActiveBlockId(null);
                fileInputRef.current?.click();
              }}
              disabled={isProcessingImg || disabled}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all var(--transition-fast)',
              }}
              title="Upload image file from computer"
            >
              <ImagePlus size={12} style={{ color: 'var(--color-primary)' }} />
              <span>{isProcessingImg ? 'Processing...' : 'Upload Image'}</span>
            </button>

            {/* Add Image from URL Button */}
            <button
              type="button"
              onClick={() => {
                setShowUrlInput((prev) => !prev);
              }}
              disabled={disabled}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: showUrlInput ? 'var(--bg-surface-active)' : 'transparent',
                color: showUrlInput ? 'var(--color-primary)' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all var(--transition-fast)',
              }}
              title="Insert image from web URL (e.g. https://.../image.png)"
            >
              <Link size={12} style={{ color: 'var(--color-primary)' }} />
              <span>Image URL</span>
            </button>

            {/* Insert Checklist Item Button */}
            <button
              type="button"
              onClick={handleInsertChecklist}
              disabled={disabled}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all var(--transition-fast)',
              }}
              title="Add checklist item in description ([] for unchecked, [.] for checked)"
            >
              <CheckSquare size={12} style={{ color: 'var(--status-done-solid)' }} />
              <span>Checklist []</span>
            </button>

            {/* Mention Object Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowMentionMenu((prev) => !prev)}
                disabled={disabled}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: showMentionMenu ? 'var(--bg-surface-active)' : 'transparent',
                  color: showMentionMenu ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all var(--transition-fast)',
                }}
                title="Mention project or task using @ or #"
              >
                <AtSign size={12} style={{ color: '#818cf8' }} />
                <span>Mention</span>
              </button>

              {/* Mention Dropdown */}
              {showMentionMenu && (
                <div
                  className="glass-panel animate-pop"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    zIndex: 100,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '6px',
                    width: '240px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    placeholder="Search projects or tasks..."
                    value={mentionSearch}
                    onChange={(e) => setMentionSearch(e.target.value)}
                    autoFocus
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '2px 4px', fontWeight: 'bold' }}>
                    Projects
                  </div>
                  {projects
                    .filter((p) => !mentionSearch || p.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleInsertMention(`#[${p.name}]`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 6px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '11px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                        className="btn-ghost"
                      >
                        <Folder size={12} style={{ color: p.color || 'var(--color-primary)', flexShrink: 0 }} />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}

                  {tasks.length > 0 && (
                    <>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 4px 2px 4px', fontWeight: 'bold', borderTop: '1px solid var(--border-subtle)', marginTop: 2 }}>
                        Tasks
                      </div>
                      {tasks
                        .filter((t) => !mentionSearch || t.title.toLowerCase().includes(mentionSearch.toLowerCase()))
                        .slice(0, 5)
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleInsertMention(`@[${t.title}]`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 6px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '11px',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            className="btn-ghost"
                          >
                            <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span className="truncate">{t.title}</span>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Copy Description Button */}
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'transparent',
                  color: isCopied ? 'var(--color-success)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Copy entire description to clipboard"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Edit / Preview Toggle */}
            {onModeChange && (
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-xs)',
                  padding: 2,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => onModeChange('edit')}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: mode === 'edit' ? 'var(--bg-surface-active)' : 'transparent',
                    color: mode === 'edit' ? 'var(--color-primary)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: mode === 'edit' ? 'var(--font-weight-medium)' : 'normal',
                  }}
                >
                  <Edit3 size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('preview')}
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: mode === 'preview' ? 'var(--bg-surface-active)' : 'transparent',
                    color: mode === 'preview' ? 'var(--color-primary)' : 'var(--text-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: mode === 'preview' ? 'var(--font-weight-medium)' : 'normal',
                  }}
                >
                  <Eye size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  Preview
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Image URL Input Bar */}
      {showUrlInput && mode === 'edit' && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Link size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input
            type="url"
            placeholder="Paste image URL (e.g. https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png)..."
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmAddUrl();
              } else if (e.key === 'Escape') {
                setShowUrlInput(false);
              }
            }}
            style={{
              flex: 1,
              fontSize: '12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              padding: '5px 8px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleConfirmAddUrl}
            style={{
              fontSize: '11px',
              padding: '5px 12px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'var(--font-weight-medium)',
              flexShrink: 0,
            }}
          >
            Add Image
          </button>
          <button
            type="button"
            onClick={() => {
              setShowUrlInput(false);
              setUrlInputValue('');
            }}
            style={{
              fontSize: '11px',
              padding: '5px 8px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Content Area: Edit vs Preview */}
      {mode === 'edit' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          {blocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <div key={block.id} style={{ position: 'relative' }}>
                  <SpellCheckTextarea
                    inputRef={(el) => {
                      textareaRefs.current[block.id] = el;
                    }}
                    rows={idx === 0 && blocks.length === 1 ? rows : Math.max(3, rows - 2)}
                    placeholder={idx === 0 ? placeholder : 'Continue writing description...'}
                    value={block.content}
                    onChange={(e) => {
                      handleTextBlockChange(block.id, e.target.value);
                      checkMentionTrigger(block.id, e.target);
                    }}
                    onKeyUp={(e) => {
                      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
                      checkMentionTrigger(block.id, e.target);
                    }}
                    onClick={(e) => checkMentionTrigger(block.id, e.target)}
                    onKeyDown={(e) => handleTextBlockKeyDown(e, block.id)}
                    onBlur={() => handleTextBlockBlur(block.id)}
                    onPaste={(e) => handlePaste(e, block.id)}
                    onDrop={(e) => handleDrop(e, block.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onFocus={() => setActiveBlockId(block.id)}
                    disabled={disabled}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      lineHeight: 1.5,
                      width: '100%',
                    }}
                  />
                </div>
              );
            }

            // Normal Visual Image Card (Data URLs AND Web Image URLs)
            if (block.type === 'image') {
              const isWebUrl = /^https?:\/\//i.test(block.url);
              const isFailed = failedImages[block.id];

              return (
                <div
                  key={block.id}
                  className="description-visual-image-card"
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                >
                  {/* Image Card Header with Caption and Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: '180px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-primary)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Image #{idx}:
                      </span>
                      <input
                        type="text"
                        value={block.alt || ''}
                        onChange={(e) => handleImageAltChange(block.id, e.target.value)}
                        placeholder="Image caption / alt text..."
                        disabled={disabled}
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: '1px dashed var(--border-subtle)',
                          padding: '1px 4px',
                          outline: 'none',
                          flex: 1,
                        }}
                        title="Click to edit image caption"
                      />
                      {isWebUrl && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-xs)',
                            padding: '1px 5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                          title={block.url}
                        >
                          <Link size={9} /> Web URL
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isWebUrl && (
                        <a
                          href={block.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                          }}
                          title="Open original image URL in new tab"
                        >
                          <ExternalLink size={11} />
                          <span>Link</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setLightboxImg({ url: block.url, alt: block.alt })}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Zoom / View fullscreen"
                      >
                        <ZoomIn size={11} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(block.id)}
                        disabled={disabled}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'rgba(244, 63, 94, 0.1)',
                          color: '#f43f5e',
                          border: '1px solid rgba(244, 63, 94, 0.25)',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title="Delete image from description"
                      >
                        <Trash2 size={11} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Rendered Normal Visual Image */}
                  <div
                    onClick={() => setLightboxImg({ url: block.url, alt: block.alt })}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      cursor: 'zoom-in',
                      minHeight: '80px',
                      maxHeight: '340px',
                      padding: 6,
                    }}
                    title="Click to zoom image"
                  >
                    {!isFailed ? (
                      <img
                        src={block.url}
                        alt={block.alt || 'Attached image'}
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [block.id]: true }))
                        }
                        style={{
                          maxWidth: '100%',
                          maxHeight: '320px',
                          height: 'auto',
                          objectFit: 'contain',
                          borderRadius: 'var(--radius-xs)',
                          display: 'block',
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                        }}
                      >
                        <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                        <span>Unable to load preview from external URL.</span>
                        <a
                          href={block.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', wordBreak: 'break-all' }}
                        >
                          {block.url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      ) : (
        /* Preview Mode */
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-default)',
            minHeight: '140px',
          }}
        >
          <MarkdownRenderer
            content={value || '*No description written yet.*'}
            highlight={highlight}
            onToggleCheckbox={handleTogglePreviewCheckbox}
          />
        </div>
      )}

      {/* Floating Cursor Autocomplete Modal (like right-click modal) */}
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

      {/* Lightbox Modal for Fullscreen Image View */}
      {lightboxImg && (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                {lightboxImg.alt || 'Image Preview'}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="btn-icon"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: 12, overflow: 'auto', maxHeight: 'calc(92vh - 50px)' }}>
              <img
                src={lightboxImg.url}
                alt={lightboxImg.alt}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(85vh - 60px)',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-xs)',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
