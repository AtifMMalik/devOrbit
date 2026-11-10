import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Plus,
  Search,
  Rocket,
  Pencil,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { PriorityBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BrandFooter } from '../components/common/BrandFooter';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'var(--bg-surface-active)' },
  exploring: { label: 'Exploring', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  ready: { label: 'Ready to Build', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  converted: { label: 'Converted to Project', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
};

export const ProjectIdeasPage = () => {
  const navigate = useNavigate();
  const {
    ideas,
    projects,
    createIdea,
    deleteIdea,
    convertIdeaToProject,
    setActiveProjectId,
  } = useWorkspace();
  const { toastSuccess, toastInfo } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deletingIdea, setDeletingIdea] = useState(null);

  const handleDeleteConfirm = () => {
    if (!deletingIdea) return;
    deleteIdea(deletingIdea.id);
    toastInfo(`Removed idea "${deletingIdea.title}"`);
    setDeletingIdea(null);
  };

  const handleConvertToProject = (idea) => {
    const newProject = convertIdeaToProject(idea.id);
    if (newProject) {
      toastSuccess(`Converted "${idea.title}" into project "${newProject.name}"!`);
      setActiveProjectId(newProject.id);
      navigate(`/project/${newProject.id}/tasks`);
    }
  };

  // Filtered Ideas
  const filteredIdeas = useMemo(() => {
    return (ideas || []).filter((idea) => {
      if (statusFilter !== 'all' && idea.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && idea.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = (idea.title || '').toLowerCase().includes(q);
        const inDesc = (idea.description || '').toLowerCase().includes(q);
        const inTags = (idea.tags || []).some((t) => t.toLowerCase().includes(q));
        const inFeatures = (idea.targetFeatures || []).some((f) => f.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags && !inFeatures) return false;
      }
      return true;
    });
  }, [ideas, statusFilter, priorityFilter, searchQuery]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
        padding: 'var(--space-6) var(--space-8)',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--space-5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
            }}
          >
            <Lightbulb size={24} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Project Ideas Lab
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-surface-active)',
                  color: 'var(--text-secondary)',
                }}
              >
                {ideas?.length || 0}
              </span>
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/ideas/new')}>
            New Project Idea
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search ideas, scope features, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            spellCheck={true}
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 10,
              height: 32,
              fontSize: 'var(--text-xs)',
            }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 32, fontSize: 'var(--text-xs)', padding: '0 8px' }}
          >
            <option value="all">All Statuses ({ideas?.length || 0})</option>
            <option value="draft">Draft ({ideas?.filter((i) => i.status === 'draft').length || 0})</option>
            <option value="exploring">Exploring ({ideas?.filter((i) => i.status === 'exploring').length || 0})</option>
            <option value="ready">Ready to Build ({ideas?.filter((i) => i.status === 'ready').length || 0})</option>
            <option value="converted">Converted ({ideas?.filter((i) => i.status === 'converted').length || 0})</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
            Priority:
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ height: 32, fontSize: 'var(--text-xs)', padding: '0 8px' }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 'var(--space-12) var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Lightbulb size={28} />
          </div>
          <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            {ideas?.length === 0 ? 'No project ideas yet' : 'No matching ideas found'}
          </h3>
          {ideas?.length > 0 && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                maxWidth: '460px',
                margin: '0 auto var(--space-5) auto',
                lineHeight: 1.5,
              }}
            >
              Try clearing your search query or adjusting the status and priority filters.
            </p>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: ideas?.length === 0 ? 'var(--space-3)' : 0 }}>
            <Button variant="primary" icon={Plus} onClick={() => navigate('/ideas/new')}>
              Create Project Idea
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {filteredIdeas.map((idea) => {
            const statusMeta = STATUS_CONFIG[idea.status] || STATUS_CONFIG.draft;
            const isConverted = idea.status === 'converted';
            const convertedProject = isConverted && idea.convertedProjectId
              ? projects.find((p) => p.id === idea.convertedProjectId)
              : null;

            return (
              <div
                key={idea.id}
                className="card card-hoverable animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: isConverted
                    ? '1.5px solid rgba(139, 92, 246, 0.45)'
                    : '1px solid var(--border-default)',
                  transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
                }}
              >
                {/* Top Colored Accent Stripe */}
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    backgroundColor: idea.color || '#6366f1',
                  }}
                />

                <div
                  style={{
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    gap: 'var(--space-4)',
                  }}
                >
                  {/* Status, Priority & Quick Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-medium)',
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      <PriorityBadge priority={idea.priority === 'critical' ? 'urgent' : idea.priority} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/ideas/${idea.id}/edit`)}
                        className="btn-icon"
                        style={{ width: 28, height: 28 }}
                        title="Edit Idea Details"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingIdea(idea)}
                        style={{
                          width: 28,
                          height: 28,
                          color: 'var(--color-danger, #f43f5e)',
                          background: 'transparent',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          transition: 'all var(--transition-fast)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-danger, #f43f5e)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                        }}
                        title="Delete Idea"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--text-primary)',
                        lineHeight: 1.35,
                      }}
                    >
                      {idea.title}
                    </h3>
                    {idea.description && (
                      <p
                        style={{
                          margin: '8px 0 0 0',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {idea.description}
                      </p>
                    )}
                  </div>

                  {/* Target Features & Scope Checklist */}
                  {Array.isArray(idea.targetFeatures) && idea.targetFeatures.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3) var(--space-4)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Target Features & Scope ({idea.targetFeatures.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {idea.targetFeatures.map((feat, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <CheckCircle2
                              size={13}
                              style={{
                                color: idea.color || 'var(--color-primary)',
                                marginTop: 2,
                                flexShrink: 0,
                              }}
                            />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {Array.isArray(idea.tags) && idea.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 'var(--space-1)' }}>
                      {idea.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--bg-surface-active)',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Convert to Project Footer CTA */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-default)',
                      paddingTop: 'var(--space-4)',
                      marginTop: 'var(--space-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {isConverted ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: '#8b5cf6', fontWeight: 'var(--font-weight-medium)' }}>
                          ✓ Converted to Project
                        </span>
                        {convertedProject ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={ExternalLink}
                            onClick={() => {
                              setActiveProjectId(convertedProject.id);
                              navigate(`/project/${convertedProject.id}/tasks`);
                            }}
                          >
                            Open Project
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Rocket}
                            onClick={() => handleConvertToProject(idea)}
                          >
                            Convert Again
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Rocket}
                        onClick={() => handleConvertToProject(idea)}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          backgroundColor: idea.color || 'var(--color-primary)',
                          padding: '7px 14px',
                        }}
                      >
                        Convert to devOrbit Project
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <BrandFooter />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingIdea)}
        title="Delete Project Idea?"
        message={`Are you sure you want to delete "${deletingIdea?.title}"? This cannot be undone.`}
        confirmText="Delete Idea"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingIdea(null)}
      />
    </div>
  );
};
