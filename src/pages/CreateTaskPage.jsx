import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Terminal,
  Copy,
  Check,
  FileText,
  Eye,
  Edit3,
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  Save,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ImagePlus,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { BrandFooter } from '../components/common/BrandFooter';
import { SpellCheckInput, SpellCheckTextarea } from '../components/common/SpellCheckField';
import { RichImageDescriptionEditor } from '../components/common/RichImageDescriptionEditor';
import { processDescriptionImage } from '../utils/imageUtils';
import { generateId } from '../utils/idGenerator';
import { highlightText, cycleOnPageMatch } from '../utils/searchHighlight';
import { formatSingleTaskToMarkdown } from '../utils/issueExporter';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';

const DRAFT_STORAGE_KEY = 'devorbit_task_draft';
const QUICK_TAGS = ['feature', 'bug', 'hotfix', 'documentation', 'refactor', 'testing', 'ui/ux', 'api'];

export const CreateTaskPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId: routeProjectId, taskId: routeTaskId } = useParams();
  const {
    projects,
    createTask,
    updateTask,
    deleteTask,
    getTask,
    activeProjectId,
    triggerConfetti,
    searchKeyword,
    setSearchKeyword,
  } = useWorkspace();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const editingTaskId = routeTaskId || location.state?.taskId || location.state?.task?.id;
  const existingTask = editingTaskId ? getTask(editingTaskId) : null;
  const isEditing = Boolean(existingTask);

  const defaultProjectId =
    existingTask?.projectId ||
    routeProjectId ||
    location.state?.projectId ||
    activeProjectId ||
    projects[0]?.id ||
    '';

  const initialStatus =
    existingTask?.status ||
    location.state?.status ||
    (location.state?.isHotfix ? 'hotfix' : 'current');

  const initialIsHotfix = Boolean(
    existingTask?.isHotfix ||
    (existingTask?.tags && existingTask.tags.includes('hotfix')) ||
    location.state?.isHotfix
  );

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [taskPrompt, setTaskPrompt] = useState(existingTask?.taskPrompt || '');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(existingTask?.priority || (initialIsHotfix ? 'urgent' : 'medium'));
  const [deadline, setDeadline] = useState(existingTask?.deadline || existingTask?.dueDate || '');
  const [completionNote, setCompletionNote] = useState(existingTask?.completionNote || '');
  const [isHotfix, setIsHotfix] = useState(initialIsHotfix);
  const [tags, setTags] = useState(
    existingTask?.tags || (initialIsHotfix ? ['hotfix', 'bug'] : ['feature'])
  );
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState(existingTask?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [descMode, setDescMode] = useState('edit');
  const [isCopied, setIsCopied] = useState(false);
  const [isDescCopied, setIsDescCopied] = useState(false);
  const [isTaskCopied, setIsTaskCopied] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUnsavedConfirmOpen, setIsUnsavedConfirmOpen] = useState(false);
  const [isProcessingDescImg, setIsProcessingDescImg] = useState(false);
  const descImageInputRef = useRef(null);

  // Baseline task values for dirty checking (Requirement 1)
  const initialTaskValuesRef = useRef(null);

  // In-page search navigation state
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Load existing task when editing
  useEffect(() => {
    if (existingTask) {
      const pId = existingTask.projectId || defaultProjectId;
      const tTitle = existingTask.title || '';
      const tDesc = existingTask.description || '';
      const tPrompt = existingTask.taskPrompt || '';
      const tStatus = existingTask.status || 'current';
      const tPriority = existingTask.priority || 'medium';
      const tDeadline = existingTask.deadline || existingTask.dueDate || '';
      const tNote = existingTask.completionNote || '';
      const tHotfix = Boolean(existingTask.isHotfix || (existingTask.tags && existingTask.tags.includes('hotfix')));
      const tTags = existingTask.tags || [];
      const tSubtasks = existingTask.subtasks || [];

      setProjectId(pId);
      setTitle(tTitle);
      setDescription(tDesc);
      setTaskPrompt(tPrompt);
      setStatus(tStatus);
      setPriority(tPriority);
      setDeadline(tDeadline);
      setCompletionNote(tNote);
      setIsHotfix(tHotfix);
      setTags(tTags);
      setSubtasks(tSubtasks);

      if (!initialTaskValuesRef.current) {
        initialTaskValuesRef.current = {
          projectId: pId,
          title: tTitle,
          description: tDesc,
          taskPrompt: tPrompt,
          status: tStatus,
          priority: tPriority,
          deadline: tDeadline,
          completionNote: tNote,
          isHotfix: tHotfix,
          tags: tTags,
          subtasks: tSubtasks,
        };
      }
    }
  }, [existingTask, defaultProjectId]);

  // Compute if the form has unsaved edits in edit mode (Requirement 1)
  const isDirty = useMemo(() => {
    if (!isEditing || !initialTaskValuesRef.current) return false;
    const initial = initialTaskValuesRef.current;
    if (projectId !== initial.projectId) return true;
    if (title.trim() !== initial.title.trim()) return true;
    if (description.trim() !== initial.description.trim()) return true;
    if (taskPrompt.trim() !== initial.taskPrompt.trim()) return true;
    if (status !== initial.status) return true;
    if (priority !== initial.priority) return true;
    if (deadline !== initial.deadline) return true;
    if (completionNote.trim() !== initial.completionNote.trim()) return true;
    if (isHotfix !== initial.isHotfix) return true;
    if (JSON.stringify(tags) !== JSON.stringify(initial.tags)) return true;
    if (JSON.stringify(subtasks) !== JSON.stringify(initial.subtasks)) return true;
    return false;
  }, [isEditing, projectId, title, description, taskPrompt, status, priority, deadline, completionNote, isHotfix, tags, subtasks]);

  // History & gesture guard refs for Requirement 1 (Intercept mouse gesture & browser back button when isDirty)
  const bypassGuardRef = useRef(false);
  const guardPushedRef = useRef(false);

  useEffect(() => {
    if (!isEditing || !isDirty) {
      guardPushedRef.current = false;
      return;
    }

    // Push dummy history entry once when editing becomes dirty so browser back / swipe pops this entry
    if (!guardPushedRef.current) {
      window.history.pushState({ devorbitTaskGuard: true }, '', window.location.href);
      guardPushedRef.current = true;
    }

    const handlePopState = () => {
      if (bypassGuardRef.current) {
        return;
      }
      // Re-push state to keep user on the page and preserve guard
      window.history.pushState({ devorbitTaskGuard: true }, '', window.location.href);
      setIsUnsavedConfirmOpen(true);
    };

    const handleBeforeUnload = (e) => {
      if (bypassGuardRef.current) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, isDirty]);

  // Auto-restore draft from localStorage ONLY when creating a new task
  // FIX FOR REQUIREMENT 9:
  // If navigation explicitly targeted a status (e.g. + Add Task on Later/Hotfix column),
  // preserve that intended list instead of overriding with old draft status!
  useEffect(() => {
    if (isEditing) return;
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          if (parsed.projectId) setProjectId(parsed.projectId);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.taskPrompt) setTaskPrompt(parsed.taskPrompt);

          if (location.state?.status) {
            setStatus(location.state.status);
            const hotfixFromNav = Boolean(location.state.isHotfix || location.state.status === 'hotfix');
            setIsHotfix(hotfixFromNav);
          } else if (parsed.status) {
            setStatus(parsed.status);
            if (parsed.isHotfix !== undefined) setIsHotfix(parsed.isHotfix);
          }

          if (parsed.priority) setPriority(parsed.priority);
          if (parsed.deadline) setDeadline(parsed.deadline);
          if (Array.isArray(parsed.tags)) setTags(parsed.tags);
          if (Array.isArray(parsed.subtasks)) setSubtasks(parsed.subtasks);
          setHasRestoredDraft(true);
        }
      }
    } catch (_e) {
      // Ignore
    }
  }, [isEditing, location.state]);

  // Auto-save form as draft on change ONLY when creating a new task
  useEffect(() => {
    if (isEditing) return;
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
          isHotfix,
          tags,
          subtasks,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      } catch (_e) {
        // Ignore
      }
    }
  }, [isEditing, projectId, title, description, taskPrompt, status, priority, deadline, isHotfix, tags, subtasks]);

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
  }, [searchKeyword, descMode]);

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

  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_e) {
      // Ignore
    }
    setProjectId(defaultProjectId);
    setTitle('');
    setDescription('');
    setTaskPrompt('');
    setStatus('current');
    setPriority('medium');
    setDeadline('');
    setIsHotfix(false);
    setTags(['feature']);
    setSubtasks([]);
    setHasRestoredDraft(false);
    toastInfo('Draft discarded');
  };

  const handleToggleHotfix = () => {
    const nextVal = !isHotfix;
    setIsHotfix(nextVal);
    if (nextVal) {
      if (!tags.includes('hotfix')) {
        setTags([...tags, 'hotfix']);
      }
      setPriority('urgent');
      setStatus('hotfix');
    } else {
      setTags(tags.filter((t) => t !== 'hotfix'));
      if (status === 'hotfix') {
        setStatus('current');
      }
    }
  };

  const handleBackNavigation = () => {
    if (isEditing && isDirty) {
      setIsUnsavedConfirmOpen(true);
    } else {
      bypassGuardRef.current = true;
      navigate(projectId ? `/project/${projectId}/tasks` : -1);
    }
  };

  const handleDiscardChangesAndLeave = () => {
    bypassGuardRef.current = true;
    setIsUnsavedConfirmOpen(false);
    navigate(projectId ? `/project/${projectId}/tasks` : -1);
  };

  const handleSaveAndLeave = (e) => {
    bypassGuardRef.current = true;
    setIsUnsavedConfirmOpen(false);
    handleSubmit(e);
  };

  const handleCopyPrompt = async () => {
    if (!taskPrompt) return;
    try {
      await navigator.clipboard.writeText(taskPrompt);
      setIsCopied(true);
      toastSuccess('Task prompt copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (_err) {
      // Fallback
    }
  };

  const handleCopyDescription = async () => {
    if (!description) {
      toastInfo('No description to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(description);
      setIsDescCopied(true);
      toastSuccess('Task description copied to clipboard');
      setTimeout(() => setIsDescCopied(false), 2000);
    } catch (_err) {
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

  const handleCopyWholeTask = async () => {
    const taskData = {
      title,
      description,
      taskPrompt,
      status,
      priority,
      tags,
      subtasks,
    };
    const md = formatSingleTaskToMarkdown(taskData);
    if (!md) {
      toastInfo('No task content to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(md);
      setIsTaskCopied(true);
      toastSuccess('Task copied to clipboard as Markdown');
      setTimeout(() => setIsTaskCopied(false), 2000);
    } catch (_err) {
      // Fallback
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

  const handleRemoveSubtask = (subId) => {
    setSubtasks(subtasks.filter((s) => s.id !== subId));
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

  const handleDeleteTask = () => {
    if (!existingTask) return;
    bypassGuardRef.current = true;
    deleteTask(existingTask.id);
    toastSuccess('Task moved to Recycle Bin');
    navigate(`/project/${projectId || existingTask.projectId}/tasks`);
  };

  const handleSubmit = useCallback((e) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toastError('Task title is required');
      return;
    }
    if (!projectId) {
      toastError('Please select a project for this task');
      return;
    }

    const payload = {
      projectId,
      title: title.trim(),
      description: description.trim(),
      taskPrompt: taskPrompt.trim(),
      status,
      priority,
      deadline: deadline.trim(),
      dueDate: deadline.trim(),
      completionNote: completionNote.trim(),
      isHotfix,
      tags: isHotfix && !tags.includes('hotfix') ? [...tags, 'hotfix'] : tags,
      subtasks,
    };

    bypassGuardRef.current = true;

    if (isEditing && existingTask) {
      const wasDone = existingTask.status === 'done';
      const isNowDone = status === 'done';
      updateTask(existingTask.id, payload);

      if (!wasDone && isNowDone) {
        triggerConfetti();
      }

      toastSuccess('Task saved successfully');
      navigate(`/project/${projectId}/tasks`);
    } else {
      createTask(payload);
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch (_err) {
        // Ignore
      }
      toastSuccess(`Created task "${title.trim()}"`);
      navigate(`/project/${projectId}/tasks`);
    }
  }, [title, projectId, description, taskPrompt, status, priority, deadline, completionNote, isHotfix, tags, subtasks, isEditing, existingTask, updateTask, createTask, triggerConfetti, navigate, toastError, toastSuccess]);

  // Support global Cmd + S shortcut to save task
  useEffect(() => {
    const handleSaveShortcut = (e) => {
      e?.preventDefault?.();
      handleSubmit();
    };
    window.addEventListener('devorbit:save', handleSaveShortcut);
    return () => window.removeEventListener('devorbit:save', handleSaveShortcut);
  }, [handleSubmit]);

  const targetProject = projects.find((p) => p.id === projectId);

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
          marginBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={handleBackNavigation}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {isEditing
                ? `Update specifications, prompts, checklists, and state for "${targetProject?.name || 'Project'}".`
                : 'Define requirements, prompt specifications, acceptance subtasks, and priority.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Copy Task button inside edit / create task screen (Requirement 2) */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={isTaskCopied ? Check : Copy}
            onClick={handleCopyWholeTask}
            title="Copy whole task to clipboard as Markdown"
          >
            {isTaskCopied ? 'Copied Task!' : 'Copy Task'}
          </Button>

          {isEditing && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setIsDeleteConfirmOpen(true)}
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                borderColor: 'rgba(244, 63, 94, 0.25)',
              }}
              title="Move task to Recycle Bin"
            >
              Move to Recycle Bin
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={handleBackNavigation}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            icon={Save}
            onClick={handleSubmit}
            title="Save Task (⌘S)"
          >
            Save Task
          </Button>
        </div>
      </div>

      {/* In-Page Search & Navigation Toolbar (If search query active) */}
      {searchKeyword && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
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
                : 'No matches found on this task'}
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
                  title="Previous match (Shift+Enter)"
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
                  title="Next match (Enter)"
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

      {/* Restored Draft Banner for new task */}
      {!isEditing && hasRestoredDraft && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'rgba(0, 132, 255, 0.08)',
            border: '1px solid rgba(0, 132, 255, 0.25)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>
            Restored your unsaved draft task.
          </span>
          <button
            type="button"
            onClick={handleDiscardDraft}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 'var(--text-xs)',
            }}
          >
            Discard Draft
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Project Selector & Hotfix Toggle Row */}
        <div
          className="card"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '220px' }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              Target Project:
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{
                fontSize: 'var(--text-xs)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                flex: 1,
                maxWidth: '360px',
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hotfix Toggle Pill */}
          <button
            type="button"
            onClick={handleToggleHotfix}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${isHotfix ? '#f43f5e' : 'var(--border-default)'}`,
              backgroundColor: isHotfix ? 'rgba(244, 63, 94, 0.12)' : 'var(--bg-app)',
              color: isHotfix ? '#f43f5e' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              transition: 'all var(--transition-fast)',
            }}
            title="Mark as emergency Hot Fix — automatically categorizes into Hotfix list"
          >
            <Flame size={14} style={{ color: isHotfix ? '#f43f5e' : 'var(--text-muted)' }} />
            <span>HOT FIX {isHotfix ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        {/* Task Title */}
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <StatusBadge status={status} />
            <PriorityBadge priority={priority} />
          </div>

          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>
            Task Title <span style={{ color: '#f43f5e' }}>*</span>
          </label>
          <SpellCheckInput
            type="text"
            placeholder="e.g. Implement resilient WebSocket connection retry logic..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          />

          {searchKeyword && title.toLowerCase().includes(searchKeyword.toLowerCase()) && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ color: 'var(--text-muted)' }}>Title Match:</span>
              <span>{highlightText(title, searchKeyword)}</span>
            </div>
          )}
        </div>

        {/* Task Description (Edit / Preview) - Requirement 5 & Normal Visual Image Display */}
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
            placeholder="Write detailed acceptance criteria, technical approach, code blocks (```js), and bullet points (paste or drag & drop images)..."
            rows={8}
            mode={descMode}
            onModeChange={setDescMode}
            onCopy={handleCopyDescription}
            isCopied={isDescCopied}
            highlight={searchKeyword}
          />
        </div>

        {/* Task Prompt Box - Requirement 5 & 8 */}
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
              {/* AI prompt generate button - Requirement 8 (disabled for now) */}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Sparkles}
                disabled={true}
                title="Generate prompt using AI (Currently disabled until backend is added)"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              >
                Generate with AI
              </Button>

              {/* Copy prompt button - Requirement 4 */}
              {taskPrompt && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={isCopied ? Check : Copy}
                  onClick={handleCopyPrompt}
                  title="1-click copy prompt to clipboard"
                >
                  {isCopied ? 'Copied!' : 'Copy Prompt'}
                </Button>
              )}
            </div>
          </div>

          <SpellCheckTextarea
            rows={4}
            placeholder="Write the exact LLM prompt, technical specifications, or requirements for this task..."
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

          {searchKeyword && taskPrompt && taskPrompt.toLowerCase().includes(searchKeyword.toLowerCase()) && (
            <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Prompt Match:</span>
              {highlightText(taskPrompt, searchKeyword)}
            </div>
          )}

          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            One-click copyable from task cards on the Kanban board for fast pairing.
          </p>
        </div>

        {/* Subtasks Checklist */}
        <div
          className="card"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
            Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {subtasks.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(sub.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: sub.completed ? 'var(--status-done-solid)' : 'var(--text-muted)' }}
                >
                  {sub.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-xs)',
                    color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: sub.completed ? 'line-through' : 'none',
                  }}
                >
                  {highlightText(sub.text, searchKeyword)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(sub.id)}
                  className="btn-icon btn-icon-danger"
                  style={{ width: 20, height: 20 }}
                  title="Remove subtask"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div style={{ flex: 1 }}>
              <SpellCheckInput
                type="text"
                placeholder="Add acceptance subtask (e.g. Unit test edge cases)..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                style={{ fontSize: 'var(--text-xs)' }}
              />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddSubtask}>
              Add
            </Button>
          </div>
        </div>

        {/* Completion Note (Revealed when task is completed or has note) */}
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

            {searchKeyword && completionNote && completionNote.toLowerCase().includes(searchKeyword.toLowerCase()) && (
              <div style={{ padding: '6px 10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Completion Note Match:</span>
                {highlightText(completionNote, searchKeyword)}
              </div>
            )}
          </div>
        )}

        {/* Status, Priority & Deadline Row */}
        <div
          className="card"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Status
            </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="current">Current</option>
              <option value="later">Later</option>
              <option value="done">Done (Completed)</option>
              <option value="hotfix">Hot Fix</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Priority
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Deadline
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Calendar size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        {/* Tags */}
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
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-secondary)' }}>
            Tags
          </label>
          <input
            type="text"
            placeholder="Type tag and press Enter or comma..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            spellCheck={true}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
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
                  backgroundColor: t === 'hotfix' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface-active)',
                  color: t === 'hotfix' ? '#f43f5e' : 'var(--text-primary)',
                  border: t === 'hotfix' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--border-muted)',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Quick add:</span>
            {QUICK_TAGS.map((qt) => (
              <button
                key={qt}
                type="button"
                onClick={() => {
                  if (!tags.includes(qt)) setTags([...tags, qt]);
                }}
                style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px dashed var(--border-default)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                +{qt}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            icon={isTaskCopied ? Check : Copy}
            onClick={handleCopyWholeTask}
            title="Copy whole task to clipboard as Markdown"
          >
            {isTaskCopied ? 'Copied Task!' : 'Copy Task'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleBackNavigation}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" icon={Save} title="Save Task (⌘S)">
            Save Task
          </Button>
        </div>
      </form>

      {/* Brand Footer at end of create / edit tasks screen (Requirement 6) */}
      <BrandFooter tagline="Orbit your development workflow with clarity and speed" />

      {/* Move to Recycle Bin Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTask}
        title="Move Task to Recycle Bin?"
        message={`Are you sure you want to delete "${title || 'this task'}"? It can be recovered from the Recycle Bin within 30 days.`}
        confirmText="Move to Recycle Bin"
        confirmVariant="danger"
      />

      {/* Confirm Unsaved Changes Dialog (Requirement 1) */}
      <ConfirmDialog
        isOpen={isUnsavedConfirmOpen}
        onClose={() => setIsUnsavedConfirmOpen(false)}
        onConfirm={handleSaveAndLeave}
        onDiscard={handleDiscardChangesAndLeave}
        title="Save Changes?"
        message="You have unsaved changes on this task. Would you like to save your changes or discard them before leaving?"
        confirmText="Save Changes"
        cancelText="Keep Editing"
        discardText="Discard Changes"
        confirmVariant="primary"
      />
    </div>
  );
};
