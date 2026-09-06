import React, { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../utils/idGenerator';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 3500 }) => {
    const id = generateId('toast');
    const newToast = { id, title, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastSuccess = useCallback((message, title = 'Success') => {
    return addToast({ title, message, type: 'success' });
  }, [addToast]);

  const toastError = useCallback((message, title = 'Error') => {
    return addToast({ title, message, type: 'error' });
  }, [addToast]);

  const toastInfo = useCallback((message, title = 'Info') => {
    return addToast({ title, message, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        toastSuccess,
        toastError,
        toastInfo,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
