import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({ notify: () => {} });

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = 'info', timeout = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2000 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`card card-hover`} style={{ padding: '10px 14px', borderLeft: `4px solid ${t.type === 'error' ? '#dc3545' : t.type === 'success' ? '#28a745' : '#0062E6'}`}}>
            <div style={{ fontWeight: 600, marginBottom: 2, textTransform: 'capitalize' }}>{t.type}</div>
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);