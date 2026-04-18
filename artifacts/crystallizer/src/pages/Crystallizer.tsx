"use client";

import { useState, useRef, useCallback, useId } from "react";

interface ObjectiveOutput {
  maximize: string;
  must_not_break: string;
  success_criterion: string;
}

type CrystallizerResult =
  | { status: "ok"; objective: ObjectiveOutput }
  | { status: "clarify"; question: string }
  | null;

type FieldKey = "maximize" | "must_not_break" | "success_criterion";

const FIELD_LABELS: Record<FieldKey, string> = {
  maximize: "OBJECTIVE",
  must_not_break: "CONSTRAINT",
  success_criterion: "YOU PASS WHEN",
};

function getSessionId(): string {
  const key = "_crystallizer_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

function logEdit(field: FieldKey, edited: boolean): void {
  fetch("/api/log-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getSessionId(),
      field,
      edited,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {});
}

interface EditableFieldProps {
  label: string;
  originalValue: string;
  fieldKey: FieldKey;
}

function EditableField({ label, originalValue, fieldKey }: EditableFieldProps) {
  const [value, setValue] = useState(originalValue);
  const hasLoggedRef = useRef(false);
  const id = useId();

  const handleBlur = useCallback(() => {
    if (!hasLoggedRef.current) {
      const edited = value.trim() !== originalValue.trim();
      logEdit(fieldKey, edited);
      hasLoggedRef.current = true;
    }
  }, [value, originalValue, fieldKey]);

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1.5 uppercase"
      >
        {label}
      </label>
      <div
        id={id}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onInput={(e) => setValue((e.target as HTMLDivElement).textContent ?? "")}
        className="text-base leading-relaxed text-[hsl(var(--foreground))] outline-none cursor-text min-h-[1.5em] focus:underline focus:decoration-dotted focus:underline-offset-4 focus:decoration-[hsl(var(--muted-foreground))]"
      >
        {originalValue}
      </div>
    </div>
  );
}

export default function Crystallizer() {
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrystallizerResult>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/crystallize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: intent.trim() }),
      });

      if (!res.ok && res.status !== 200) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as CrystallizerResult;
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[hsl(var(--muted-foreground))] uppercase mb-3">
              WEDGE · Strategic Translator
            </p>
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))] leading-snug">
              What do you intend to teach today?
            </h1>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mb-10">
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={4}
              disabled={loading}
              className="w-full resize-none bg-white border border-[hsl(var(--border))] rounded-md px-4 py-3 text-[hsl(var(--foreground))] text-base leading-relaxed placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
              aria-label="Describe your teaching intent"
            />

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!intent.trim() || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-current"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Crystallizing
                  </>
                ) : (
                  "Crystallize"
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Clarifying question */}
          {result?.status === "clarify" && (
            <div className="border border-[hsl(var(--border))] rounded-md px-6 py-5 bg-[hsl(var(--muted))]">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-[hsl(var(--muted-foreground))] uppercase mb-2">
                ONE THING NEEDED
              </p>
              <p className="text-base leading-relaxed text-[hsl(var(--foreground))]">
                {result.question}
              </p>
            </div>
          )}

          {/* Objective output */}
          {result?.status === "ok" && (
            <div className="border border-[hsl(var(--border))] rounded-md bg-white divide-y divide-[hsl(var(--border))]">
              {(["maximize", "must_not_break", "success_criterion"] as FieldKey[]).map(
                (key) => (
                  <div key={key} className="px-6 py-5">
                    <EditableField
                      label={FIELD_LABELS[key]}
                      originalValue={result.objective[key]}
                      fieldKey={key}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
