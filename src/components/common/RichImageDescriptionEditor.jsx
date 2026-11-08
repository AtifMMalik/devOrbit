import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { SpellCheckTextarea } from './SpellCheckField';
import { MarkdownRenderer } from './MarkdownRenderer';
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
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value));
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [failedImages, setFailedImages] = useState({});

  const fileInputRef = useRef(null);
  const lastSerializedRef = useRef(value);

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
                    rows={idx === 0 && blocks.length === 1 ? rows : Math.max(3, rows - 2)}
                    placeholder={idx === 0 ? placeholder : 'Continue writing description...'}
                    value={block.content}
                    onChange={(e) => handleTextBlockChange(block.id, e.target.value)}
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
          />
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
