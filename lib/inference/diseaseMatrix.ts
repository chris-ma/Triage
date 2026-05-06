import type { ConditionGroup } from "./types";

export const DISEASE_MATRIX: ConditionGroup[] = [
  {
    id: "facial-asymmetry",
    label: "Facial Asymmetry Concern",
    icd10Hint: "G51.0",
    visualFeatures: [
      { id: "asymmetric_nasolabial", label: "Asymmetric nasolabial folds", weight: 0.30 },
      { id: "unilateral_ptosis", label: "Unilateral eyelid droop", weight: 0.25 },
      { id: "mouth_corner_droop", label: "Mouth corner drooping", weight: 0.30 },
      { id: "forehead_wrinkle_loss", label: "Loss of forehead wrinkling on one side", weight: 0.15 },
    ],
    symptomSignals: [
      { intakeField: "has_facial_drooping", matchValue: true, operator: "truthy", weight: 0.40 },
      { intakeField: "onset_days", matchValue: 3, operator: "lte", weight: 0.15 },
      { intakeField: "is_sudden", matchValue: true, operator: "truthy", weight: 0.20 },
      { intakeField: "has_numbness", matchValue: true, operator: "truthy", weight: 0.15 },
    ],
    redFlags: [
      {
        description: "Sudden unilateral facial droop — stroke screen required",
        urgencyLevel: "emergency",
        visualFeatureIds: ["mouth_corner_droop", "asymmetric_nasolabial"],
        intakeCondition: { field: "is_sudden", operator: "eq", value: true },
      },
    ],
    baseUrgency: "urgent",
    nextStep: "Seek same-day neurological or emergency evaluation. Sudden facial drooping requires stroke rule-out.",
    referral: "Emergency / Neurology",
    minScoreToInclude: 25,
  },

  {
    id: "ophthalmic-orbital",
    label: "Ophthalmic / Orbital Findings",
    icd10Hint: "H02.4",
    visualFeatures: [
      { id: "ptosis_bilateral", label: "Bilateral eyelid drooping", weight: 0.35 },
      { id: "ptosis_unilateral", label: "Unilateral eyelid drooping", weight: 0.30 },
      { id: "lid_asymmetry", label: "Lid margin asymmetry", weight: 0.20 },
      { id: "periorbital_swelling", label: "Periorbital swelling", weight: 0.15 },
    ],
    symptomSignals: [
      { intakeField: "vision_changes", matchValue: true, operator: "truthy", weight: 0.30 },
      { intakeField: "has_swelling", matchValue: true, operator: "truthy", weight: 0.15 },
      { intakeField: "has_headache", matchValue: true, operator: "truthy", weight: 0.10 },
    ],
    redFlags: [
      {
        description: "Vision changes with periorbital swelling",
        urgencyLevel: "urgent",
        visualFeatureIds: ["periorbital_swelling"],
        intakeCondition: { field: "vision_changes", operator: "eq", value: true },
      },
    ],
    baseUrgency: "routine",
    nextStep: "Schedule ophthalmology consultation within 1–2 weeks. Urgent if vision changes are present.",
    referral: "Ophthalmology",
    minScoreToInclude: 20,
  },

  {
    id: "skin-pigmentation",
    label: "Skin & Pigmentation",
    icd10Hint: "L70",
    visualFeatures: [
      { id: "facial_erythema", label: "Facial redness / erythema", weight: 0.25 },
      { id: "papules_pustules", label: "Papules or pustules visible", weight: 0.25 },
      { id: "hyperpigmentation", label: "Areas of hyperpigmentation", weight: 0.25 },
      { id: "telangiectasia", label: "Visible dilated vessels", weight: 0.15 },
      { id: "skin_texture_change", label: "Textural skin irregularity", weight: 0.10 },
    ],
    symptomSignals: [
      { intakeField: "has_rash", matchValue: true, operator: "truthy", weight: 0.25 },
      { intakeField: "has_fever", matchValue: true, operator: "truthy", weight: 0.10 },
    ],
    redFlags: [],
    baseUrgency: "informational",
    nextStep: "Consult a dermatologist for assessment and a personalised treatment plan.",
    referral: "Dermatology",
    minScoreToInclude: 15,
  },

  {
    id: "endocrine-phenotype",
    label: "Endocrine Phenotype",
    icd10Hint: "E22.0",
    visualFeatures: [
      { id: "coarse_facial_features", label: "Coarsened facial features", weight: 0.30 },
      { id: "broad_nose", label: "Broadened nasal bridge", weight: 0.20 },
      { id: "prominent_brow", label: "Prominent supraorbital ridge", weight: 0.25 },
      { id: "jaw_prominence", label: "Prognathism / jaw prominence", weight: 0.25 },
    ],
    symptomSignals: [
      { intakeField: "has_headache", matchValue: true, operator: "truthy", weight: 0.20 },
      { intakeField: "vision_changes", matchValue: true, operator: "truthy", weight: 0.20 },
    ],
    redFlags: [
      {
        description: "Visual field changes with coarse features — pituitary involvement possible",
        urgencyLevel: "urgent",
        visualFeatureIds: ["coarse_facial_features", "prominent_brow"],
        intakeCondition: { field: "vision_changes", operator: "eq", value: true },
      },
    ],
    baseUrgency: "routine",
    nextStep: "Referral to endocrinology recommended. Baseline IGF-1 and pituitary MRI may be indicated.",
    referral: "Endocrinology",
    minScoreToInclude: 30,
  },

  {
    id: "dysmorphic-genetic",
    label: "Dysmorphic / Genetic Features",
    icd10Hint: "Q87",
    visualFeatures: [
      { id: "hypertelorism", label: "Wide-set eyes (hypertelorism)", weight: 0.25 },
      { id: "ear_morphology", label: "Unusual ear morphology", weight: 0.15 },
      { id: "philtrum_abnormal", label: "Abnormal philtrum", weight: 0.20 },
      { id: "epicanthal_folds", label: "Epicanthal folds", weight: 0.20 },
      { id: "midface_hypoplasia", label: "Midface hypoplasia", weight: 0.20 },
    ],
    symptomSignals: [
      { intakeField: "family_history_genetic", matchValue: true, operator: "truthy", weight: 0.30 },
      { intakeField: "developmental_concerns", matchValue: true, operator: "truthy", weight: 0.20 },
    ],
    redFlags: [],
    baseUrgency: "informational",
    nextStep: "Genetics counselling may be beneficial. Discuss with your GP for an appropriate referral pathway.",
    referral: "Clinical Genetics",
    minScoreToInclude: 20,
  },
];
