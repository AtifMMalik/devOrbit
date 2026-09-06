import React, { useState, useEffect } from 'react';
import { Folder, Palette, Tag, Layers, Check, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

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
  const { toastSuccess, toastError } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(initialParentId);
  const [color, setColor] = useState('#6366f1');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || '');
      setDescription(editingProject.description || '');
      setParentId(editingProject.parentId || null);
      setColor(editingProject.color || '#6366f1');
      setTags(editingProject.tags || []);
    } else {
      setName('');
      setDescription('');
      setParentId(initialParentId);
      setColor(COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)]);
      setTags([]);
    }
  }, [editingProject, initialParentId, isOpen]);

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
        parentId: parentId === 'root' || !parentId ? null : parentId,
        color,
        tags,
      });
      toastSuccess(`Updated "${name}" successfully`);
    } else {
      const newProj = createProject({
        name,
        description,
        parentId: parentId === 'root' || !parentId ? null : parentId,
        color,
        tags,
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
          ? 'Update project details and settings'
          : initialParentId
          ? 'Add a nested sub-project to organize tasks'
          : 'Create a top-level workspace project'
      }
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
          <input
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

        {/* Description */}
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
            Description
          </label>
          <textarea
            rows={3}
            placeholder="What is the goal and scope of this project?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Color Palette Picker */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Accent Color Tone
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
                  border: color === preset ? '2px solid #ffffff' : '2px solid transparent',
                  boxShadow: color === preset ? '0 0 10px ' + preset : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast)',
                }}
              >
                {color === preset && <Check size={16} color="#ffffff" />}
              </button>
            ))}
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
              Delete Project
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
            toastSuccess(`Deleted project "${editingProject.name}"`);
            setIsDeleteConfirmOpen(false);
            onClose();
          }
        }}
        title="Delete Project"
        message={`Are you sure you want to delete "${editingProject?.name || 'this project'}" and all associated tasks?`}
        confirmText="Delete Project"
      />
    </Modal>
  );
};
