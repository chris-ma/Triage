import type { ConditionScore, RawFeatures, SymptomSignal } from "./types";
import { DISEASE_MATRIX } from "./diseaseMatrix";

type IntakeData = Record<string, unknown>;

function evaluateSignal(intake: IntakeData, signal: SymptomSignal): number {
  const value = intake[signal.intakeField];
  switch (signal.operator) {
    case "truthy":
      return value ? 1 : 0;
    case "eq":
      return value === signal.matchValue ? 1 : 0;
    case "gte":
      return typeof value === "number" && value >= (signal.matchValue as number) ? 1 : 0;
    case "lte":
      return typeof value === "number" && value <= (signal.matchValue as number) ? 1 : 0;
    default:
      return 0;
  }
}

export function scoreConditions(
  features: RawFeatures,
  intake: IntakeData
): ConditionScore[] {
  const results: ConditionScore[] = [];

  for (const group of DISEASE_MATRIX) {
    // Visual scoring
    let visualWeightSum = 0;
    let visualScore = 0;
    const featuresMatched: string[] = [];

    for (const feature of group.visualFeatures) {
      const signal = features.visualSignals[feature.id] ?? 0;
      visualScore += signal * feature.weight;
      visualWeightSum += feature.weight;
      if (signal >= 0.50) {
        featuresMatched.push(feature.label);
      }
    }
    const normalizedVisual = visualWeightSum > 0 ? (visualScore / visualWeightSum) * 100 : 0;

    // Symptom scoring
    let symptomWeightSum = 0;
    let symptomScore = 0;
    const symptomsMatched: string[] = [];

    for (const signal of group.symptomSignals) {
      const match = evaluateSignal(intake, signal);
      symptomScore += match * signal.weight;
      symptomWeightSum += signal.weight;
      if (match > 0) {
        symptomsMatched.push(signal.intakeField);
      }
    }
    const normalizedSymptom = symptomWeightSum > 0 ? (symptomScore / symptomWeightSum) * 100 : 0;

    const combinedScore = normalizedVisual * 0.6 + normalizedSymptom * 0.4;

    if (combinedScore < group.minScoreToInclude) continue;

    const confidence =
      combinedScore >= 85 ? "high" : combinedScore >= 60 ? "moderate" : "indicative";

    results.push({
      groupId: group.id,
      label: group.label,
      matchScore: Math.round(combinedScore),
      confidence,
      showPercentage: combinedScore >= 85,
      featuresMatched,
      symptomsMatched,
      nextStep: group.nextStep,
      referral: group.referral,
      urgencyLevel: group.baseUrgency,
    });
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
