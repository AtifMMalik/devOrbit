import { useEffect } from 'react';

/**
 * Global keyboard shortcuts listener (e.g. Cmd/Ctrl + K for search)
 */
export const useKeyboardShortcuts = ({ onToggleSearch, onEscape }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onToggleSearch) onToggleSearch();
      }

      // Escape to close modals or search
      if (e.key === 'Escape') {
        if (onEscape) onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSearch, onEscape]);
};
