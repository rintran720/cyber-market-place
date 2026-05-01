"use client";

import { useEffect, useState } from "react";

type Line = { text: string; tone?: "ok" | "warn" | "err" };

export function CheckoutTerminal({
  lines,
  onComplete,
  finalTxHash,
}: {
  lines: string[];
  onComplete?: () => void;
  finalTxHash?: string;
}) {
  const [shown, setShown] = useState<Line[]>([]);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= lines.length) {
        if (finalTxHash) {
          setShown((prev) => [...prev, { text: `> tx confirmed: ${finalTxHash}`, tone: "ok" }]);
        }
        onComplete?.();
        return;
      }
      setShown((prev) => [...prev, { text: lines[i] }]);
      i++;
      setTimeout(tick, 280 + Math.random() * 220);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [lines, finalTxHash, onComplete]);

  return (
    <div className="cp-terminal cp-terminal--green cp-terminal--scanlines">
      <div className="cp-terminal__header">
        <span className="cp-terminal__dots"><i /><i /><i /></span>
        <span className="cp-terminal__title">root@nightcity ~ %</span>
      </div>
      <div className="cp-terminal__body">
        {shown.map((l, i) => (
          <div
            key={i}
            className={`cp-terminal__line ${
              l.tone === "ok" ? "cp-terminal__line--ok" : l.tone === "err" ? "cp-terminal__line--err" : "cp-terminal__line--cmd"
            }`}
          >
            {l.text}
          </div>
        ))}
        <div className="cp-terminal__caret" aria-hidden>▌</div>
      </div>
    </div>
  );
}
