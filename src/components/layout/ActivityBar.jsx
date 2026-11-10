import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  FolderKanban,
  Lightbulb,
  Blocks,
  Trash2,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';
import { useExtensions } from '../../extensions/ExtensionContext';

/**
 * Reusable Activity Bar Button with Hover Tooltip Bubble
 */
const ActivityBarButton = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  badge,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className={`btn-icon ${active ? 'active' : ''}`}
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: active ? 'var(--bg-surface-active)' : 'transparent',
          color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-fast)',
        }}
        aria-label={label}
      >
        {active && (
          <span
            style={{
              position: 'absolute',
              left: -7,
              top: 6,
              bottom: 6,
              width: 2,
              backgroundColor: 'var(--color-primary)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        )}
        {children || (Icon && <Icon size={18} />)}
        {badge}
      </button>

      {/* Hover Tooltip Bubble */}
      {isHovered && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 'calc(100% + 10px)',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'var(--bg-elevated, #161e31)',
            color: 'var(--text-primary)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-default)',
            zIndex: 'var(--z-tooltip, 600)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {label}
          {/* Arrow Caret */}
          <div
            style={{
              position: 'absolute',
              right: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderRight: '5px solid var(--border-default)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export const ActivityBar = ({
  activePanel = 'projects', // 'projects' | 'extensions'
  onSelectPanel,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActiveProjectId, deletedTasks, deletedProjects } = useWorkspace();
  const { isDark, toggleTheme } = useTheme();
  const { extensions } = useExtensions();

  const installedExtensionsCount = extensions.filter((e) => e.installed && e.enabled).length;
  const recycleBinCount = (deletedTasks?.length || 0) + (deletedProjects?.length || 0);

  const handleNav = (path, panelName = 'projects') => {
    setActiveProjectId(null);
    navigate(path);
    if (panelName && onSelectPanel) {
      onSelectPanel(panelName);
    }
  };

  const handleTogglePanel = (panelName, targetPath = null) => {
    if (activePanel === panelName && !sidebarCollapsed) {
      onToggleSidebar();
    } else {
      if (sidebarCollapsed) {
        onToggleSidebar(false);
      }
      if (onSelectPanel) {
        onSelectPanel(panelName);
      }
      if (targetPath) {
        navigate(targetPath);
      }
    }
  };

  // Determine the single active tab strictly (Item 7)
  const getActiveTab = () => {
    if (location.pathname === '/settings') return 'settings';
    if (location.pathname === '/recycle-bin') return 'recycle-bin';
    if (location.pathname === '/analytics') return 'analytics';
    if (location.pathname === '/ideas' || location.pathname.startsWith('/ideas/')) return 'ideas';
    if (location.pathname === '/') return 'overview';
    if (activePanel === 'extensions' && !sidebarCollapsed) return 'extensions';
    if (!sidebarCollapsed) return 'projects';
    return null;
  };

  const activeTab = getActiveTab();

  return (
    <aside
      className="activity-bar"
      style={{
        width: 'var(--activity-bar-width)',
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 'var(--z-sticky)',
        flexShrink: 0,
        padding: 'var(--space-2) 0',
        userSelect: 'none',
      }}
    >
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
        {/* Item 1: Sidebar Toggle Button replaces DevOrbit Logo at the very top */}
        <ActivityBarButton
          icon={sidebarCollapsed ? PanelLeftOpen : PanelLeftClose}
          label={sidebarCollapsed ? 'Expand Primary Sidebar (⌘B)' : 'Collapse Primary Sidebar (⌘B)'}
          onClick={() => onToggleSidebar()}
          active={false}
        />

        {/* Divider */}
        <div style={{ width: '28px', height: '1px', backgroundColor: 'var(--border-subtle)', margin: '2px 0' }} />

        {/* Item 8: Projects Overview tab */}
        <ActivityBarButton
          icon={LayoutDashboard}
          label="Projects Overview"
          active={activeTab === 'overview'}
          onClick={() => handleNav('/')}
        />

        {/* Item 8: Work Analysis tab */}
        <ActivityBarButton
          icon={TrendingUp}
          label="Work Analytics & Velocity"
          active={activeTab === 'analytics'}
          onClick={() => handleNav('/analytics')}
        />

        {/* Item 8: Project Ideas tab */}
        <ActivityBarButton
          icon={Lightbulb}
          label="Project Ideas Lab"
          active={activeTab === 'ideas'}
          onClick={() => handleNav('/ideas')}
        />

        {/* Projects Tree & Explorer Panel Toggle */}
        <ActivityBarButton
          icon={FolderKanban}
          label="Projects Explorer"
          active={activeTab === 'projects'}
          onClick={() => handleTogglePanel('projects')}
        />

        {/* Extensions Marketplace Panel Toggle */}
        <ActivityBarButton
          icon={Blocks}
          label="Extensions Marketplace"
          active={activeTab === 'extensions'}
          onClick={() => handleTogglePanel('extensions')}
          badge={
            installedExtensionsCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                }}
              />
            ) : null
          }
        />
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
        {/* Dark/Light Theme Toggle */}
        <ActivityBarButton
          icon={isDark ? Sun : Moon}
          label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          onClick={toggleTheme}
        />

        {/* Settings */}
        <ActivityBarButton
          icon={Settings}
          label="Settings & Backup"
          active={activeTab === 'settings'}
          onClick={() => handleNav('/settings')}
        />

        {/* Recycle Bin */}
        <ActivityBarButton
          icon={Trash2}
          label="Recycle Bin"
          active={activeTab === 'recycle-bin'}
          onClick={() => handleNav('/recycle-bin')}
          badge={
            recycleBinCount > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-danger, #f43f5e)',
                }}
              />
            ) : null
          }
        />
      </div>
    </aside>
  );
};
