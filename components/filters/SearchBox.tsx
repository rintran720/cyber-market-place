"use client";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  debounceMs?: number;
};

export function SearchBox({ value, onChange, debounceMs = 300 }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceMs]);

  return (
    <label className="cp-field">
      <span className="cp-field__label">SEARCH</span>
      <input
        className="cp-input cp-input--cut cp-input--cyan"
        type="search"
        placeholder="mjolnir, norse, ..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </label>
  );
}
