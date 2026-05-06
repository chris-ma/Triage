"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/shared/SessionContext";
import { Button } from "@/components/ui/button";

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

    // Cycle status messages while waiting
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="max-w-sm w-full text-center space-y-6">
        {!error ? (
          <>
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Analysing your captures</h2>
              <p className="text-sm text-muted-foreground min-h-[1.5rem] transition-all">
                {STEPS[stepIndex]}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">This usually takes 10–20 seconds.</p>
          </>
        ) : (
          <>
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()}>Try again</Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Start over
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
