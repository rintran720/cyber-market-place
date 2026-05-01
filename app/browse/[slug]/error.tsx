"use client";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function ItemError({ error, reset }: { error: Error; reset: () => void }) {
  const code = (error as { code?: string }).code ?? "UNKNOWN";
  const isNotFound = code === "NOT_FOUND";
  return (
    <div className="py-16">
      <ErrorState
        code={code}
        message={isNotFound ? "This weapon is not in the registry." : error.message}
        retry={isNotFound ? undefined : reset}
      />
      <div className="mt-6 text-center">
        <Link href="/browse" className="cp-btn cp-btn--ghost cp-btn--cyan">
          ‹ BACK TO ARSENAL
        </Link>
      </div>
    </div>
  );
}
