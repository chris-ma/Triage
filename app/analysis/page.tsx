"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/shared/SessionContext";

const STEPS = [
  "Extracting facial features…",
  "Analysing skin colour patterns…",
  "Measuring facial asymmetry from scan…",
  "Evaluating speech and motion signals…",
  "Matching symptom patterns…",
  "Applying triage rules…",
  "Preparing your results…",
];

export default function AnalysisPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { router.push("/consent"); return; }

    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 900);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        clearInterval(interval);
        if (!res.ok) throw new Error("Analysis failed");
        router.push("/results");
      })
      .catch(() => {
        clearInterval(interval);
        setError("Analysis encountered an error. Please try again or contact a doctor directly.");
      });

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#fafaf9" }}>
      <div className="max-w-sm w-full text-center space-y-8">
        {!error ? (
          <>
            <div className="w-10 h-10 mx-auto rounded-full border border-gray-200 border-t-gray-900 animate-spin" />
            <div>
              <h2 className="text-xl font-light text-gray-900 mb-2">Analysing your captures</h2>
              <p className="text-sm text-gray-400 min-h-[1.5rem] transition-all">
                {STEPS[stepIndex]}
              </p>
            </div>
            <p className="text-xs text-gray-300">This usually takes 10–20 seconds.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-light text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-400">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-gray-900 py-3 text-sm text-white hover:bg-gray-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-full border border-gray-200 py-3 text-sm text-gray-500 hover:border-gray-400 transition-colors"
              >
                Start over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
