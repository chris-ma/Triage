export type ConfidenceLabel = "high" | "moderate" | "indicative";
export type UrgencyLevel = "emergency" | "urgent" | "routine" | "informational";
export type AssetType =
  | "photo_face"
  | "photo_flash_1"
  | "photo_flash_2"
  | "photo_flash_3"
  | "video_scan"
  | "video_speech";

export interface VisualFeature {
  id: string;
  label: string;
  weight: number;
}

export interface SymptomSignal {
  intakeField: string;
  matchValue: unknown;
  operator: "eq" | "gte" | "lte" | "truthy";
  weight: number;
}

export interface RedFlagRule {
  description: string;
  urgencyLevel: UrgencyLevel;
  visualFeatureIds?: string[];
  intakeCondition?: { field: string; operator: string; value: unknown };
}

export interface ConditionGroup {
  id: string;
  label: string;
  icd10Hint: string;
  visualFeatures: VisualFeature[];
  symptomSignals: SymptomSignal[];
  redFlags: RedFlagRule[];
  baseUrgency: UrgencyLevel;
  nextStep: string;
  referral: string;
  minScoreToInclude: number;
}

export interface RawFeatures {
  engineVersion: string;
  isMock: boolean;
  extractedAt: string;
  visualSignals: Record<string, number>;
  faceQuality: {
    facePhotoScore: number;
    flashPhotoScore: number;
    scanVideoScore: number;
    speechVideoScore: number;
  };
  motionEvents: {
    scanCompleted: boolean;
    speechDetected: boolean;
    asymmetryDetected: boolean;
  };
}

export interface ConditionScore {
  groupId: string;
  label: string;
  matchScore: number;
  confidence: ConfidenceLabel;
  showPercentage: boolean;
  featuresMatched: string[];
  symptomsMatched: string[];
  nextStep: string;
  referral: string;
  urgencyLevel: UrgencyLevel;
}

export interface UrgencyResult {
  level: UrgencyLevel;
  reason: string;
  redFlags: string[];
}

export interface MediaAsset {
  id: string;
  asset_type: AssetType;
  storage_path: string;
  mime_type: string;
}
