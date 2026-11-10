import React, { useRef, useState, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import {
  PenTool,
  Eraser,
  RotateCcw,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { saveSketchIllustration, getSketchIllustration, deleteSketchIllustration } from './sketchStorage';

const PALETTE = [
  { name: 'Primary Blue', color: '#0084ff' },
  { name: 'Cyan Glow', color: '#06b6d4' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'White', color: '#ffffff' },
  { name: 'Dark Slate', color: '#1e293b' },
];

export const SketchboardCanvas = ({
  entityId,
  initialDataUrl = '',
  initialSketch = '',
  onSave,
  onClear,
  title = 'Illustration & Whiteboard',
  defaultOpen = true,
}) => {
  const effectiveInitial = initialDataUrl || initialSketch || '';
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  const [currentTool, setCurrentTool] = useState('pen'); // 'pen' | 'eraser'
  const [currentColor, setCurrentColor] = useState('#0084ff');
  const [lineWidth, setLineWidth] = useState(3);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [savedPreview, setSavedPreview] = useState(effectiveInitial || getSketchIllustration(entityId));
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSaved, setIsSaved] = useState(false);

  // Initialize SignaturePad instance with high-performance responsive canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high-performance SignaturePad
    const pad = new SignaturePad(canvas, {
      minWidth: Math.max(1, lineWidth * 0.7),
      maxWidth: Math.max(2, lineWidth * 1.5),
      penColor: currentColor,
      backgroundColor: 'rgba(0, 0, 0, 0)',
    });
    padRef.current = pad;

    pad.addEventListener('endStroke', () => {
      setHasStrokes(true);
    });

    // Resize canvas respecting devicePixelRatio
    const resizeCanvas = () => {
      if (!canvas || !pad) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = pad.toData();

      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);

      pad.clear();
      if (data && data.length > 0) {
        pad.fromData(data);
        setHasStrokes(true);
      } else {
        const activeData = effectiveInitial || savedPreview;
        if (activeData) {
          pad.fromDataURL(activeData);
          setHasStrokes(true);
        }
      }
    };

    // Observe size changes
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(canvas);

    // Initial resize
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
      pad.off();
    };
  }, [isOpen]);

  // Update tool and colors dynamically on pad
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;

    if (currentTool === 'eraser') {
      pad.compositeOperation = 'destination-out';
      pad.minWidth = lineWidth * 2.5;
      pad.maxWidth = lineWidth * 4;
    } else {
      pad.compositeOperation = 'source-over';
      pad.penColor = currentColor;
      pad.minWidth = Math.max(1, lineWidth * 0.7);
      pad.maxWidth = Math.max(2, lineWidth * 1.5);
    }
  }, [currentTool, currentColor, lineWidth]);

  const handleUndo = () => {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    if (data && data.length > 0) {
      data.pop();
      pad.fromData(data);
      setHasStrokes(data.length > 0);
    }
  };

  const handleClear = () => {
    const pad = padRef.current;
    if (pad) {
      pad.clear();
      setHasStrokes(false);
    }
  };

  const handleSaveIllustration = () => {
    const pad = padRef.current;
    if (!pad) return;

    if (pad.isEmpty()) {
      handleDeleteSaved();
      return;
    }

    const dataUrl = pad.toDataURL('image/png');
    setSavedPreview(dataUrl);

    if (entityId) {
      saveSketchIllustration(entityId, dataUrl);
    }

    if (onSave) {
      onSave(dataUrl);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDeleteSaved = () => {
    if (entityId) {
      deleteSketchIllustration(entityId);
    }
    setSavedPreview(null);
    setHasStrokes(false);
    if (onSave) {
      onSave('');
    }
    if (onClear) {
      onClear();
    }
    handleClear();
  };

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface)',
        overflow: 'hidden',
        marginTop: 'var(--space-2)',
      }}
    >
      {/* Header Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-3)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: isOpen ? '1px solid var(--border-subtle)' : 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <PenTool size={15} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)' }}>
            {title}
          </span>
          {savedPreview && (
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--status-done-bg)',
                color: 'var(--status-done-text)',
                fontSize: '10px',
              }}
            >
              Sketch Saved
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* Canvas Area */}
      {isOpen && (
        <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)' }}>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Tool Selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <button
                type="button"
                onClick={() => setCurrentTool('pen')}
                className="btn-icon"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: currentTool === 'pen' ? 'var(--color-primary)' : 'var(--bg-surface-active)',
                  color: currentTool === 'pen' ? '#ffffff' : 'var(--text-secondary)',
                }}
                title="Pen Tool"
              >
                <PenTool size={14} color={currentTool === 'pen' ? '#ffffff' : undefined} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTool('eraser')}
                className="btn-icon"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: currentTool === 'eraser' ? 'var(--color-primary)' : 'var(--bg-surface-active)',
                  color: currentTool === 'eraser' ? '#ffffff' : 'var(--text-secondary)',
                }}
                title="Eraser Tool"
              >
                <Eraser size={14} color={currentTool === 'eraser' ? '#ffffff' : undefined} />
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasStrokes}
                className="btn-icon"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: 'var(--bg-surface-active)',
                  color: 'var(--text-secondary)',
                  opacity: hasStrokes ? 1 : 0.4,
                }}
                title="Undo Stroke"
              >
                <RotateCcw size={14} />
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="btn-icon"
                style={{
                  width: 28,
                  height: 28,
                  backgroundColor: 'var(--bg-surface-active)',
                  color: 'var(--text-secondary)',
                }}
                title="Clear Board"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Colors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {PALETTE.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setCurrentColor(p.color);
                    setCurrentTool('pen');
                  }}
                  style={{
                    width: 20,
                    height: 20,
                    minWidth: 20,
                    minHeight: 20,
                    borderRadius: '50%',
                    aspectRatio: '1 / 1',
                    backgroundColor: p.color,
                    border: currentColor === p.color && currentTool === 'pen' ? '2px solid #ffffff' : '1px solid var(--border-default)',
                    boxShadow: currentColor === p.color && currentTool === 'pen' ? '0 0 6px ' + p.color : 'none',
                    padding: 0,
                    cursor: 'pointer',
                  }}
                  title={p.name}
                />
              ))}
            </div>

            {/* Stroke Width */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[2, 4, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setLineWidth(size)}
                  className="btn-icon"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: lineWidth === size ? 'var(--color-primary)' : 'var(--bg-surface-active)',
                    color: lineWidth === size ? '#ffffff' : 'var(--text-secondary)',
                    padding: 0,
                  }}
                  title={`${size}px Width`}
                >
                  <span
                    style={{
                      width: size * 1.5,
                      height: size * 1.5,
                      borderRadius: '50%',
                      backgroundColor: lineWidth === size ? '#ffffff' : 'currentColor',
                      display: 'inline-block',
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
              {savedPreview && (
                <button
                  type="button"
                  onClick={handleDeleteSaved}
                  className="btn-icon btn-icon-danger"
                  style={{ width: 28, height: 28, backgroundColor: 'var(--color-danger)', color: '#ffffff' }}
                  title="Remove Saved Sketch"
                >
                  <Trash2 size={13} color="#ffffff" />
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveIllustration}
                className="btn-primary"
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  gap: '5px',
                  backgroundColor: isSaved ? 'var(--status-done-solid)' : 'var(--color-primary)',
                  color: '#ffffff',
                }}
                title="Save sketch with task/project"
              >
                <Check size={12} color="#ffffff" />
                <span>{isSaved ? 'Saved!' : 'Save Sketch'}</span>
              </button>
            </div>
          </div>

          {/* High-Performance Drawing Canvas powered by SignaturePad */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '200px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: currentTool === 'eraser' ? 'crosshair' : 'crosshair',
                touchAction: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
