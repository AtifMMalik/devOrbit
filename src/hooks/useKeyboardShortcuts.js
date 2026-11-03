import { useEffect } from 'react';

/**
 * Global keyboard shortcuts listener for devOrbit.
 *
 * Supported shortcuts:
 * - Search: Cmd/Ctrl + F, Cmd/Ctrl + K, Alt/Option + F, or '/' (when not typing)
 * - Save Changes: Cmd/Ctrl + S, Alt/Option + S (works everywhere, including inside text inputs)
 * - New Task: Cmd/Ctrl + N, Alt/Option + N, or 'n' / 'c' (when not typing)
 * - New Project: Cmd/Ctrl + Shift + N, Alt/Option + Shift + N, or 'p' (when not typing)
 * - Toggle Sidebar: Cmd/Ctrl + T, Alt/Option + T, Cmd/Ctrl + B, Alt/Option + B, or '[' (when not typing)
 * - Undo: Cmd/Ctrl + Z, Alt/Option + Z, or 'u' (when not typing)
 * - Redo: Cmd/Ctrl + Y, Cmd/Ctrl + Shift + Z, Alt/Option + Y, or 'r' (when not typing)
 * - Escape: Close modals, blur inputs, reset search
 */
export const useKeyboardShortcuts = ({
  onToggleSearch,
  onNewTask,
  onNewProject,
  onToggleSidebar,
  onUndo,
  onRedo,
  onSave,
  onEscape,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      // Check if typing inside any form input, textarea, or contentEditable
      const target = e.target;
      const isTextInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          Boolean(target.closest?.('input, textarea, [contenteditable="true"]')));

      // 1. Save Changes: Cmd/Ctrl + S or Alt/Option + S
      // Operates globally, including inside textareas/inputs, suppressing browser HTML save dialog
      if ((isCmdOrCtrl || isAlt) && (code === 'KeyS' || key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        if (onSave) onSave();
        window.dispatchEvent(new CustomEvent('devorbit:save'));
        return;
      }

      // 2. Search: Cmd/Ctrl + F, Cmd/Ctrl + K, Alt + F, or '/' (when not in text input)
      if (
        (isCmdOrCtrl && (code === 'KeyF' || key === 'f' || code === 'KeyK' || key === 'k')) ||
        (isAlt && (code === 'KeyF' || key === 'f')) ||
        (!isTextInput && !isCmdOrCtrl && !isAlt && key === '/')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleSearch) onToggleSearch();
        return;
      }

      // 3. Escape: close modals / dismiss search
      if (e.key === 'Escape' || code === 'Escape') {
        if (onEscape) onEscape();
        return;
      }

      // 4. Redo:
      // - Cmd/Ctrl + Y
      // - Cmd/Ctrl + Shift + Z
      // - Alt/Option + Y
      // - 'r' single-key when not typing
      const isRedoCombo =
        (!isTextInput && (
          (isCmdOrCtrl && !isShift && (code === 'KeyY' || key === 'y')) ||
          (isCmdOrCtrl && isShift && (code === 'KeyZ' || key === 'z')) ||
          (isAlt && (code === 'KeyY' || key === 'y')) ||
          (!isCmdOrCtrl && !isAlt && !isShift && (code === 'KeyR' || key === 'r'))
        ));

      if (isRedoCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (onRedo) onRedo();
        return;
      }

      // 5. Undo:
      // - Cmd/Ctrl + Z (when not in text input and not shift)
      // - Alt/Option + Z
      // - 'u' single-key when not typing
      const isUndoCombo =
        (!isTextInput && !isShift && (
          (isCmdOrCtrl && (code === 'KeyZ' || key === 'z')) ||
          (isAlt && (code === 'KeyZ' || key === 'z')) ||
          (!isCmdOrCtrl && !isAlt && (code === 'KeyU' || key === 'u'))
        ));

      if (isUndoCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (onUndo) onUndo();
        return;
      }

      // 6. New Project:
      // - Cmd/Ctrl + Shift + N
      // - Alt/Option + Shift + N (⌥⇧N)
      // - 'p' single-key when not typing
      const isNewProjectCombo =
        (isCmdOrCtrl && isShift && (code === 'KeyN' || key === 'n')) ||
        (isAlt && isShift && (code === 'KeyN' || key === 'n')) ||
        (!isTextInput && !isCmdOrCtrl && !isAlt && !isShift && (code === 'KeyP' || key === 'p'));

      if (isNewProjectCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (onNewProject) onNewProject();
        return;
      }

      // 7. New Task:
      // - Cmd/Ctrl + N
      // - Alt/Option + N (⌥N)
      // - 'n' or 'c' single-key when not typing
      const isNewTaskCombo =
        (isCmdOrCtrl && !isShift && (code === 'KeyN' || key === 'n')) ||
        (isAlt && !isShift && (code === 'KeyN' || key === 'n')) ||
        (!isTextInput && !isCmdOrCtrl && !isAlt && !isShift && (code === 'KeyN' || key === 'n' || code === 'KeyC' || key === 'c'));

      if (isNewTaskCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (onNewTask) onNewTask();
        return;
      }

      // 8. Toggle Sidebar:
      // - Cmd/Ctrl + T, Alt/Option + T (⌥T)
      // - Cmd/Ctrl + B, Alt/Option + B (VS Code standard)
      // - '[' single-key when not typing
      const isToggleSidebarCombo =
        (isCmdOrCtrl && (code === 'KeyT' || key === 't' || code === 'KeyB' || key === 'b')) ||
        (isAlt && (code === 'KeyT' || key === 't' || code === 'KeyB' || key === 'b')) ||
        (!isTextInput && !isCmdOrCtrl && !isAlt && !isShift && (code === 'BracketLeft' || key === '['));

      if (isToggleSidebarCombo) {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleSidebar) onToggleSidebar();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onToggleSearch, onNewTask, onNewProject, onToggleSidebar, onUndo, onRedo, onSave, onEscape]);
};
