import type { ConditionScore } from "@/lib/inference/types";

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  moderate: "Moderate — needs review",
  indicative: "Indicative only",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-gray-900",
  moderate: "text-gray-500",
  indicative: "text-gray-400",
};

export function ConditionCard({ score }: { score: ConditionScore }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-gray-900 leading-snug">{score.label}</h3>
        <span className={`text-xs flex-shrink-0 ${CONFIDENCE_COLORS[score.confidence]}`}>
          {CONFIDENCE_LABELS[score.confidence]}
        </span>
      </div>

      {score.showPercentage && (
        <p className="text-3xl font-light text-gray-900">
          {score.matchScore}
          <span className="text-sm text-gray-400 ml-1">% pattern match</span>
        </p>
      )}

      {score.featuresMatched.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
            Observed features
          </p>
          <ul className="space-y-1">
            {score.featuresMatched.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                <span className="h-1 w-1 rounded-full bg-gray-300 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-50 pt-4">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">
          Recommended next step
        </p>
        <p className="text-sm text-gray-600">{score.nextStep}</p>
        <p className="text-xs text-gray-400 mt-0.5">Referral: {score.referral}</p>
      </div>

      <p className="text-xs text-gray-300 italic">
        Pattern match only — clinical verification required.
      </p>
    </div>
  );
}
