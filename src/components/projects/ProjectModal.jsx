import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2, Upload, X, Globe, User, FileText, Eye, Edit3, Pipette, ImagePlus } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { GithubIcon } from '../common/Icons';
import { SpellCheckInput, SpellCheckTextarea } from '../common/SpellCheckField';
import { RichImageDescriptionEditor } from '../common/RichImageDescriptionEditor';
import { processProjectLogoFile, processDescriptionImage } from '../../utils/imageUtils';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { useExtensions } from '../../extensions/ExtensionContext';
import { SketchboardCanvas } from '../../extensions/sketchboard/SketchboardCanvas';

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#3b82f6', // Blue
];

export const ProjectModal = ({
  isOpen,
  onClose,
  initialParentId = null,
  editingProject = null,
}) => {
  const { projects, createProject, updateProject, deleteProject, setActiveProjectId } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { isExtensionActive } = useExtensions();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [parentId, setParentId] = useState(initialParentId);
  const [color, setColor] = useState('#6366f1');
  const [logo, setLogo] = useState(null);
  const [sketchUrl, setSketchUrl] = useState('');
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [descTab, setDescTab] = useState('edit'); // 'edit' | 'preview'
  const [isProcessingDescImg, setIsProcessingDescImg] = useState(false);

  const fileInputRef = useRef(null);
  const descImageInputRef = useRef(null);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || '');
      setDescription(editingProject.description || '');
      setAuthor(editingProject.author || '');
      setLiveUrl(editingProject.liveUrl || '');
      setGithubUrl(editingProject.githubUrl || '');
      setParentId(editingProject.parentId || null);
      setColor(editingProject.color || '#6366f1');
      setLogo(editingProject.logo || null);
      setSketchUrl(editingProject.sketch || '');
      setTags(editingProject.tags || []);
    } else {
      setName('');
      setDescription('');
      setAuthor('');
      setLiveUrl('');
      setGithubUrl('');
      setParentId(initialParentId);
      setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
      setLogo(null);
      setSketchUrl('');
      setTags([]);
    }
  }, [editingProject, initialParentId, isOpen]);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingLogo(true);
      const optimizedLogo = await processProjectLogoFile(file, { maxSize: 160, quality: 0.85 });
      setLogo(optimizedLogo);
      toastSuccess('Project logo uploaded and optimized');
    } catch (err) {
      toastError(err.message || 'Failed to process image');
    } finally {
      setIsProcessingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    toastInfo('Project logo removed');
  };

  // Directly insert image into Project Description (Requirement 10)
  const handleInsertDescriptionImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file');
      return;
    }

    try {
      setIsProcessingDescImg(true);
      const dataUrl = await processDescriptionImage(file);
      const imageMarkdown = `\n\n![${file.name.replace(/\.[^/.]+$/, '') || 'Project Image'}](${dataUrl})\n\n`;
      setDescription((prev) => (prev ? prev + imageMarkdown : imageMarkdown.trim()));
      toastSuccess('Added image to project description');
    } catch (err) {
      toastError(err.message || 'Failed to add image');
    } finally {
      setIsProcessingDescImg(false);
      if (descImageInputRef.current) descImageInputRef.current.value = '';
    }
  };

  const handleDescImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleInsertDescriptionImage(file);
  };

  const handleDescriptionPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleInsertDescriptionImage(file);
          return;
        }
      }
    }
  };

  const handleDescriptionDrop = (e) => {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleInsertDescriptionImage(file);
      }
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.replace('#', '').trim().toLowerCase();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Project name is required');
      return;
    }

    if (editingProject) {
      updateProject(editingProject.id, {
        name,
        description,
        author,
        liveUrl,
        githubUrl,
        parentId: parentId === 'root' || !parentId ? null : parentId,
        color,
        logo,
        tags,
        sketch: sketchUrl,
      });
      toastSuccess(`Updated "${name}" successfully`);
    } else {
      const newProj = createProject({
        name,
        description,
        author,
        liveUrl,
        githubUrl,
        parentId: parentId === 'root' || !parentId ? null : parentId,
        color,
        logo,
        tags,
        sketch: sketchUrl,
      });
      setActiveProjectId(newProj.id);
      toastSuccess(`Created "${name}" successfully`);
    }

    onClose();
  };

  // Filter out self and circular sub-projects from parent options when editing
  const availableParents = projects.filter((p) => {
    if (!editingProject) return true;
    return p.id !== editingProject.id && p.parentId !== editingProject.id;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProject ? 'Edit Project' : initialParentId ? 'Create Sub-Project' : 'Create New Project'}
      subtitle={
        editingProject
          ? 'Update project details, logo, and settings'
          : initialParentId
          ? 'Add a nested sub-project to organize tasks'
          : 'Create a top-level workspace project'
      }
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Project Logo / Icon & Visual Preview Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface-active)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <ProjectAvatar
              project={{ name: name || 'Project', color, logo }}
              size={54}
              showGlow
              style={{
                borderRadius: 'var(--radius-md)',
              }}
            />
            {logo && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: '#f43f5e',
                  color: '#ffffff',
                  border: '1px solid var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Remove uploaded logo"
              >
                <X size={10} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingLogo}
              >
                {isProcessingLogo ? 'Optimizing...' : logo ? 'Change Logo' : 'Upload Logo / Icon'}
              </Button>

              {logo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              onChange={handleLogoFileChange}
              style={{ display: 'none' }}
            />

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Upload custom image (PNG, JPG, SVG, WebP). Used across navigation, header, & cards.
            </p>
          </div>
        </div>

        {/* Project Name */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Project Name *
          </label>
          <SpellCheckInput
            type="text"
            required
            placeholder="e.g. Mobile App Client, Core API Gateway..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Parent Project Selection */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Parent Project (Hierarchy)
          </label>
          <select
            value={parentId || 'root'}
            onChange={(e) => setParentId(e.target.value === 'root' ? null : e.target.value)}
          >
            <option value="root">None (Top-Level Parent Project)</option>
            {availableParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parentId ? `↳ ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description & Direct Image Addition (Requirement 10 & Normal Image Display) */}
        <div>
          <RichImageDescriptionEditor
            value={description}
            onChange={(newVal) => setDescription(newVal)}
            placeholder="What is the goal and scope of this project? (Supports images via Add Image, paste, or drag & drop)"
            rows={3}
            mode={descTab}
            onModeChange={setDescTab}
          />
        </div>

        {/* Whiteboard / Sketchboard Canvas (Sketchboard Extension) */}
        {isExtensionActive('sketchboard') && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Project Sketchboard / Illustration
            </label>
            <SketchboardCanvas
              initialDataUrl={sketchUrl}
              initialSketch={sketchUrl}
              onSave={(dataUrl) => setSketchUrl(dataUrl)}
              onClear={() => setSketchUrl('')}
              entityType="project"
              entityId={editingProject?.id || 'new'}
              defaultOpen={true}
            />
          </div>
        )}

        {/* Project Metadata: Author, Live Link, Github Link */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 'var(--space-3)' }}>
          {/* Author */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <User size={12} />
              Author
            </label>
            <input
              type="text"
              placeholder="e.g. Atif Malik, Engineering"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              spellCheck={true}
            />
          </div>

          {/* Project Live Link */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <Globe size={12} />
              Live Link (URL)
            </label>
            <input
              type="url"
              placeholder="https://myproject.app"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
            />
          </div>

          {/* GitHub Repository Link */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-1)',
              }}
            >
              <GithubIcon size={12} />
              GitHub Link
            </label>
            <input
              type="url"
              placeholder="https://github.com/..."
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        </div>



        {/* Color Palette & Custom Color Picker */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            <span>Accent Color Tone</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {color}
            </span>
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                style={{
                  width: 28,
                  height: 28,
                  minWidth: 28,
                  minHeight: 28,
                  maxWidth: 28,
                  maxHeight: 28,
                  padding: 0,
                  borderRadius: '50%',
                  aspectRatio: '1 / 1',
                  flexShrink: 0,
                  backgroundColor: preset,
                  border: color.toLowerCase() === preset.toLowerCase() ? '2px solid #ffffff' : '2px solid transparent',
                  boxShadow: color.toLowerCase() === preset.toLowerCase() ? '0 0 10px ' + preset : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast)',
                }}
                title={`Preset ${preset}`}
              >
                {color.toLowerCase() === preset.toLowerCase() && <Check size={14} color="#ffffff" />}
              </button>
            ))}

            {/* Custom Color Picker Swatch */}
            <label
              style={{
                position: 'relative',
                width: 28,
                height: 28,
                minWidth: 28,
                minHeight: 28,
                maxWidth: 28,
                maxHeight: 28,
                padding: 0,
                borderRadius: '50%',
                aspectRatio: '1 / 1',
                flexShrink: 0,
                backgroundColor: !COLOR_PRESETS.map((c) => c.toLowerCase()).includes(color.toLowerCase()) ? color : 'var(--bg-surface-active)',
                border: !COLOR_PRESETS.map((c) => c.toLowerCase()).includes(color.toLowerCase())
                  ? '2px solid #ffffff'
                  : '2px dashed var(--border-active)',
                boxShadow: !COLOR_PRESETS.map((c) => c.toLowerCase()).includes(color.toLowerCase()) ? '0 0 10px ' + color : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform var(--transition-fast)',
              }}
              title="Pick a custom color"
            >
              <input
                type="color"
                value={color.startsWith('#') && color.length === 7 ? color : '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  width: '50px',
                  height: '50px',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              {!COLOR_PRESETS.map((c) => c.toLowerCase()).includes(color.toLowerCase()) ? (
                <Check size={14} color="#ffffff" />
              ) : (
                <Pipette size={14} style={{ color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              )}
            </label>

            {/* Direct Hex Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hex:</span>
              <input
                type="text"
                placeholder="#6366f1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: '78px',
                  height: '26px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: 'var(--radius-xs)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Tags (Press Enter or comma)
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <input
              type="text"
              placeholder="e.g. react, microservices, mobile..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              spellCheck={true}
            />
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)' }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--text-xs)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-active)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-muted)',
                    }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: editingProject ? 'space-between' : 'flex-end',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-muted)',
          }}
        >
          {editingProject ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteConfirmOpen(true)}
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                color: '#f43f5e',
                borderColor: 'rgba(244, 63, 94, 0.3)',
              }}
            >
              Move to Recycle Bin
            </Button>
          ) : null}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Project Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          if (editingProject) {
            deleteProject(editingProject.id);
            toastSuccess(`Moved project "${editingProject.name}" to Recycle Bin`);
            setIsDeleteConfirmOpen(false);
            onClose();
          }
        }}
        title="Move Project to Recycle Bin"
        message={`Are you sure you want to move "${editingProject?.name || 'this project'}" to the Recycle Bin? It can be recovered within 30 days.`}
        confirmText="Move to Recycle Bin"
      />
    </Modal>
  );
};
