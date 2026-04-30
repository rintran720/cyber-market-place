"use client";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-container py-16">
      <ErrorState
        code={(error as { code?: string }).code ?? "FATAL"}
        message={error.message}
        retry={reset}
      />
    </div>
  );
}
