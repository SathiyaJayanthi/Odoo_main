import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const toneMap = {
  success:
    "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  error:
    "border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  info: "border-slate-200 bg-white text-slate-700",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((previous) => [...previous, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${toneMap[toast.type] || toneMap.info}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
