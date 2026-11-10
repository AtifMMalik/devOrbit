import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  ImagePlus,
  ListPlus,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { BrandFooter } from '../components/common/BrandFooter';
import { GithubIcon } from '../components/common/Icons';
import { SpellCheckInput, SpellCheckTextarea } from '../components/common/SpellCheckField';
import { RichImageDescriptionEditor } from '../components/common/RichImageDescriptionEditor';
import { processProjectLogoFile, processDescriptionImage, getProjectInitials } from '../utils/imageUtils';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useExtensions } from '../extensions/ExtensionContext';
import { SketchboardCanvas } from '../extensions/sketchboard/SketchboardCanvas';
import { DomainResearchCard } from '../extensions/domain-research/DomainResearchCard';

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
  const { projects, createProject, updateProject, setActiveProjectId, getProject, addProjectTodo } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { isExtensionActive } = useExtensions();

  const editingProjectId = routeProjectId || location.state?.projectId || location.state?.project?.id;
  const existingProject = editingProjectId ? (getProject(editingProjectId) || projects.find((p) => p.id === editingProjectId)) : null;
  const isEditing = Boolean(existingProject);

  const initialParentId = location.state?.parentId || existingProject?.parentId || null;

  // Step state: 1 (Basic Details) or 2 (Idea & Advanced Deliverables - Optional)
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Details
  const [name, setName] = useState(existingProject?.name || '');
  const [description, setDescription] = useState(existingProject?.description || '');
  const [sketchUrl, setSketchUrl] = useState(existingProject?.sketch || '');
  const [parentId, setParentId] = useState(initialParentId);
  const [color, setColor] = useState(existingProject?.color || '#6366f1');
  const [logo, setLogo] = useState(existingProject?.logo || null);
  const [descTab, setDescTab] = useState('edit'); // 'edit' | 'preview'
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [isProcessingDescImg, setIsProcessingDescImg] = useState(false);

  // Step 2: Idea & Advanced Deliverables (Optional)
  const [ideaConcept, setIdeaConcept] = useState(existingProject?.ideaConcept || '');
  const [targetFeatures, setTargetFeatures] = useState([]);
  const [featureInput, setFeatureInput] = useState('');
  const [author, setAuthor] = useState(existingProject?.author || '');
  const [liveUrl, setLiveUrl] = useState(existingProject?.liveUrl || '');
  const [githubUrl, setGithubUrl] = useState(existingProject?.githubUrl || '');
  const [tags, setTags] = useState(existingProject?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const logoInputRef = useRef(null);
  const descImageInputRef = useRef(null);

  // Sync if editing project loads/changes
  useEffect(() => {
    if (existingProject) {
      setName(existingProject.name || '');
      setDescription(existingProject.description || '');
      setAuthor(existingProject.author || '');
      setLiveUrl(existingProject.liveUrl || '');
      setGithubUrl(existingProject.githubUrl || '');
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
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
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
      toastSuccess('Added image to description');
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

  // Direct paste of images from clipboard into description
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

  // Direct drag & drop of image files into description
  const handleDescriptionDrop = (e) => {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleInsertDescriptionImage(file);
      }
    }
  };

  // Step 2 Feature List Builder
  const handleAddFeature = () => {
    const text = featureInput.trim();
    if (!text) return;
    setTargetFeatures((prev) => [...prev, text]);
    setFeatureInput('');
  };

  const handleRemoveFeature = (index) => {
    setTargetFeatures((prev) => prev.filter((_, idx) => idx !== index));
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
      setCurrentStep(1);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      author: author.trim(),
      liveUrl: liveUrl.trim(),
      githubUrl: githubUrl.trim(),
      parentId: parentId === 'root' || !parentId ? null : parentId,
      color,
      logo,
      tags,
      sketch: sketchUrl,
    };

    if (isEditing && existingProject) {
      updateProject(existingProject.id, payload);
      toastSuccess(`Saved project "${name}" successfully`);
      navigate(`/project/${existingProject.id}/tasks`);
    } else {
      const newProj = createProject(payload);
      if (targetFeatures.length > 0 && addProjectTodo) {
        targetFeatures.forEach((feat) => {
          addProjectTodo(newProj.id, feat);
        });
      }
      setActiveProjectId(newProj.id);
      toastSuccess(`Created project "${name}" successfully`);
      navigate(`/project/${newProj.id}/tasks`);
    }
  }, [name, description, sketchUrl, author, liveUrl, githubUrl, parentId, color, logo, tags, targetFeatures, isEditing, existingProject, updateProject, createProject, addProjectTodo, setActiveProjectId, navigate, toastError, toastSuccess]);

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
        maxWidth: '960px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
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
                ? 'Update project deliverables, repository links, and visual accent.'
                : 'Step 1 captures essential identity; Step 2 captures optional project idea & roadmap details.'}
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

      {/* 2-Step Progress Indicator (Requirement 9) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: currentStep === 1 ? 'var(--bg-surface-active)' : 'transparent',
            color: currentStep === 1 ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: currentStep === 1 ? 'var(--font-weight-bold)' : 'normal',
            fontSize: 'var(--text-xs)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: currentStep === 1 ? 'var(--color-primary)' : 'var(--border-default)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            1
          </span>
          <span>Step 1: Basic Details (Required)</span>
        </button>

        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-default)' }} />

        <button
          type="button"
          onClick={() => {
            if (!name.trim()) {
              toastError('Please enter a project name first');
              return;
            }
            setCurrentStep(2);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: currentStep === 2 ? 'var(--bg-surface-active)' : 'transparent',
            color: currentStep === 2 ? 'var(--color-primary)' : 'var(--text-secondary)',
            fontWeight: currentStep === 2 ? 'var(--font-weight-bold)' : 'normal',
            fontSize: 'var(--text-xs)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              backgroundColor: currentStep === 2 ? 'var(--color-primary)' : 'var(--border-default)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            2
          </span>
          <span>Step 2: Idea & Deliverables (Optional)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* ========================================================================= */}
        {/* STEP 1: Basic Details (Required)                                         */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
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
                    <SpellCheckInput
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
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isProcessingLogo}
                    >
                      {isProcessingLogo ? 'Optimizing...' : logo ? 'Change Logo' : 'Upload Logo / Icon'}
                    </Button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
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
                  {projects
                    .filter((p) => p.id !== existingProject?.id)
                    .map((p) => (
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
                      width: 30,
                      height: 30,
                      minWidth: 30,
                      minHeight: 30,
                      maxWidth: 30,
                      maxHeight: 30,
                      padding: 0,
                      flexShrink: 0,
                      aspectRatio: '1 / 1',
                      borderRadius: '50%',
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
                    width: 30,
                    height: 30,
                    minWidth: 30,
                    minHeight: 30,
                    maxWidth: 30,
                    maxHeight: 30,
                    padding: 0,
                    flexShrink: 0,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
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

            {/* Section 3: Project Description & Direct Image Addition (Requirement 10 & Normal Image Display) */}
            <div
              className="card"
              style={{
                padding: 'var(--space-5)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <RichImageDescriptionEditor
                value={description}
                onChange={(newVal) => setDescription(newVal)}
                placeholder="What is the goal and technical scope of this project? (You can paste, drag & drop, or click 'Add Image' to embed screenshots and diagrams directly)..."
                rows={5}
                mode={descTab}
                onModeChange={setDescTab}
              />
            </div>

            {/* Domain Name Research Extension Card */}
            {isExtensionActive && isExtensionActive('domain-research') && (
              <DomainResearchCard
                projectTitle={name}
                projectDescription={description}
                onAddDomainToDescription={(domain) => {
                  setDescription((prev) => {
                    const trimmed = prev.trim();
                    const section = '\n\n### Candidate Domains:';
                    if (!trimmed.includes('### Candidate Domains:')) {
                      return trimmed ? `${trimmed}${section}\n- [ ] ${domain}` : `### Candidate Domains:\n- [ ] ${domain}`;
                    }
                    return `${trimmed}\n- [ ] ${domain}`;
                  });
                  toastSuccess(`Added ${domain} to project description`);
                }}
              />
            )}

            {/* Sketchboard Extension Card */}
            {isExtensionActive && isExtensionActive('sketchboard') && (
              <div
                className="card"
                style={{
                  padding: 'var(--space-4) var(--space-5)',
                  backgroundColor: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2-5)',
                }}
              >
                <SketchboardCanvas
                  entityId={existingProject?.id || 'new_project'}
                  initialDataUrl={sketchUrl}
                  onSave={(dataUrl) => {
                    setSketchUrl(dataUrl);
                    toastSuccess('Project illustration saved');
                  }}
                  onClear={() => setSketchUrl('')}
                  title="Project Sketchboard & Whiteboard Illustration"
                  defaultOpen={true}
                />
              </div>
            )}

            {/* Step 1 Bottom Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-6)',
              }}
            >
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={handleSubmit} title="Save project with basic details now">
                  Save & Finish Now
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => {
                    if (!name.trim()) {
                      toastError('Please enter a project name first');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                >
                  Next: Idea & Deliverables (Optional)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: Project Idea & Deliverables (Optional - Can be Skipped)           */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Step 2 Optional Banner */}
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'rgba(0, 132, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 132, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <strong>Step 2 is optional.</strong> Fill out project roadmap deliverables and attribution, or click <strong>Skip & Save Project</strong> below.
                </span>
              </div>
              <Button type="button" variant="primary" size="sm" onClick={handleSubmit}>
                Skip & Save Project
              </Button>
            </div>

            {/* Section 4: Target Features & Deliverables Checklist */}
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
                  Target Features & Scope Checklist (Initial To-Dos)
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  These will be added as initial To-Do tasks
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <SpellCheckInput
                  type="text"
                  placeholder="e.g. Set up OAuth2 Google authentication, configure Redis cache..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  style={{ flex: 1, fontSize: 'var(--text-xs)' }}
                />
                <Button type="button" variant="secondary" icon={ListPlus} onClick={handleAddFeature}>
                  Add Feature
                </Button>
              </div>

              {targetFeatures.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 4,
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {targetFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 'var(--text-xs)',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-muted)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={13} style={{ color }} />
                        <span style={{ color: 'var(--text-primary)' }}>{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="btn-icon"
                        style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Attribution & Repository Links */}
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <User size={13} />
                    Author
                  </label>
                  <SpellCheckInput
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



            {/* Section 7: Tags */}
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
              <SpellCheckInput
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

            {/* Step 2 Bottom Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-2)',
                paddingBottom: 'var(--space-6)',
              }}
            >
              <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                ← Back to Step 1
              </Button>

              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button type="button" variant="secondary" onClick={handleSubmit}>
                  Skip & Save Project
                </Button>
                <Button type="submit" variant="primary" icon={Save}>
                  Save Project
                </Button>
              </div>
            </div>
          </div>
        )}

        <BrandFooter />
      </form>
    </div>
  );
};
