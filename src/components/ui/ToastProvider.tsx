'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  React.useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: any) => {
      showToast(String(message || ''), 'info');
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed bottom-6 right-6 z-[1000] flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const colorClass =
            toast.type === 'success'
              ? 'border-blue-300 bg-blue-50 text-blue-900'
              : toast.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-900'
              : 'border-blue-300 bg-blue-50 text-blue-900';

          return (
            <div
              key={toast.id}
              className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm ${colorClass}`}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
