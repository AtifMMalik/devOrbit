import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  Rocket,
  Save,
  Trash2,
  Plus,
  ListPlus,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandFooter } from '../components/common/BrandFooter';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SpellCheckInput, SpellCheckTextarea } from '../components/common/SpellCheckField';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useExtensions } from '../extensions/ExtensionContext';
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
  '#3b82f6', // Blue
  '#e11d48', // Rose
];

export const CreateIdeaPage = () => {
  const navigate = useNavigate();
  const { ideaId } = useParams();
  const location = useLocation();
  const { ideas, createIdea, updateIdea, deleteIdea, convertIdeaToProject, setActiveProjectId } = useWorkspace();
  const { toastSuccess, toastInfo, toastError } = useToast();
  const { isExtensionActive } = useExtensions();

  const handleAddDomainToDescription = (domain) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      const section = '\n\n### Candidate Domains:';
      if (!trimmed.includes('### Candidate Domains:')) {
        return trimmed ? `${trimmed}${section}\n- [ ] ${domain}` : `### Candidate Domains:\n- [ ] ${domain}`;
      }
      return `${trimmed}\n- [ ] ${domain}`;
    });
    toastSuccess(`Added ${domain} to project idea about field`);
  };

  const existingIdea = ideaId ? (ideas || []).find((i) => i.id === ideaId) : location.state?.idea || null;
  const isEditing = Boolean(existingIdea);

  const [title, setTitle] = useState(existingIdea?.title || '');
  const [description, setDescription] = useState(existingIdea?.description || '');
  const [color, setColor] = useState(existingIdea?.color || '#6366f1');
  const [priority, setPriority] = useState(existingIdea?.priority || 'medium');
  const [status, setStatus] = useState(existingIdea?.status || 'draft');
  const [targetFeatures, setTargetFeatures] = useState(existingIdea?.targetFeatures || []);
  const [featureInput, setFeatureInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(existingIdea?.tags || []);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (existingIdea) {
      setTitle(existingIdea.title || '');
      setDescription(existingIdea.description || '');
      setColor(existingIdea.color || '#6366f1');
      setPriority(existingIdea.priority || 'medium');
      setStatus(existingIdea.status || 'draft');
      setTargetFeatures(existingIdea.targetFeatures || []);
      setTags(existingIdea.tags || []);
    }
  }, [existingIdea]);

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
      const val = tagInput.trim().replace(/^#/, '').toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toastError('Idea title is required');
      return;
    }

    let finalFeatures = [...targetFeatures];
    if (featureInput.trim()) {
      finalFeatures.push(featureInput.trim());
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      color,
      priority,
      status,
      targetFeatures: finalFeatures,
      tags,
    };

    if (isEditing && existingIdea) {
      updateIdea(existingIdea.id, payload);
      toastSuccess(`Updated idea "${title.trim()}"`);
    } else {
      createIdea(payload);
      toastSuccess(`Created project idea "${title.trim()}"`);
    }

    navigate('/ideas');
  };

  const handleConvertToProject = () => {
    if (!existingIdea) return;
    const newProject = convertIdeaToProject(existingIdea.id);
    if (newProject) {
      toastSuccess(`Converted "${existingIdea.title}" into project "${newProject.name}"!`);
      setActiveProjectId(newProject.id);
      navigate(`/project/${newProject.id}/tasks`);
    }
  };

  const handleDeleteIdea = () => {
    if (!existingIdea) return;
    deleteIdea(existingIdea.id);
    toastInfo(`Removed idea "${existingIdea.title}"`);
    navigate('/ideas');
  };

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
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => navigate('/ideas')}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            title="Back to Ideas Lab"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
              {isEditing ? `Edit Idea: ${existingIdea?.title || 'Idea'}` : 'Create New Project Idea'}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Flesh out concepts, target capabilities, and roadmap specs before converting to an active project.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {isEditing && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Rocket}
                onClick={handleConvertToProject}
                style={{ color: 'var(--color-primary)' }}
              >
                Convert to Project
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setIsDeleteConfirmOpen(true)}
                style={{ backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}
              >
                Delete
              </Button>
            </>
          )}

          <Button type="button" variant="secondary" onClick={() => navigate('/ideas')}>
            Cancel
          </Button>
          <Button type="button" variant="primary" icon={Save} onClick={handleSubmit}>
            {isEditing ? 'Save Changes' : 'Create Idea'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Card 1: Core Concept & Title */}
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
            Idea Concept & Identity
          </span>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Idea Title *
            </label>
            <SpellCheckInput
              type="text"
              required
              autoFocus
              placeholder="e.g. Distributed Task Orchestrator, CLI Dev Toolkit..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: 'var(--text-sm)', width: '100%' }}
            />
          </div>

          {/* Accent Color Tone */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 6 }}>
              Project Accent Color
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
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
                    backgroundColor: c,
                    border: color === c ? '2px solid #ffffff' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                    cursor: 'pointer',
                    transition: 'transform var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Problem Statement / Concept */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              What is this project about? (Problem statement, tech stack, architecture)
            </label>
            <SpellCheckTextarea
              rows={4}
              placeholder="Explain what problem this project solves, technical architecture, target users, or vision..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ fontSize: 'var(--text-xs)' }}
            />
          </div>
        </div>

        {/* Extension Card: Domain Name Research */}
        {isExtensionActive && isExtensionActive('domain-research') && (
          <DomainResearchCard
            projectTitle={title}
            projectDescription={description}
            onAddDomainToDescription={handleAddDomainToDescription}
          />
        )}

        {/* Card 2: What's in this project (Target Features & Scope Checklist) */}
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
              What's gonna be in this project? (Key Features & Scope Checklist)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Automatically converted into Project To-Dos
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <SpellCheckInput
              type="text"
              placeholder="Add planned feature or module (e.g. End-to-end WebSocket synchronization)..."
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
                marginTop: 6,
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
                    <CheckCircle2 size={13} style={{ color: color }} />
                    <span style={{ color: 'var(--text-primary)' }}>{feat}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="btn-icon"
                    style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
                    title="Remove item"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 3: Priority & Status */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: '100%', height: 36, fontSize: 'var(--text-xs)' }}
            >
              <option value="draft">Draft (Incubating)</option>
              <option value="exploring">Exploring (Researching Tech)</option>
              <option value="ready">Ready to Build</option>
              <option value="converted">Converted to Project</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ width: '100%', height: 36, fontSize: 'var(--text-xs)' }}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Card 4: Tags */}
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
            placeholder="e.g. backend, cli, cloud, ai..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            style={{ width: '100%', height: 34, fontSize: 'var(--text-xs)' }}
          />
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-surface-active)',
                    color: 'var(--text-primary)',
                  }}
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
          <Button variant="secondary" onClick={() => navigate('/ideas')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save}>
            {isEditing ? 'Save Changes' : 'Create Idea'}
          </Button>
        </div>

        <BrandFooter />
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteIdea}
        title="Delete Project Idea"
        message={`Are you sure you want to delete "${existingIdea?.title}"?`}
        confirmText="Delete Idea"
        danger
      />
    </div>
  );
};

