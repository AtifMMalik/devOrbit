import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Check,
  Flame,
  Terminal,
  FileText,
  CheckSquare,
  Square,
  Trash2,
  Save,
  Plus,
  Eye,
  Edit3,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ImagePlus,
} from 'lucide-react';
import { PriorityBadge, StatusBadge, TagBadge } from '../components/common/Badge';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { SpellCheckInput, SpellCheckTextarea } from '../components/common/SpellCheckField';
import { RichImageDescriptionEditor } from '../components/common/RichImageDescriptionEditor';
import { processDescriptionImage } from '../utils/imageUtils';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { generateId } from '../utils/idGenerator';
import { highlightText, cycleOnPageMatch } from '../utils/searchHighlight';

const QUICK_TAGS = ['feature', 'bug', 'hotfix', 'documentation', 'refactor', 'testing', 'ui/ux', 'api'];

export const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const {
    getProject,
    getTask,
    updateTask,
    deleteTask,
    triggerConfetti,
    searchKeyword,
    setSearchKeyword,
  } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const project = getProject(projectId);
  const task = getTask(taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [status, setStatus] = useState('current');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [completionNote, setCompletionNote] = useState('');
  const [isHotfix, setIsHotfix] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const [descMode, setDescMode] = useState('edit'); // 'edit' | 'preview'
  const [isCopied, setIsCopied] = useState(false);
  const [isDescCopied, setIsDescCopied] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isProcessingDescImg, setIsProcessingDescImg] = useState(false);
  const descImageInputRef = useRef(null);

  // Auto-switch to preview mode if description matches searchKeyword
  useEffect(() => {
    if (searchKeyword && description && description.toLowerCase().includes(searchKeyword.toLowerCase())) {
      setDescMode('preview');
    }
  }, [searchKeyword, description]);

  // Compute on-page matches and auto-scroll to the first match
  useEffect(() => {
    if (searchKeyword && searchKeyword.trim()) {
      const timer = setTimeout(() => {
        const matches = document.querySelectorAll('mark.search-highlight');
        setTotalMatches(matches.length);
        if (matches.length > 0) {
          setActiveMatchIndex(0);
          matches[0].classList.add('active-match');
          matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setTotalMatches(0);
      setActiveMatchIndex(0);
      document.querySelectorAll('mark.search-highlight.active-match').forEach((el) => {
        el.classList.remove('active-match');
      });
    }
  }, [searchKeyword, taskId, descMode]);

  const handleNextMatch = () => {
    const res = cycleOnPageMatch('next', activeMatchIndex);
    setActiveMatchIndex(res.currentIndex);
    setTotalMatches(res.total);
  };

  const handlePrevMatch = () => {
    const res = cycleOnPageMatch('prev', activeMatchIndex);
    setActiveMatchIndex(res.currentIndex);
    setTotalMatches(res.total);
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTaskPrompt(task.taskPrompt || '');
      setStatus(task.status || 'current');
      setPriority(task.priority || 'medium');
      setDeadline(task.deadline || task.dueDate || '');
      setCompletionNote(task.completionNote || '');
      setIsHotfix(Boolean(task.isHotfix || (task.tags && task.tags.includes('hotfix'))));
      setTags(task.tags || []);
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  if (!task) {
    return (
      <div className="page-container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2>Task not found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 4 }}>
          This task may have been deleted or moved.
        </p>
        <Button
          variant="primary"
          icon={ArrowLeft}
          onClick={() => navigate(projectId ? `/project/${projectId}/tasks` : '/')}
          style={{ marginTop: 'var(--space-4)' }}
        >
          Back to Tasks Board
        </Button>
      </div>
    );
  }

  const handleCopyPrompt = async () => {
    if (!taskPrompt) return;
    try {
      await navigator.clipboard.writeText(taskPrompt);
      setIsCopied(true);
      toastSuccess('Task prompt copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      // Fallback
    }
  };

  const handleCopyDescription = async () => {
    if (!description) return;
    try {
      await navigator.clipboard.writeText(description);
      setIsDescCopied(true);
      toastSuccess('Task description copied to clipboard');
      setTimeout(() => setIsDescCopied(false), 2000);
    } catch (e) {
      // Fallback
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

  const handleSave = () => {
    if (!title.trim()) {
      toastError('Task title cannot be empty');
      return;
    }

    const wasDone = task.status === 'done';
    const isNowDone = status === 'done';

    updateTask(task.id, {
      title: title.trim(),
      description,
      taskPrompt,
      status,
      priority,
      deadline,
      dueDate: deadline,
      completionNote,
      isHotfix,
      tags: isHotfix && !tags.includes('hotfix') ? [...tags, 'hotfix'] : tags,
      subtasks,
    });

    if (!wasDone && isNowDone) {
      triggerConfetti();
    }

    toastSuccess('Task saved successfully');
  };

  const handleDeleteTask = () => {
    deleteTask(task.id);
    toastSuccess('Task moved to Recycle Bin');
    navigate(`/project/${projectId}/tasks`);
  };

  const handleToggleSubtask = (subId) => {
    setSubtasks(
      subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s))
    );
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

  const handleRemoveSubtask = (subId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subId));
  };

  const handleAddTag = (t) => {
    const clean = t.replace('#', '').trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter((item) => item !== t));
  };

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
      {/* Top Navigation & Action Header */}
      <div
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-6)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(`/project/${projectId}/tasks`)}
          >
            Back to Board
          </Button>

          <span style={{ color: 'var(--border-default)' }}>|</span>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Project: <Link to={`/project/${projectId}/tasks`} style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{project?.name || 'Project'}</Link>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setIsDeleteConfirmOpen(true)}
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              borderColor: 'rgba(244, 63, 94, 0.25)',
            }}
          >
            Move to Recycle Bin
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* In-Page Keyword Search & Navigation Toolbar (If search is active) */}
      {searchKeyword && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-8)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
              Page Search: <mark className="search-highlight" style={{ fontWeight: 'bold' }}>{searchKeyword}</mark>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {totalMatches > 0
                ? `${activeMatchIndex + 1} of ${totalMatches} match${totalMatches > 1 ? 'es' : ''} on this task`
                : 'No matches on this task'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {totalMatches > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                  title="Previous match (Shift+Enter in searchbar)"
                >
                  <ChevronUp size={12} />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                  title="Next match (Enter in searchbar)"
                >
                  <ChevronDown size={12} />
                  Next
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              title="Dismiss search highlight"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: 2-Column Responsive Layout */}
      <div
        className="page-container"
        style={{
          padding: 'var(--space-6) var(--space-8)',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Title, Prompt, Description, Subtasks, Completion Note */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 }}>
          {/* Title & Quick Status Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {isHotfix && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    backgroundColor: '#f43f5e',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  <Flame size={12} />
                  HOT FIX
                </span>
              )}
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
            </div>

            <SpellCheckInput
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title..."
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                border: 'none',
                background: 'transparent',
                padding: '4px 0',
                outline: 'none',
                width: '100%',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            />

            {/* Title Match Preview when search query active */}
            {searchKeyword && title.toLowerCase().includes(searchKeyword.toLowerCase()) && (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ color: 'var(--text-muted)' }}>Title Match:</span>
                <span style={{ fontWeight: 600 }}>{highlightText(title, searchKeyword)}</span>
              </div>
            )}
          </div>

          {/* Description & Rich Markdown Viewer / Editor (Requirement 5 & Normal Visual Image Display) */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <RichImageDescriptionEditor
              value={description}
              onChange={(newVal) => setDescription(newVal)}
              placeholder="Write rich task specifications, code examples, acceptance criteria using markdown (**bold**, `code`, - bullet lists, paste or drag & drop images)..."
              rows={8}
              mode={descMode}
              onModeChange={setDescMode}
              onCopy={handleCopyDescription}
              isCopied={isDescCopied}
              highlight={searchKeyword}
            />
          </div>

          {/* Task Prompt Box (One-click copyable specification prompt) */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4) var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2-5)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={15} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                  Task Prompt
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  disabled={true}
                  title="Generate prompt using AI (Coming soon when backend is connected)"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                >
                  Generate with AI
                </Button>

                {taskPrompt && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={isCopied ? Check : Copy}
                    onClick={handleCopyPrompt}
                    title="One-click copy task prompt"
                  >
                    {isCopied ? 'Copied!' : 'Copy Prompt'}
                  </Button>
                )}
              </div>
            </div>

            <SpellCheckTextarea
              rows={4}
              placeholder="Write the exact prompt, technical instructions, or AI specification for this task..."
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: 1.5,
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
              }}
            />

            {/* Prompt Match Preview when search query active */}
            {searchKeyword && taskPrompt && taskPrompt.toLowerCase().includes(searchKeyword.toLowerCase()) && (
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Prompt Match:</span>
                {highlightText(taskPrompt, searchKeyword)}
              </div>
            )}

            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
              This prompt can be copied in 1-click directly from the task card on the Kanban board.
            </p>
          </div>

          {/* Completion Note (Only visible when task is completed or has note) */}
          {(status === 'done' || Boolean(completionNote)) && (
            <div
              className="card"
              style={{
                padding: 'var(--space-4) var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2-5)',
                backgroundColor: 'var(--bg-surface)',
                border: status === 'done' ? '1px solid var(--status-done-border)' : '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} style={{ color: status === 'done' ? 'var(--status-done-solid)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                  Completion Note
                </span>
              </div>

              <SpellCheckTextarea
                rows={3}
                placeholder="Sign-off notes, PR links, deployment commit hash, or post-mortem notes..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
              />

              {/* Completion Note Match Preview when search query active */}
              {searchKeyword && completionNote && completionNote.toLowerCase().includes(searchKeyword.toLowerCase()) && (
                <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Completion Note Match:</span>
                  {highlightText(completionNote, searchKeyword)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Status, Priority, Deadline, Timestamps, Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Metadata Card */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Attributes
            </span>

            {/* Status Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val);
                  if (val === 'hotfix') {
                    setIsHotfix(true);
                  } else if (val !== 'done') {
                    setIsHotfix(false);
                  }
                }}
              >
                <option value="hotfix">Hot Fix</option>
                <option value="current">Current</option>
                <option value="later">Later</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                Priority
              </label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Hot Fix Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setIsHotfix(!isHotfix)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: isHotfix ? '1px solid #f43f5e' : '1px solid var(--border-default)',
                  backgroundColor: isHotfix ? 'rgba(244, 63, 94, 0.12)' : 'transparent',
                  color: isHotfix ? '#f43f5e' : 'var(--text-secondary)',
                  fontWeight: isHotfix ? 'bold' : 'normal',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                <Flame size={13} style={{ color: isHotfix ? '#f43f5e' : 'var(--text-muted)' }} />
                {isHotfix ? 'Marked as Hot Fix' : 'Mark as Hot Fix'}
              </button>
            </div>

            {/* Deadline */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Timestamps Card */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Timestamps
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Created:</span>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {new Date(task.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Last updated:</span>
              <strong style={{ color: 'var(--text-secondary)' }}>
                {new Date(task.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </strong>
            </div>
          </div>

          {/* Tags Management Card */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2-5)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tags
            </span>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
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
                    backgroundColor: t === 'hotfix' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface-active)',
                    color: t === 'hotfix' ? '#f43f5e' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
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

            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => handleAddTag(tagInput)}>
                Add
              </Button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
              {QUICK_TAGS.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => handleAddTag(qt)}
                  style={{
                    fontSize: '10px',
                    color: tags.includes(qt) ? 'var(--color-primary)' : 'var(--text-muted)',
                    background: 'transparent',
                    border: '1px dashed var(--border-default)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  +{qt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTask}
        title="Move Task to Recycle Bin"
        message={`Are you sure you want to move "${task.title}" to the Recycle Bin? You can recover it within 30 days.`}
        confirmText="Move to Recycle Bin"
        danger
      />
    </div>
  );
};

