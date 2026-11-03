import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FolderPlus,
  Globe,
  User,
  FileText,
  Eye,
  Edit3,
  Check,
  Upload,
  X,
  Pipette,
  Save,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { GithubIcon } from '../components/common/Icons';
import { processProjectLogoFile, getProjectInitials } from '../utils/imageUtils';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';

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

export const CreateProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: routeProjectId } = useParams();
  const { projects, createProject, updateProject, setActiveProjectId, getProject } = useWorkspace();
  const { toastSuccess, toastError } = useToast();

  const editingProjectId = routeProjectId || location.state?.projectId || location.state?.project?.id;
  const existingProject = editingProjectId ? (getProject(editingProjectId) || projects.find((p) => p.id === editingProjectId)) : null;
  const isEditing = Boolean(existingProject);

  const initialParentId = location.state?.parentId || existingProject?.parentId || null;

  const [name, setName] = useState(existingProject?.name || '');
  const [description, setDescription] = useState(existingProject?.description || '');
  const [author, setAuthor] = useState(existingProject?.author || '');
  const [liveUrl, setLiveUrl] = useState(existingProject?.liveUrl || '');
  const [githubUrl, setGithubUrl] = useState(existingProject?.githubUrl || '');
  const [readme, setReadme] = useState(existingProject?.readme || '');
  const [parentId, setParentId] = useState(initialParentId);
  const [color, setColor] = useState(existingProject?.color || '#6366f1');
  const [logo, setLogo] = useState(existingProject?.logo || null);
  const [tags, setTags] = useState(existingProject?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [readmeTab, setReadmeTab] = useState('edit'); // 'edit' | 'preview'
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const fileInputRef = useRef(null);

  // Sync if editing project loads/changes
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || '');
      setDescription(existingProject.description || '');
      setAuthor(existingProject.author || '');
      setLiveUrl(existingProject.liveUrl || '');
      setGithubUrl(existingProject.githubUrl || '');
      setReadme(existingProject.readme || '');
      setParentId(existingProject.parentId || null);
      setColor(existingProject.color || '#6366f1');
      setLogo(existingProject.logo || null);
      setTags(existingProject.tags || []);
    }
  }, [existingProject]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    try {
      setIsProcessingLogo(true);
      const optimizedBase64 = await processProjectLogoFile(file);
      setLogo(optimizedBase64);
      toastSuccess('Logo uploaded & optimized');
    } catch (err) {
      toastError(err.message || 'Failed to process logo image');
    } finally {
      setIsProcessingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toastError('Project name is required');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      author: author.trim(),
      liveUrl: liveUrl.trim(),
      githubUrl: githubUrl.trim(),
      readme,
      parentId: parentId === 'root' || !parentId ? null : parentId,
      color,
      logo,
      tags,
    };

    if (isEditing && existingProject) {
      updateProject(existingProject.id, payload);
      toastSuccess(`Saved project "${name}" successfully`);
      navigate(`/project/${existingProject.id}/tasks`);
    } else {
      const newProj = createProject(payload);
      setActiveProjectId(newProj.id);
      toastSuccess(`Created project "${name}" successfully`);
      navigate(`/project/${newProj.id}/tasks`);
    }
  }, [name, description, author, liveUrl, githubUrl, readme, parentId, color, logo, tags, isEditing, existingProject, updateProject, createProject, setActiveProjectId, navigate, toastError, toastSuccess]);

  // Support global Cmd + S shortcut to save project
  useEffect(() => {
    const handleSaveShortcut = (e) => {
      e?.preventDefault?.();
      handleSubmit();
    };
    window.addEventListener('devorbit:save', handleSaveShortcut);
    return () => window.removeEventListener('devorbit:save', handleSaveShortcut);
  }, [handleSubmit]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        backgroundColor: 'var(--bg-app)',
        padding: 'var(--space-6) var(--space-8)',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Top Header / Back Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
              {isEditing ? `Edit Project: ${name || 'Project'}` : 'Create New Project'}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {isEditing
                ? 'Update project deliverables, repository links, README documentation, and visual accent.'
                : 'Set up a clean developer workspace for tracking deliverables, specs, and architecture.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" icon={Save} onClick={handleSubmit} title="Save Project (⌘S)">
            Save Project
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Section 1: Project Identity & Branding */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Project Identity & Branding
          </span>

          {/* Logo Upload + Project Name */}
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--text-lg)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px ' + color + '40',
                }}
              >
                {logo ? (
                  <img src={logo} alt="Project Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{getProjectInitials(name || 'NP')}</span>
                )}
              </div>

              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
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
                  title="Remove logo"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core API Gateway, Mobile App Client, Authentication Service..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  style={{ fontSize: 'var(--text-sm)' }}
                />
              </div>

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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Scope & Goals Description */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Project Description
            </label>
            <textarea
              rows={2}
              placeholder="What is the goal and technical scope of this project?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Parent Hierarchy Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Parent Project (Hierarchy)
            </label>
            <select
              value={parentId || 'root'}
              onChange={(e) => setParentId(e.target.value === 'root' ? null : e.target.value)}
            >
              <option value="root">None (Top-Level Parent Project)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parentId ? `↳ ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Accent Color Tone */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Accent Color Tone
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {color}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2-5)', flexWrap: 'wrap', alignItems: 'center' }}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
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
                {color.toLowerCase() === preset.toLowerCase() && <Check size={16} color="#ffffff" />}
              </button>
            ))}

            {/* Custom Color Swatch with Pipette */}
            <label
              style={{
                position: 'relative',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
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
              }}
              title="Pick a custom hex color"
            >
              <input
                type="color"
                value={color.startsWith('#') && color.length === 7 ? color : '#6366f1'}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  width: '60px',
                  height: '60px',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              {!COLOR_PRESETS.map((c) => c.toLowerCase()).includes(color.toLowerCase()) ? (
                <Check size={15} color="#ffffff" />
              ) : (
                <Pipette size={14} style={{ color: 'var(--text-secondary)', pointerEvents: 'none' }} />
              )}
            </label>

            {/* Direct Hex Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hex:</span>
              <input
                type="text"
                placeholder="#6366f1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  width: '84px',
                  height: '28px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Attribution & Repository Links */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Links & Attribution
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <User size={13} />
                Author
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Chen"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <Globe size={13} />
                Live Link (URL)
              </label>
              <input
                type="url"
                placeholder="https://myproject.app"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <GithubIcon size={13} />
                GitHub Link
              </label>
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Specifications & Architecture (README.md) */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                Project README (README.md Specifications)
              </span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setReadmeTab('edit')}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: readmeTab === 'edit' ? '1px solid var(--border-active)' : '1px solid transparent',
                  backgroundColor: readmeTab === 'edit' ? 'var(--bg-surface-active)' : 'transparent',
                  color: readmeTab === 'edit' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Edit3 size={11} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setReadmeTab('preview')}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: readmeTab === 'preview' ? '1px solid var(--border-active)' : '1px solid transparent',
                  backgroundColor: readmeTab === 'preview' ? 'var(--bg-surface-active)' : 'transparent',
                  color: readmeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Eye size={11} /> Preview
              </button>
            </div>
          </div>

          {readmeTab === 'edit' ? (
            <textarea
              rows={8}
              placeholder="# Project Specifications&#10;&#10;Document APIs, architecture decisions, setup steps, or roadmap..."
              value={readme}
              onChange={(e) => setReadme(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          ) : (
            <div
              style={{
                minHeight: '160px',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
              }}
            >
              <MarkdownRenderer content={readme || '*No specifications written yet.*'} />
            </div>
          )}
        </div>

        {/* Section 5: Tags */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>
            Tags (Press Enter or comma)
          </label>
          <input
            type="text"
            placeholder="e.g. backend, react, api, mobile..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
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
                    style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-8)' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save} title="Save Project (⌘S)">
            Save Project
          </Button>
        </div>
      </form>
    </div>
  );
};

