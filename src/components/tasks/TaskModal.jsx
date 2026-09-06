import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { generateId } from '../../utils/idGenerator';

const QUICK_TAG_SUGGESTIONS = ['feature', 'bug', 'documentation', 'refactor', 'testing', 'ui/ux', 'devops', 'api'];

export const TaskModal = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultStatus = 'current',
  editingTask = null,
}) => {
  const { projects, createTask, updateTask, deleteTask } = useWorkspace();
  const { toastSuccess, toastError } = useToast();

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState(['feature']);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (editingTask) {
      setProjectId(editingTask.projectId);
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setStatus(editingTask.status || 'current');
      setPriority(editingTask.priority || 'medium');
      setDueDate(editingTask.dueDate || '');
      setTags(editingTask.tags || ['feature']);
      setSubtasks(editingTask.subtasks || []);
    } else {
      setProjectId(defaultProjectId || (projects[0]?.id || ''));
      setTitle('');
      setDescription('');
      setStatus(defaultStatus || 'current');
      setPriority('medium');
      setDueDate('');
      setTags(['feature']);
      setSubtasks([]);
    }
  }, [editingTask, defaultProjectId, defaultStatus, isOpen, projects]);

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

  const handleRemoveSubtask = (subId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subId));
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

    if (editingTask) {
      updateTask(editingTask.id, {
        projectId,
        title,
        description,
        status,
        priority,
        dueDate,
        tags,
        subtasks,
      });
      toastSuccess(`Updated task "${title}"`);
    } else {
      createTask({
        projectId,
        title,
        description,
        status,
        priority,
        dueDate,
        tags,
        subtasks,
      });
      toastSuccess(`Created task "${title}"`);
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      toastSuccess('Task deleted');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Edit Task' : 'Create New Task'}
      subtitle={editingTask ? 'Modify task details, tags and subtasks' : 'Add a task or issue to your project'}
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Project Selection */}
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
            Target Project *
          </label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parentId ? `↳ ${p.name}` : p.name}
              </option>
            ))}
          </select>
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
          <input
            type="text"
            required
            placeholder="e.g. Implement authentication middleware, fix responsive layout..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Status & Priority & Due Date Row (Only Current, Later, Done) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2-5)' }}>
          {/* Status */}
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
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="current">Current</option>
              <option value="later">Later</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority */}
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

          {/* Due Date */}
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
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
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
            Description & Notes
          </label>
          <textarea
            rows={3}
            placeholder="Add context, acceptance criteria, or relevant technical details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

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

          {/* Active Tags & Suggestions */}
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

        {/* Checklist Subtasks */}
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
            Checklist / Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-1-5)' }}>
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '4px 8px',
                  backgroundColor: 'var(--bg-surface-active)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(sub.id)}
                  style={{
                    color: sub.completed ? 'var(--status-done-solid)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={sub.completed ? 'Mark incomplete' : 'Mark completed'}
                >
                  {sub.completed ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>
                <input
                  type="text"
                  value={sub.text}
                  onChange={(e) => handleEditSubtask(sub.id, e.target.value)}
                  placeholder="Subtask title..."
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-xs)',
                    color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: sub.completed ? 'line-through' : 'none',
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '2px 4px',
                    borderRadius: 'var(--radius-xs)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(sub.id)}
                  style={{
                    color: '#f43f5e',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 'var(--radius-xs)',
                    transition: 'background var(--transition-fast)',
                  }}
                  className="btn-icon-danger"
                  title="Remove subtask"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              placeholder="Add checklist item..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddSubtask}
            >
              Add
            </Button>
          </div>
        </div>

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
              onClick={handleDelete}
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.12)',
                color: '#f43f5e',
                borderColor: 'rgba(244, 63, 94, 0.3)',
              }}
            >
              Delete Task
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
    </Modal>
  );
};
