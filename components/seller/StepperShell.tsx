"use client";

import type { ReactNode } from "react";

type Props = {
  steps: string[];
  current: number;
  children: ReactNode;
};

export function StepperShell({ steps, current, children }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ol className="flex flex-wrap items-center gap-3 text-xs font-cp-mono">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${
              i === current ? "text-cp-cyan-500" : i < current ? "text-cp-green-500" : "text-cp-fg-muted"
            }`}
          >
            <span
              className={`w-7 h-7 grid place-items-center border ${
                i < current
                  ? "border-cp-green-500"
                  : i === current
                    ? "border-cp-cyan-500"
                    : "border-cp-border"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="uppercase tracking-widest">{s}</span>
            {i < steps.length - 1 && <span className="w-8 h-px bg-cp-border" />}
          </li>
        ))}
      </ol>
      <div>{children}</div>
    </div>
  );
}
