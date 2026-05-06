import { z } from "zod";

export const detailsSchema = z.object({
  age: z.number().int().min(1).max(120),
  sex: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  chief_complaint: z.string().min(5).max(500),
  onset_days: z.number().int().min(0).max(3650),
  is_sudden: z.boolean(),
});

export const intakeSchema = z.object({
  // Pain
  pain_level: z.number().min(0).max(10),

  // Facial
  has_facial_drooping: z.boolean(),
  drooping_side: z.enum(["left", "right", "both"]).optional(),

  // Swelling
  has_swelling: z.boolean(),
  swelling_location: z.string().max(200).optional(),

  // Skin
  has_rash: z.boolean(),
  rash_description: z.string().max(300).optional(),

  // Systemic
  has_fever: z.boolean(),
  fever_celsius: z.number().min(35).max(43).optional(),

  // Vision
  vision_changes: z.boolean(),
  vision_description: z.string().max(300).optional(),

  // Neurological
  breathing_difficulty: z.boolean(),
  has_numbness: z.boolean(),
  numbness_location: z.string().max(200).optional(),
  has_headache: z.boolean(),
  headache_severity: z.number().min(0).max(10).optional(),

  // History
  recent_illness: z.string().max(300).optional(),
  family_history_genetic: z.boolean(),
  developmental_concerns: z.boolean(),
  medical_history: z.array(z.string()),
  current_medications: z.string().max(500).optional(),
});

export const fullIntakeSchema = detailsSchema.merge(intakeSchema);

export type DetailsData = z.infer<typeof detailsSchema>;
export type IntakeData = z.infer<typeof intakeSchema>;
export type FullIntakeData = z.infer<typeof fullIntakeSchema>;
