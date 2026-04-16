import { createContext, useEffect, useMemo, useState } from "react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const value = useMemo(
    () => ({
      showToast(message, variant = "success") {
        setToast({
          id: Date.now(),
          message,
          variant,
        });
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="app-toast-region" role="status" aria-live="polite">
          <div className={`app-toast app-toast-${toast.variant}`}>{toast.message}</div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}
