import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { BookOpen, Plus, Save } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { ProjectHeader } from '../components/projects/ProjectHeader';
import { MarkdownEditor } from '../components/notes/MarkdownEditor';
import { MarkdownSyncModal } from '../components/tasks/MarkdownSyncModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';

export const ProjectNotesPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { onOpenNewProject, onOpenEditProject, onOpenNewTask } = useOutletContext();
  const { getProject, getProjectNotes, saveProjectNote, deleteProject } = useWorkspace();

  const [isMarkdownSyncOpen, setIsMarkdownSyncOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const project = getProject(projectId);
  const notes = getProjectNotes(projectId);
  const currentNote = notes[0] || {
    title: `${project?.name || 'Project'} Notes & Architecture`,
    content: `# ${project?.name || 'Project'} Documentation\n\n## Architecture Overview\nWrite down your tech stack, API specifications, environment setup instructions, and meeting notes here.\n\n### Core Highlights\n- Markdown formatting is supported.\n- Changes are automatically stored to browser localStorage.\n`,
  };

  if (!project) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <h2>Project not found</h2>
        <Button variant="primary" onClick={() => navigate('/')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Workspace
        </Button>
      </div>
    );
  }

  const handleSaveNote = (title, content) => {
    saveProjectNote(project.id, title, content);
  };

  const handleDeleteProject = () => {
    deleteProject(project.id);
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <ProjectHeader
        project={project}
        onNewTask={onOpenNewTask}
        onNewSubproject={() => onOpenNewProject(project.id)}
        onOpenMarkdownSync={() => setIsMarkdownSyncOpen(true)}
        onEditProject={() => onOpenEditProject(project)}
        onDeleteProject={() => setIsDeleteConfirmOpen(true)}
      />

      <div className="page-container" style={{ padding: 'var(--space-6) var(--space-8)', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <MarkdownEditor
          key={project.id}
          initialTitle={currentNote.title}
          initialContent={currentNote.content}
          onSave={handleSaveNote}
        />
      </div>

      <MarkdownSyncModal
        isOpen={isMarkdownSyncOpen}
        onClose={() => setIsMarkdownSyncOpen(false)}
        project={project}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"?`}
        confirmText="Delete Project"
      />
    </div>
  );
};
