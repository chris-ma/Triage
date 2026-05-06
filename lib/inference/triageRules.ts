import type { ConditionScore, UrgencyLevel, UrgencyResult } from "./types";
import { DISEASE_MATRIX } from "./diseaseMatrix";

type IntakeData = Record<string, unknown>;

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  emergency: 4,
  urgent: 3,
  routine: 2,
  informational: 1,
};

function isHigherUrgency(a: UrgencyLevel, b: UrgencyLevel): boolean {
  return URGENCY_ORDER[a] > URGENCY_ORDER[b];
}

export function determineUrgency(
  scores: ConditionScore[],
  intake: IntakeData,
  visualSignals: Record<string, number>
): UrgencyResult {
  let level: UrgencyLevel = "informational";
  let reason = "No urgent findings detected.";
  const redFlags: string[] = [];

  // --- Intake-only emergency overrides (regardless of CV) ---
  if (intake.breathing_difficulty) {
    level = "emergency";
    reason = "Breathing difficulty reported — seek emergency care immediately.";
    redFlags.push("Breathing difficulty");
  }

  if (intake.is_sudden && intake.has_facial_drooping) {
    if (isHigherUrgency("emergency", level)) {
      level = "emergency";
      reason = "Sudden-onset facial drooping — emergency stroke screen required.";
    }
    redFlags.push("Sudden facial drooping (stroke rule-out required)");
  }

  if (typeof intake.pain_level === "number" && intake.pain_level >= 8) {
    if (isHigherUrgency("urgent", level)) {
      level = "urgent";
      reason = "Severe pain reported (≥8/10).";
    }
    redFlags.push("Severe pain level");
  }

  // --- Red flag rules from the disease matrix ---
  for (const group of DISEASE_MATRIX) {
    for (const flag of group.redFlags) {
      let visualMatches = false;
      let intakeMatches = false;

      if (flag.visualFeatureIds) {
        visualMatches = flag.visualFeatureIds.some(
          (fid) => (visualSignals[fid] ?? 0) >= 0.50
        );
      } else {
        visualMatches = true;
      }

      if (flag.intakeCondition) {
        const { field, operator, value } = flag.intakeCondition;
        const fieldValue = intake[field];
        intakeMatches =
          operator === "eq" ? fieldValue === value : Boolean(fieldValue);
      } else {
        intakeMatches = true;
      }

      if (visualMatches && intakeMatches) {
        if (isHigherUrgency(flag.urgencyLevel, level)) {
          level = flag.urgencyLevel;
          reason = flag.description;
        }
        redFlags.push(flag.description);
      }
    }
  }

  // --- Fall back to highest urgency from matched condition groups ---
  if (level === "informational" && scores.length > 0) {
    for (const score of scores) {
      if (isHigherUrgency(score.urgencyLevel, level)) {
        level = score.urgencyLevel;
        reason = `Based on matched pattern: ${score.label}.`;
      }
    }
  }

  if (redFlags.length === 0 && scores.length > 0) {
    reason = `Pattern analysis complete. ${scores.length} condition group(s) identified for review.`;
  }

  return { level, reason, redFlags: [...new Set(redFlags)] };
}
