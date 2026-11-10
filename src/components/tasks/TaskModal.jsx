import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckSquare, Square, Flame, Terminal, FileText, CheckCircle2, ImagePlus, Eye, Edit3 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { SpellCheckInput, SpellCheckTextarea } from '../common/SpellCheckField';
import { RichImageDescriptionEditor } from '../common/RichImageDescriptionEditor';
import { processDescriptionImage } from '../../utils/imageUtils';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { useExtensions } from '../../extensions/ExtensionContext';
import { SketchboardCanvas } from '../../extensions/sketchboard/SketchboardCanvas';
import { generateId } from '../../utils/idGenerator';

const DRAFT_STORAGE_KEY = 'devorbit_task_draft';
const QUICK_TAG_SUGGESTIONS = ['feature', 'bug', 'hotfix', 'documentation', 'refactor', 'testing', 'ui/ux', 'api'];

export const TaskModal = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultStatus = 'current',
  editingTask = null,
  initialIsHotfix = false,
}) => {
  const { projects, createTask, updateTask, deleteTask } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { isExtensionActive } = useExtensions();

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [isHotfix, setIsHotfix] = useState(false);
  const [tags, setTags] = useState(['feature']);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [sketchUrl, setSketchUrl] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [descTab, setDescTab] = useState('edit');
  const [isProcessingDescImg, setIsProcessingDescImg] = useState(false);
  const descImageInputRef = useRef(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingSubtask, setDeletingSubtask] = useState(null);

  // Initialize form or restore draft
  useEffect(() => {
    if (!isOpen) return;

    if (editingTask) {
      setProjectId(editingTask.projectId);
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setTaskPrompt(editingTask.taskPrompt || '');
      setStatus(editingTask.status || 'current');
      setPriority(editingTask.priority || 'medium');
      setDeadline(editingTask.deadline || editingTask.dueDate || '');
      setCompletionNote(editingTask.completionNote || '');
      setIsHotfix(Boolean(editingTask.isHotfix || (editingTask.tags && editingTask.tags.includes('hotfix'))));
      setTags(editingTask.tags || ['feature']);
      setSubtasks(editingTask.subtasks || []);
      setSketchUrl(editingTask.sketch || '');
      setHasDraft(false);
    } else {
      setSketchUrl('');
      // Check for saved draft in create mode
      let loadedFromDraft = false;
      try {
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft && (draft.title || draft.description || draft.taskPrompt)) {
            setProjectId(draft.projectId || defaultProjectId || (projects[0]?.id || ''));
            setTitle(draft.title || '');
            setDescription(draft.description || '');
            setTaskPrompt(draft.taskPrompt || '');
            setStatus(draft.status || defaultStatus || 'current');
            setPriority(draft.priority || 'medium');
            setDeadline(draft.deadline || '');
            setCompletionNote(draft.completionNote || '');
            setIsHotfix(Boolean(draft.isHotfix || initialIsHotfix));
            setTags(Array.isArray(draft.tags) ? draft.tags : ['feature']);
            setSubtasks(Array.isArray(draft.subtasks) ? draft.subtasks : []);
            setHasDraft(true);
            loadedFromDraft = true;
          }
        }
      } catch (e) {
        console.warn('Failed to load task draft:', e);
      }

      if (!loadedFromDraft) {
        setProjectId(defaultProjectId || (projects[0]?.id || ''));
        setTitle('');
        setDescription('');
        setTaskPrompt('');
        setStatus(defaultStatus || 'current');
        setPriority(initialIsHotfix ? 'urgent' : 'medium');
        setDeadline('');
        setCompletionNote('');
        setIsHotfix(initialIsHotfix);
        setTags(initialIsHotfix ? ['hotfix', 'bug'] : ['feature']);
        setSubtasks([]);
        setHasDraft(false);
      }
    }
  }, [editingTask, defaultProjectId, defaultStatus, isOpen, projects, initialIsHotfix]);

  // Persist draft to localStorage on any input change (when creating new task)
  useEffect(() => {
    if (!isOpen || editingTask) return;

    // Only save if there is some meaningful content
    if (title || description || taskPrompt || deadline || subtasks.length > 0) {
      try {
        const draftPayload = {
          projectId,
          title,
          description,
          taskPrompt,
          status,
          priority,
          deadline,
          completionNote,
          isHotfix,
          tags,
          subtasks,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      } catch (e) {
        // Ignore quota errors
      }
    }
  }, [isOpen, editingTask, projectId, title, description, taskPrompt, status, priority, deadline, completionNote, isHotfix, tags, subtasks]);

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_e) {
      // Ignore
    }
    setProjectId(defaultProjectId || (projects[0]?.id || ''));
    setTitle('');
    setDescription('');
    setTaskPrompt('');
    setStatus(defaultStatus || 'current');
    setPriority('medium');
    setDeadline('');
    setCompletionNote('');
    setIsHotfix(false);
    setTags(['feature']);
    setSubtasks([]);
    setHasDraft(false);
    toastInfo('Draft discarded');
  };

  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.replace('#', '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleHotfix = () => {
    const nextVal = !isHotfix;
    setIsHotfix(nextVal);
    if (nextVal) {
      if (!tags.includes('hotfix')) {
        setTags([...tags, 'hotfix']);
      }
      setPriority('urgent');
      if (status !== 'done') {
        setStatus('hotfix');
      }
    } else {
      setTags(tags.filter((t) => t !== 'hotfix'));
      if (status === 'hotfix') {
        setStatus('current');
      }
    }
  };

  const handleAddSubtask = (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: generateId('sub'), text: newSubtaskText.trim(), completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (subId) => {
    setSubtasks(
      subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleEditSubtask = (subId, newText) => {
    setSubtasks(
      subtasks.map((s) => (s.id === subId ? { ...s, text: newText } : s))
    );
  };

  const handlePromptRemoveSubtask = (sub) => {
    setDeletingSubtask(sub);
  };

  const handleConfirmRemoveSubtask = () => {
    if (deletingSubtask) {
      setSubtasks(subtasks.filter((s) => s.id !== deletingSubtask.id));
      setDeletingSubtask(null);
      toastSuccess('Subtask removed');
    }
  };

  // Directly insert image into issue description (Item 3)
  const handleInsertDescriptionImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file');
      return;
    }

    try {
      setIsProcessingDescImg(true);
      const dataUrl = await processDescriptionImage(file);
      const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Issue Image';
      const imageMarkdown = `\n\n![${cleanName}](${dataUrl})\n\n`;
      setDescription((prev) => (prev ? prev + imageMarkdown : imageMarkdown.trim()));
      toastSuccess('Added image to issue description');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError('Task title is required');
      return;
    }

    if (!projectId) {
      toastError('Please select a project');
      return;
    }

    const taskData = {
      projectId,
      title,
      description,
      taskPrompt,
      status,
      priority,
      dueDate: deadline,
      deadline,
      completionNote,
      isHotfix,
      sketch: sketchUrl,
      tags: isHotfix && !tags.includes('hotfix') ? [...tags, 'hotfix'] : tags,
      subtasks,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
      toastSuccess(`Updated task "${title}"`);
    } else {
      createTask(taskData);
      // Clear draft on successful creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (_err) {
        // Ignore
      }
      toastSuccess(`Created task "${title}"`);
    }

    onClose();
  };

  const handleConfirmDeleteTask = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      toastSuccess('Task moved to Recycle Bin');
      setIsDeleteConfirmOpen(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create New Task'}
      subtitle={editingTask ? 'Modify task specifications, prompt, subtasks, and deadline' : 'Add a task or issue to your workspace'}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Draft Notice Banner if restored */}
        {hasDraft && !editingTask && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 132, 255, 0.1)',
              border: '1px solid rgba(0, 132, 255, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              color: 'var(--text-primary)',
            }}
          >
            <span>Restored unsaved draft from your previous session.</span>
            <button
              type="button"
              onClick={handleDiscardDraft}
              style={{
                background: 'transparent',
                color: '#f43f5e',
                fontSize: '11px',
                cursor: 'pointer',
                border: 'none',
                textDecoration: 'underline',
              }}
            >
              Discard Draft
            </button>
          </div>
        )}

        {/* Project Selector & Hot Fix Button Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: '2px',
              }}
            >
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!editingTask}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parentId ? `↳ ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hot Fix Toggle Button */}
          <div style={{ marginTop: '14px' }}>
            <button
              type="button"
              onClick={handleToggleHotfix}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: isHotfix ? '1px solid #f43f5e' : '1px solid var(--border-default)',
                backgroundColor: isHotfix ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-surface)',
                color: isHotfix ? '#f43f5e' : 'var(--text-secondary)',
                fontWeight: isHotfix ? 'bold' : 'normal',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              title="Toggle as critical Hot Fix issue"
            >
              <Flame size={13} style={{ color: isHotfix ? '#f43f5e' : 'var(--text-muted)' }} />
              Hot Fix
            </button>
          </div>
        </div>

        {/* Task Title */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: '2px',
            }}
          >
            Task Title *
          </label>
          <SpellCheckInput
            type="text"
            required
            placeholder="e.g. Implement authentication middleware, fix responsive layout..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Status, Priority, & Deadline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2-5)' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: '2px',
              }}
            >
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                const newStat = e.target.value;
                setStatus(newStat);
                if (newStat === 'hotfix') {
                  setIsHotfix(true);
                  if (!tags.includes('hotfix')) setTags([...tags, 'hotfix']);
                } else if (newStat !== 'done' && isHotfix) {
                  setIsHotfix(false);
                  setTags(tags.filter((t) => t !== 'hotfix'));
                }
              }}
            >
              <option value="hotfix">🔥 Hot Fix</option>
              <option value="current">Ongoing tasks</option>
              <option value="later">Queued tasks</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: '2px',
              }}
            >
              Priority
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-secondary)',
                marginBottom: '2px',
              }}
            >
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        {/* Task Prompt (AI / Instruction Prompt) */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: '2px',
            }}
          >
            <Terminal size={12} style={{ color: 'var(--color-primary)' }} />
            Task Prompt (One-click copyable from task card)
          </label>
          <SpellCheckTextarea
            rows={2}
            placeholder="Write the exact prompt or specification for this task..."
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11.5px',
              backgroundColor: 'var(--bg-card-subtle)',
            }}
          />
        </div>

        {/* Description & Direct Image Addition (Item 3 & Normal Image Display) */}
        <div>
          <RichImageDescriptionEditor
            value={description}
            onChange={(newVal) => setDescription(newVal)}
            placeholder="Add context, specifications, or acceptance criteria (supports markdown & images via paste, drag & drop, or Add Image)..."
            rows={3}
            mode={descTab}
            onModeChange={setDescTab}
          />
        </div>

        {/* Sketchboard Extension: Whiteboard Illustration Canvas */}
        {isExtensionActive && isExtensionActive('sketchboard') && (
          <SketchboardCanvas
            entityId={editingTask?.id || 'new_task'}
            initialDataUrl={sketchUrl}
            onSave={(dataUrl) => setSketchUrl(dataUrl)}
            title="Task Whiteboard & Sketch"
          />
        )}

        {/* Completion Note: ONLY visible when editing a task AND task is being completed or closed */}
        {Boolean(editingTask) && status === 'done' && (
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 'var(--text-2xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--status-done-solid)',
                marginBottom: '2px',
              }}
            >
              <CheckCircle2 size={12} />
              Completion Note (Optional - filled when task is completed)
            </label>
            <SpellCheckTextarea
              rows={2}
              placeholder="Resolution notes, PR link, deployed commit, or sign-off remarks..."
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              style={{
                borderColor: !completionNote ? 'var(--status-done-border)' : 'var(--border-default)',
              }}
            />
          </div>
        )}

        {/* Tags */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-2xs)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: '2px',
            }}
          >
            Tags
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-1-5)' }}>
            <input
              type="text"
              placeholder="Type a tag and press Enter..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              spellCheck={true}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleAddTag(tagInput)}
            >
              Add
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                {tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--text-2xs)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: t === 'hotfix' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface-active)',
                      color: t === 'hotfix' ? '#f43f5e' : 'var(--text-primary)',
                      border: t === 'hotfix' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-muted)',
                      fontWeight: t === 'hotfix' ? 'bold' : 'normal',
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

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', alignItems: 'center', marginTop: 2 }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Suggestions:</span>
              {QUICK_TAG_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddTag(suggestion)}
                  style={{
                    fontSize: '10px',
                    color: tags.includes(suggestion) ? 'var(--color-primary)' : 'var(--text-muted)',
                    backgroundColor: tags.includes(suggestion) ? 'var(--color-primary-light)' : 'transparent',
                    border: '1px dashed var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '1px 5px',
                    cursor: 'pointer',
                  }}
                >
                  +{suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Created / Updated Timestamps if editing */}
        {editingTask && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              paddingTop: 'var(--space-2)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span>Created: {editingTask.createdAt ? new Date(editingTask.createdAt).toLocaleString() : 'N/A'}</span>
            <span>Last updated: {editingTask.updatedAt ? new Date(editingTask.updatedAt).toLocaleString() : 'N/A'}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--space-1)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          {editingTask ? (
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
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </form>

      {/* Task Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDeleteTask}
        title="Move Task to Recycle Bin"
        message={`Are you sure you want to delete "${editingTask?.title || 'this task'}"? It can be recovered from the Recycle Bin within 30 days.`}
        confirmText="Move to Recycle Bin"
        danger
      />

      {/* Subtask Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingSubtask}
        onClose={() => setDeletingSubtask(null)}
        onConfirm={handleConfirmRemoveSubtask}
        title="Delete Subtask"
        message={`Are you sure you want to remove the subtask "${deletingSubtask?.text || 'this subtask'}"?`}
        confirmText="Delete Subtask"
      />
    </Modal>
  );
};
