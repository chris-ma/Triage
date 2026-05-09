"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/shared/SessionContext";
import { UrgencyBanner } from "@/components/results/UrgencyBanner";
import { ConditionCard } from "@/components/results/ConditionCard";
import type { UrgencyLevel, ConditionScore } from "@/lib/inference/types";

interface AnalysisResult {
  urgencyLevel: UrgencyLevel;
  urgencyReason: string;
  redFlags: string[];
  conditionGroups: ConditionScore[];
  cached?: boolean;
}

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { router.push("/consent"); return; }
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load results");
        return res.json();
      })
      .then(setResult)
      .catch(() => setError("Could not load results. Please try again."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafaf9" }}>
        <div className="w-8 h-8 rounded-full border border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#fafaf9" }}>
        <div className="text-center space-y-4">
          <p className="text-gray-400 text-sm">{error ?? "No results found."}</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-gray-200 px-6 py-2.5 text-sm text-gray-500 hover:border-gray-400 transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#fafaf9" }}>
      <div className="max-w-lg mx-auto px-5 py-10 space-y-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400 mb-2">Step 7 of 7</p>
          <h1 className="text-2xl font-light text-gray-900">Your triage results</h1>
          <p className="text-sm text-gray-400 mt-1.5">
            Based on visual pattern analysis and your symptom answers. Not a diagnosis.
          </p>
        </div>

        <UrgencyBanner
          level={result.urgencyLevel}
          reason={result.urgencyReason}
          redFlags={result.redFlags}
        />

        {result.conditionGroups.length > 0 ? (
          <div className="space-y-4">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">
              Pattern matches ({result.conditionGroups.length})
            </p>
            {result.conditionGroups.map((score) => (
              <ConditionCard key={score.groupId} score={score} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No specific pattern matches identified. If you have ongoing concerns, see your GP.
          </p>
        )}

        <p className="text-[11px] text-gray-300 text-center">
          Demo mode — results from mock engine. Real CV models in Phase 2.
        </p>

        <button
          className="w-full rounded-full bg-gray-900 py-3.5 text-sm text-white hover:bg-gray-700 transition-colors"
          onClick={() => router.push("/summary")}
        >
          Generate doctor summary
        </button>

        <p className="text-xs text-gray-400 text-center">
          A structured note you can take to your GP or specialist.
        </p>
      </div>
    </div>
  );
}
