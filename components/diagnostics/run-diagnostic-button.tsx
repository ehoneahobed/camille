"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type RunDiagnosticButtonProps = {
  sessionId: string;
  disabled?: boolean;
  title?: string;
  className?: string;
};

/**
 * Queues `POST /api/sessions/[id]/diagnose` and sends the user to the diagnostic results page.
 */
export function RunDiagnosticButton({
  sessionId,
  disabled = false,
  title,
  className,
}: RunDiagnosticButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/diagnose`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok && res.status !== 202) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }
      router.push(`/sessions/${sessionId}/diagnostic`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }, [router, sessionId]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={disabled || pending}
        title={title}
        onClick={() => void run()}
        className={
          className ??
          "inline-flex justify-center bg-ink px-6 py-2.5 text-sm font-medium text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {pending ? "Starting…" : "Run diagnostic"}
      </button>
      {error ? <p className="text-sm text-wine">{error}</p> : null}
    </div>
  );
}
