import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import initialExtensionsManifest from './extensions.json';
import initialActivityLogs from './logs/activity.log.json';
import { THEME_DEFINITIONS } from './themes/themeRegistry';

const EXTENSIONS_STORAGE_KEY = 'devorbit_extensions_manifest_v2';
const EXTENSIONS_LOGS_KEY = 'devorbit_extensions_logs_v2';
const ACTIVE_THEME_STORAGE_KEY = 'devorbit_active_theme_id_v2';

const ExtensionContext = createContext(null);

export const ExtensionProvider = ({ children }) => {
  // Extensions list
  const [extensions, setExtensions] = useState(() => {
    try {
      const saved = localStorage.getItem(EXTENSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((e) => e.id));
        const merged = [...parsed];
        initialExtensionsManifest.forEach((manifestExt) => {
          if (!existingIds.has(manifestExt.id)) {
            merged.push(manifestExt);
          }
        });
        return merged;
      }
    } catch (e) {
      console.warn('Failed to parse saved extensions from storage:', e);
    }
    return initialExtensionsManifest;
  });

  // Activity logs
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(EXTENSIONS_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved extension logs:', e);
    }
    return initialActivityLogs;
  });

  // Active theme ID: disabled by default as requested in Item 8
  const [activeThemeId, setActiveThemeId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);
    if (saved && THEME_DEFINITIONS[saved]) return saved;
    return null;
  });

  // Persist extensions changes
  useEffect(() => {
    try {
      localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(extensions));
    } catch (e) {
      console.error('Failed to save extensions to localStorage:', e);
    }
  }, [extensions]);

  // Persist logs
  useEffect(() => {
    try {
      localStorage.setItem(EXTENSIONS_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save extension logs to localStorage:', e);
    }
  }, [logs]);

  // Inject or remove active theme styles
  const applyThemeStyle = useCallback((themeId) => {
    let styleEl = document.getElementById('devorbit-active-theme');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'devorbit-active-theme';
      document.head.appendChild(styleEl);
    }

    if (!themeId || themeId === 'none' || !THEME_DEFINITIONS[themeId]) {
      styleEl.textContent = '';
      return;
    }

    const themeDef = THEME_DEFINITIONS[themeId];
    styleEl.textContent = themeDef.css;
  }, []);

  // Update theme when activeThemeId changes
  useEffect(() => {
    applyThemeStyle(activeThemeId);
    if (activeThemeId) {
      localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, activeThemeId);
    } else {
      localStorage.removeItem(ACTIVE_THEME_STORAGE_KEY);
    }
  }, [activeThemeId, applyThemeStyle]);

  // Append new log entry
  const addLogEntry = (action, extensionId, extensionName, details = '') => {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      extensionId,
      extensionName,
      details,
    };
    setLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  // Check if extension is installed and enabled
  const isExtensionActive = useCallback((extensionId) => {
    const ext = extensions.find((e) => e.id === extensionId);
    return Boolean(ext && ext.installed && ext.enabled);
  }, [extensions]);

  // Enable an extension
  const enableExtension = useCallback((extensionId) => {
    setExtensions((prev) => {
      const target = prev.find((e) => e.id === extensionId);
      if (!target) return prev;

      addLogEntry('enable', target.id, target.name, 'Extension enabled by user');

      // If it's a theme, disable other themes and activate this one
      if (target.type === 'theme') {
        setActiveThemeId(target.id);
        return prev.map((e) => {
          if (e.id === extensionId) return { ...e, enabled: true };
          if (e.type === 'theme') return { ...e, enabled: false };
          return e;
        });
      }

      return prev.map((e) => (e.id === extensionId ? { ...e, enabled: true } : e));
    });
  }, []);

  // Disable an extension
  const disableExtension = useCallback((extensionId) => {
    setExtensions((prev) => {
      const target = prev.find((e) => e.id === extensionId);
      if (!target) return prev;

      addLogEntry('disable', target.id, target.name, 'Extension disabled by user');

      if (target.type === 'theme' && activeThemeId === target.id) {
        setActiveThemeId(null);
      }

      return prev.map((e) => (e.id === extensionId ? { ...e, enabled: false } : e));
    });
  }, [activeThemeId]);

  // Install a new extension
  const installExtension = useCallback((extensionData) => {
    const newExt = {
      id: extensionData.id || `ext_${Date.now()}`,
      name: extensionData.name || 'Custom Extension',
      version: extensionData.version || '1.0.0',
      author: extensionData.author || 'User',
      description: extensionData.description || 'Custom installed extension',
      category: extensionData.category || 'Tools',
      icon: extensionData.icon || 'Blocks',
      installed: true,
      enabled: false,
      builtIn: false,
      type: extensionData.type || 'tool',
      directory: extensionData.directory || `src/extensions/${extensionData.id}`,
      config: extensionData.config || {},
    };

    setExtensions((prev) => {
      const existing = prev.find((e) => e.id === newExt.id);
      if (existing) {
        return prev.map((e) => (e.id === newExt.id ? { ...newExt, installed: true, enabled: false } : e));
      }
      return [...prev, newExt];
    });

    addLogEntry('install', newExt.id, newExt.name, 'Installed extension package');
  }, []);

  // Delete an extension
  const deleteExtension = useCallback((extensionId) => {
    setExtensions((prev) => {
      const target = prev.find((e) => e.id === extensionId);
      if (!target) return prev;

      addLogEntry('delete', target.id, target.name, 'Extension uninstalled / deleted by user');

      if (target.type === 'theme' && activeThemeId === target.id) {
        setActiveThemeId(null);
      }

      return prev.filter((e) => e.id !== extensionId);
    });
  }, [activeThemeId]);

  // Clear all activity logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem(EXTENSIONS_LOGS_KEY);
  }, []);

  return (
    <ExtensionContext.Provider
      value={{
        extensions,
        logs,
        activeThemeId,
        setActiveThemeId,
        isExtensionActive,
        enableExtension,
        disableExtension,
        installExtension,
        deleteExtension,
        clearLogs,
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
};

export const useExtensions = () => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtensions must be used within an ExtensionProvider');
  }
  return context;
};
