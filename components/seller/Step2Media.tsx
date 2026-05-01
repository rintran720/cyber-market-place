"use client";

import { useState } from "react";

type Draft = {
  name: string;
  imageUrl: string;
  tags: string[];
};

type Props = {
  value: Draft;
  onChange: (next: Draft) => void;
  onNext: () => void;
  onBack: () => void;
};

const PRESET_IMAGES = [
  "/items/starter-blade.svg",
  "/items/lotus-cestus.svg",
  "/items/sandalwood-sling.svg",
  "/items/feather-of-maat.svg",
  "/items/scarab-shuriken.svg",
];

export function Step2Media({ value, onChange, onNext, onBack }: Props) {
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || value.tags.includes(t)) return;
    onChange({ ...value, tags: [...value.tags, t] });
    setTagDraft("");
  };

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Name &amp; media</h2>

      <label className="cp-field mt-6 block">
        <span className="cp-field__label">// WEAPON NAME</span>
        <input
          className="cp-input cp-input--cut cp-input--cyan"
          type="text"
          maxLength={40}
          placeholder="MJOLNIR.exe"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>

      <div className="mt-6">
        <span className="cp-field__label">// IMAGE</span>
        <div className="flex flex-wrap gap-3 mt-2">
          {PRESET_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange({ ...value, imageUrl: src })}
              className={`w-20 h-20 border ${
                value.imageUrl === src ? "border-cp-cyan-500 shadow-cp-glow-cyan" : "border-cp-border"
              }`}
              aria-label={`Use ${src}`}
              style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          ))}
        </div>
        <input
          type="text"
          className="cp-input cp-input--cut mt-3"
          placeholder="Or paste image URL/path..."
          value={value.imageUrl}
          onChange={(e) => onChange({ ...value, imageUrl: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <span className="cp-field__label">// TAGS</span>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="cp-input cp-input--cut flex-1"
            placeholder="lightning, hammer, norse..."
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button onClick={addTag} className="cp-btn cp-btn--ghost cp-btn--sm">+ ADD</button>
        </div>
        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {value.tags.map((t) => (
              <span key={t} className="cp-chip cp-chip--cyan flex items-center gap-1">
                {t}
                <button onClick={() => onChange({ ...value, tags: value.tags.filter((x) => x !== t) })} aria-label={`Remove tag ${t}`}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="cp-btn cp-btn--ghost">‹ BACK</button>
        <button
          onClick={onNext}
          disabled={!value.name || !value.imageUrl}
          className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40"
        >
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
