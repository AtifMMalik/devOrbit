import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { ProjectTasksPage } from './pages/ProjectTasksPage';
import { ProjectNotesPage } from './pages/ProjectNotesPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardOverviewPage />} />
                <Route path="project/:projectId/overview" element={<ProjectOverviewPage />} />
                <Route path="project/:projectId/tasks" element={<ProjectTasksPage />} />
                <Route path="project/:projectId/notes" element={<ProjectNotesPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </WorkspaceProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
