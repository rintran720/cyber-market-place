"use client";

import { useEffect, useState } from "react";

const KEY = "cp-glow-pref";

type Pref = "on" | "off";

export function readGlowPref(): Pref {
  if (typeof localStorage === "undefined") return "on";
  return localStorage.getItem(KEY) === "off" ? "off" : "on";
}

export function writeGlowPref(v: Pref): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, v);
}

function applyDom(v: Pref): void {
  if (typeof document === "undefined") return;
  if (v === "off") document.documentElement.setAttribute("data-cp-glow", "off");
  else document.documentElement.removeAttribute("data-cp-glow");
}

export function GlowToggle() {
  const [pref, setPref] = useState<Pref>("on");

  useEffect(() => {
    const v = readGlowPref();
    setPref(v);
    applyDom(v);
  }, []);

  const flip = () => {
    const next: Pref = pref === "on" ? "off" : "on";
    setPref(next);
    writeGlowPref(next);
    applyDom(next);
  };

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={pref === "on"}
      aria-label={`Glow effects ${pref === "on" ? "on" : "off"}`}
      title={`Glow ${pref === "on" ? "ON" : "OFF"} — click to toggle`}
      className="cp-chip cp-chip--cyan font-cp-mono text-xs hover:brightness-125"
    >
      ⚡ {pref === "on" ? "ON" : "OFF"}
    </button>
  );
}
