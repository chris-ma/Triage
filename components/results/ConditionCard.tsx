import type { ConditionScore } from "@/lib/inference/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High confidence",
  moderate: "Moderate — needs review",
  indicative: "Indicative only",
};

export function ConditionCard({ score }: { score: ConditionScore }) {
  const confidenceVariant = score.confidence as "high" | "moderate" | "indicative";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold leading-snug">{score.label}</CardTitle>
          <Badge variant={confidenceVariant} className="flex-shrink-0">
            {CONFIDENCE_LABELS[score.confidence]}
          </Badge>
        </div>
        {score.showPercentage && (
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {score.matchScore}%{" "}
            <span className="text-sm font-normal text-muted-foreground">pattern match</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {score.featuresMatched.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Observed features
            </p>
            <ul className="space-y-1">
              {score.featuresMatched.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Recommended next step
          </p>
          <p className="text-sm">{score.nextStep}</p>
          <p className="text-xs text-muted-foreground mt-1">Referral: {score.referral}</p>
        </div>

        <p className="text-xs text-muted-foreground italic">
          This is a pattern match, not a diagnosis. Clinical verification required.
        </p>
      </CardContent>
    </Card>
  );
}
