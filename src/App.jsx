import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ExtensionProvider } from './extensions/ExtensionContext';
import { AppLayout } from './components/layout/AppLayout';
import { AppPreloader } from './components/common/AppPreloader';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { ProjectTasksPage } from './pages/ProjectTasksPage';
import { ProjectNotesPage } from './pages/ProjectNotesPage';
import { ProjectAnalyticsPage } from './pages/ProjectAnalyticsPage';
import { AnalyticsProfilePage } from './pages/AnalyticsProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ExtensionDetailsPage } from './pages/ExtensionDetailsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { ProjectIdeasPage } from './pages/ProjectIdeasPage';
import { CreateIdeaPage } from './pages/CreateIdeaPage';
import { RecycleBinPage } from './pages/RecycleBinPage';

export default function App() {
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('devorbit_platform_font_size') || '15px';
    document.documentElement.style.fontSize = savedFontSize;
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <ExtensionProvider>
          <WorkspaceProvider>
            {isPreloading && <AppPreloader onFinish={() => setIsPreloading(false)} minDuration={2200} />}
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<DashboardOverviewPage />} />
                  <Route path="analytics" element={<AnalyticsProfilePage />} />
                  <Route path="ideas" element={<ProjectIdeasPage />} />
                  <Route path="ideas/new" element={<CreateIdeaPage />} />
                  <Route path="ideas/:ideaId" element={<CreateIdeaPage />} />
                  <Route path="ideas/:ideaId/edit" element={<CreateIdeaPage />} />
                  <Route path="project/new" element={<CreateProjectPage />} />
                  <Route path="project/:projectId/edit" element={<CreateProjectPage />} />
                  <Route path="tasks/new" element={<CreateTaskPage />} />
                  <Route path="tasks/:taskId" element={<CreateTaskPage />} />
                  <Route path="tasks/:taskId/edit" element={<CreateTaskPage />} />
                  <Route path="project/:projectId" element={<Navigate to="tasks" replace />} />
                  <Route path="project/:projectId/tasks" element={<ProjectTasksPage />} />
                  <Route path="project/:projectId/tasks/new" element={<CreateTaskPage />} />
                  <Route path="project/:projectId/tasks/:taskId" element={<CreateTaskPage />} />
                  <Route path="project/:projectId/tasks/:taskId/edit" element={<CreateTaskPage />} />
                  <Route path="project/:projectId/task/:taskId" element={<CreateTaskPage />} />
                  <Route path="project/:projectId/overview" element={<ProjectOverviewPage />} />
                  <Route path="project/:projectId/notes" element={<ProjectNotesPage />} />
                  <Route path="project/:projectId/analytics" element={<ProjectAnalyticsPage />} />
                  <Route path="recycle-bin" element={<RecycleBinPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="extensions/:extensionId" element={<ExtensionDetailsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </WorkspaceProvider>
        </ExtensionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
