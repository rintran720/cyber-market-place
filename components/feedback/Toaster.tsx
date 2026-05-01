"use client";

import { useEffect, useState } from "react";

type Tone = "success" | "info" | "warning" | "danger";
type Toast = { id: number; tone: Tone; title?: string; message: string };

let nextId = 1;
const subs = new Set<(t: Toast) => void>();

export function pushToast(t: Omit<Toast, "id">) {
  const toast = { ...t, id: nextId++ };
  for (const fn of subs) fn(toast);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4500);
    };
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80" role="log" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`cp-toast cp-toast--${t.tone}`}
          role="status"
          style={{ animation: "cm-modal-in 280ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div className="cp-toast__icon">{t.tone === "success" ? "✓" : t.tone === "danger" ? "!" : "▣"}</div>
          <div className="cp-toast__body">
            {t.title && <p className="cp-toast__title">{t.title}</p>}
            <p>{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
