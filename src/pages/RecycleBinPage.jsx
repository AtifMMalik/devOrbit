import React, { useState } from 'react';
import { RotateCcw, Trash2, Clock, CheckSquare, Folder } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PriorityBadge } from '../components/common/Badge';
import { ProjectAvatar } from '../components/common/ProjectAvatar';
import { BrandFooter } from '../components/common/BrandFooter';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';

export const RecycleBinPage = () => {
  const {
    deletedTasks = [],
    deletedProjects = [],
    restoreTask,
    restoreProject,
    permanentlyDeleteTask,
    permanentlyDeleteProject,
    emptyRecycleBin,
    projects,
  } = useWorkspace();
  const { toastSuccess, toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'projects'
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState(null); // { type: 'task'|'project', item }

  const handleRestoreTask = (task) => {
    restoreTask(task.id);
    toastSuccess(`Restored task "${task.title}"`);
  };

  const handleRestoreProject = (proj) => {
    const name = restoreProject(proj.id);
    toastSuccess(`Restored project "${name || proj.name}"`);
  };

  const handleConfirmPermanentDelete = () => {
    if (!itemToDeletePermanently) return;
    const { type, item } = itemToDeletePermanently;
    if (type === 'task') {
      permanentlyDeleteTask(item.id);
      toastInfo(`Permanently deleted task "${item.title}"`);
    } else if (type === 'project') {
      permanentlyDeleteProject(item.id);
      toastInfo(`Permanently deleted project "${item.name}"`);
    }
    setItemToDeletePermanently(null);
  };

  const handleConfirmEmptyBin = () => {
    emptyRecycleBin();
    toastSuccess('Recycle Bin emptied');
    setIsEmptyConfirmOpen(false);
  };

  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedTime = new Date(deletedAt).getTime();
    if (isNaN(deletedTime)) return 30;
    const elapsedDays = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - elapsedDays);
  };

  const totalItemsCount = deletedTasks.length + deletedProjects.length;

  return (
    <div
      className="page-container"
      style={{
        padding: 'var(--space-8)',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        boxSizing: 'border-box',
        minHeight: '100%',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={20} />
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0, fontWeight: 'var(--font-weight-bold)' }}>
            Recycle Bin
          </h1>
        </div>

        {totalItemsCount > 0 && (
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setIsEmptyConfirmOpen(true)}
          >
            Empty Recycle Bin
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: activeTab === 'tasks' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            backgroundColor: activeTab === 'tasks' ? 'var(--bg-surface-active)' : 'transparent',
            color: activeTab === 'tasks' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: activeTab === 'tasks' ? '1px solid var(--border-default)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckSquare size={14} />
          <span>Tasks ({deletedTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-xs)',
            fontWeight: activeTab === 'projects' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            backgroundColor: activeTab === 'projects' ? 'var(--bg-surface-active)' : 'transparent',
            color: activeTab === 'projects' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: activeTab === 'projects' ? '1px solid var(--border-default)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Folder size={14} />
          <span>Projects ({deletedProjects.length})</span>
        </button>
      </div>

      {/* TAB 1: Deleted Tasks */}
      {activeTab === 'tasks' && (
        <div style={{ flex: 1 }}>
          {deletedTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {deletedTasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);
                const daysLeft = getRemainingDays(task.deletedAt);

                return (
                  <div
                    key={task.id}
                    className="card card-hoverable"
                    style={{
                      padding: 'var(--space-3-5) var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                            {task.title}
                          </span>
                          <PriorityBadge priority={task.priority} />
                          {task.isHotfix && (
                            <span style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 'bold' }}>🔥 HOT FIX</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span>Project: <strong style={{ color: 'var(--text-secondary)' }}>{proj?.name || 'Unknown Project'}</strong></span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: daysLeft <= 3 ? '#f43f5e' : 'var(--text-muted)' }}>
                            <Clock size={12} />
                            {daysLeft} days remaining
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => handleRestoreTask(task)}
                          title="Restore task to project"
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setItemToDeletePermanently({ type: 'task', item: task })}
                          title="Permanently Delete"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }} className="truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-12) var(--space-4)',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <Trash2 size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-sm)' }}>No deleted tasks in recycle bin.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Deleted Projects */}
      {activeTab === 'projects' && (
        <div style={{ flex: 1 }}>
          {deletedProjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {deletedProjects.map((proj) => {
                const daysLeft = getRemainingDays(proj.deletedAt);
                const taskCount = proj.associatedTasks?.length || 0;
                const notesCount = proj.associatedNotes?.length || 0;

                return (
                  <div
                    key={proj.id}
                    className="card card-hoverable"
                    style={{
                      padding: 'var(--space-3-5) var(--space-4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                        <ProjectAvatar project={proj} size={36} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                              {proj.name}
                            </span>
                            {proj.author && (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {proj.author}</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 4, fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>{taskCount} task(s) · {notesCount} doc(s)</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: daysLeft <= 3 ? '#f43f5e' : 'var(--text-muted)' }}>
                              <Clock size={12} />
                              {daysLeft} days remaining
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => handleRestoreProject(proj)}
                          title="Restore project and its tasks"
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setItemToDeletePermanently({ type: 'project', item: proj })}
                          title="Permanently Delete Project"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {proj.description && (
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }} className="truncate">
                        {proj.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-12) var(--space-4)',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <Trash2 size={36} style={{ margin: '0 auto var(--space-2)', opacity: 0.3 }} />
              <p style={{ margin: '8px 0 0 0', fontSize: 'var(--text-sm)' }}>No deleted projects in recycle bin.</p>
            </div>
          )}
        </div>
      )}

      {/* Brand Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <BrandFooter />
      </div>

      {/* Confirm Empty Bin */}
      <ConfirmDialog
        isOpen={isEmptyConfirmOpen}
        onClose={() => setIsEmptyConfirmOpen(false)}
        onConfirm={handleConfirmEmptyBin}
        title="Empty Recycle Bin"
        message="Are you sure you want to permanently delete all soft-deleted tasks and projects? This cannot be undone."
        confirmText="Empty All"
        confirmVariant="danger"
      />

      {/* Confirm Permanent Delete Single Item */}
      <ConfirmDialog
        isOpen={!!itemToDeletePermanently}
        onClose={() => setItemToDeletePermanently(null)}
        onConfirm={handleConfirmPermanentDelete}
        title={`Permanently Delete ${itemToDeletePermanently?.type === 'project' ? 'Project' : 'Task'}`}
        message={`Are you sure you want to permanently delete "${itemToDeletePermanently?.item?.title || itemToDeletePermanently?.item?.name}"? It will be removed permanently.`}
        confirmText="Delete Permanently"
        confirmVariant="danger"
      />
    </div>
  );
};

