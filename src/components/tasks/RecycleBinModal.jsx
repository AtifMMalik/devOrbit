import React, { useState } from 'react';
import { RotateCcw, Trash2, Clock, CheckSquare, Folder } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PriorityBadge } from '../common/Badge';
import { ProjectAvatar } from '../common/ProjectAvatar';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';

export const RecycleBinModal = ({ isOpen, onClose }) => {
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Recycle Bin"
        subtitle="Recover soft-deleted tasks and projects within 30 days. Expired items are permanently purged."
        maxWidth="680px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Top Bar: Tabs & Empty Bin Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 'var(--space-2)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                style={{
                  padding: '5px 12px',
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
                <CheckSquare size={13} />
                <span>Tasks ({deletedTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                style={{
                  padding: '5px 12px',
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
                <Folder size={13} />
                <span>Projects ({deletedProjects.length})</span>
              </button>
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

          {/* TAB 1: Deleted Tasks */}
          {activeTab === 'tasks' && (
            <div>
              {deletedTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)', maxHeight: '52vh', overflowY: 'auto' }}>
                  {deletedTasks.map((task) => {
                    const proj = projects.find((p) => p.id === task.projectId);
                    const daysLeft = getRemainingDays(task.deletedAt);

                    return (
                      <div
                        key={task.id}
                        className="card"
                        style={{
                          padding: 'var(--space-3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-2)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
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
                                <Clock size={11} />
                                {daysLeft} days remaining
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => handleRestoreTask(task)}
                              title="Restore task to project"
                            >
                              Restore
                            </Button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              onClick={() => setItemToDeletePermanently({ type: 'task', item: task })}
                              title="Permanently Delete"
                              style={{ color: '#f43f5e' }}
                            >
                              <Trash2 size={13} />
                            </button>
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
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-8) var(--space-4)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <Trash2 size={28} style={{ margin: '0 auto var(--space-2)', opacity: 0.4 }} />
                  <p style={{ margin: '4px 0 0 0' }}>No deleted tasks in recycle bin.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Deleted Projects */}
          {activeTab === 'projects' && (
            <div>
              {deletedProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2-5)', maxHeight: '52vh', overflowY: 'auto' }}>
                  {deletedProjects.map((proj) => {
                    const daysLeft = getRemainingDays(proj.deletedAt);
                    const taskCount = proj.associatedTasks?.length || 0;
                    const notesCount = proj.associatedNotes?.length || 0;

                    return (
                      <div
                        key={proj.id}
                        className="card"
                        style={{
                          padding: 'var(--space-3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--space-2)',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
                            <ProjectAvatar project={proj} size={30} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                                  {proj.name}
                                </span>
                                {proj.author && (
                                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>by {proj.author}</span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 3, fontSize: '11px', color: 'var(--text-muted)' }}>
                                <span>{taskCount} task(s) · {notesCount} doc(s)</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: daysLeft <= 3 ? '#f43f5e' : 'var(--text-muted)' }}>
                                  <Clock size={11} />
                                  {daysLeft} days remaining
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => handleRestoreProject(proj)}
                              title="Restore project and its tasks"
                            >
                              Restore
                            </Button>
                            <button
                              type="button"
                              className="btn-icon btn-icon-danger"
                              onClick={() => setItemToDeletePermanently({ type: 'project', item: proj })}
                              title="Permanently Delete Project"
                              style={{ color: '#f43f5e' }}
                            >
                              <Trash2 size={13} />
                            </button>
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
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-8) var(--space-4)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <Trash2 size={28} style={{ margin: '0 auto var(--space-2)', opacity: 0.4 }} />
                  <p style={{ margin: '4px 0 0 0' }}>No deleted projects in recycle bin.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Empty Bin */}
      <ConfirmDialog
        isOpen={isEmptyConfirmOpen}
        onClose={() => setIsEmptyConfirmOpen(false)}
        onConfirm={handleConfirmEmptyBin}
        title="Empty Recycle Bin"
        message="Are you sure you want to permanently delete all soft-deleted tasks and projects? This cannot be undone."
        confirmText="Empty All"
        danger
      />

      {/* Confirm Permanent Delete Single Item */}
      <ConfirmDialog
        isOpen={!!itemToDeletePermanently}
        onClose={() => setItemToDeletePermanently(null)}
        onConfirm={handleConfirmPermanentDelete}
        title={`Permanently Delete ${itemToDeletePermanently?.type === 'project' ? 'Project' : 'Task'}`}
        message={`Are you sure you want to permanently delete "${itemToDeletePermanently?.item?.title || itemToDeletePermanently?.item?.name}"? It will be removed permanently.`}
        confirmText="Delete Permanently"
        danger
      />
    </>
  );
};
