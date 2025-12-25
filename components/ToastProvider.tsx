"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import clsx from "clsx";

export type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ToastContextValue = {
  pushToast: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "rounded-lg px-4 py-3 text-sm shadow-lg",
              toast.type === "error" && "bg-red-500 text-white",
              toast.type === "success" && "bg-emerald-500 text-white",
              toast.type === "info" && "bg-slate-900 text-white"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
