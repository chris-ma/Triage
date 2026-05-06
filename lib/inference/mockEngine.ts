import type { MediaAsset, RawFeatures } from "./types";
import { DISEASE_MATRIX } from "./diseaseMatrix";

function seededRandom(seed: string, index: number): number {
  // Simple deterministic hash from sessionId + index
  let hash = 0;
  const str = seed + index.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

export async function extractFeatures(
  sessionId: string,
  assets: MediaAsset[]
): Promise<RawFeatures> {
  const assetTypes = new Set(assets.map((a) => a.asset_type));

  const facePhotoScore = assetTypes.has("photo_face") ? 0.85 + seededRandom(sessionId, 0) * 0.15 : 0;
  const flashPhotoScore =
    assetTypes.has("photo_flash_1") || assetTypes.has("photo_flash_2")
      ? 0.80 + seededRandom(sessionId, 1) * 0.20
      : 0;
  const scanVideoScore = assetTypes.has("video_scan") ? 0.75 + seededRandom(sessionId, 2) * 0.25 : 0;
  const speechVideoScore = assetTypes.has("video_speech") ? 0.70 + seededRandom(sessionId, 3) * 0.30 : 0;

  // Collect all visual feature IDs from the disease matrix
  const allFeatureIds = DISEASE_MATRIX.flatMap((g) => g.visualFeatures.map((f) => f.id));

  // Generate deterministic feature signals
  // Most features get low confidence (0.1-0.35); 1-2 per group get elevated (0.55-0.90)
  const visualSignals: Record<string, number> = {};

  allFeatureIds.forEach((featureId, idx) => {
    const base = seededRandom(sessionId, idx + 10);
    // Elevated signal for roughly 20% of features (seeded)
    const isElevated = seededRandom(sessionId, idx + 200) > 0.80;
    visualSignals[featureId] = isElevated
      ? 0.55 + base * 0.35
      : 0.05 + base * 0.30;
  });

  // Ensure at least one feature per group has an elevated signal for demo realism
  DISEASE_MATRIX.forEach((group, gIdx) => {
    const elevatedIdx = Math.floor(seededRandom(sessionId, gIdx + 100) * group.visualFeatures.length);
    const elevatedFeatureId = group.visualFeatures[elevatedIdx]?.id;
    if (elevatedFeatureId) {
      visualSignals[elevatedFeatureId] = 0.60 + seededRandom(sessionId, gIdx + 300) * 0.30;
    }
  });

  return {
    engineVersion: "mock-v1",
    isMock: true,
    extractedAt: new Date().toISOString(),
    visualSignals,
    faceQuality: { facePhotoScore, flashPhotoScore, scanVideoScore, speechVideoScore },
    motionEvents: {
      scanCompleted: assetTypes.has("video_scan"),
      speechDetected: assetTypes.has("video_speech"),
      asymmetryDetected: seededRandom(sessionId, 400) > 0.60,
    },
  };
}
