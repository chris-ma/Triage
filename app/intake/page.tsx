"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { intakeSchema, type IntakeData } from "@/lib/validation/intakeSchema";
import { useSession } from "@/components/shared/SessionContext";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const MEDICAL_HISTORY_OPTIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hypertension", label: "High blood pressure" },
  { value: "thyroid", label: "Thyroid condition" },
  { value: "autoimmune", label: "Autoimmune condition" },
  { value: "neurological", label: "Neurological condition" },
  { value: "genetic_condition", label: "Known genetic condition" },
  { value: "stroke_history", label: "Previous stroke or TIA" },
];

function YesNo({
  label,
  fieldName,
  onChange,
}: {
  label: string;
  fieldName: string;
  onChange: (val: boolean) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-4 mt-1.5">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="radio" name={fieldName} value="true" onChange={() => onChange(true)} />
          Yes
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input type="radio" name={fieldName} value="false" onChange={() => onChange(false)} defaultChecked />
          No
        </label>
      </div>
    </div>
  );
}

export default function IntakePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(false);
  const [drooping, setDrooping] = useState(false);
  const [visionChanges, setVisionChanges] = useState(false);
  const [visionDesc, setVisionDesc] = useState("");
  const [droopingSide, setDroopingSide] = useState<"left" | "right" | "both" | undefined>();
  const [painLevel, setPainLevel] = useState(0);
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [fieldValues, setFieldValues] = useState<Partial<IntakeData>>({
    has_facial_drooping: false,
    has_swelling: false,
    has_rash: false,
    has_fever: false,
    vision_changes: false,
    breathing_difficulty: false,
    has_numbness: false,
    has_headache: false,
    family_history_genetic: false,
    developmental_concerns: false,
  });

  function setField(key: keyof IntakeData, value: boolean) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleHistory(value: string) {
    setSelectedHistory((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) { router.push("/consent"); return; }
    setLoading(true);

    const data: IntakeData = {
      ...fieldValues as IntakeData,
      pain_level: painLevel,
      has_facial_drooping: drooping,
      drooping_side: droopingSide,
      vision_changes: visionChanges,
      vision_description: visionChanges ? visionDesc : undefined,
      medical_history: selectedHistory,
      current_medications: medications || undefined,
    };

    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        intake_data: data,
        status: "captured",
      }),
    });
    setLoading(false);
    router.push("/analysis");
  }

  return (
    <StepLayout step={6} totalSteps={7} title="Symptom questions" subtitle="Answer as accurately as you can. This helps improve triage quality.">
      <form onSubmit={onSubmit} className="space-y-6 pb-8">
        {/* Pain */}
        <div>
          <Label>Pain level (0 = none, 10 = severe)</Label>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-muted-foreground w-4">0</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={painLevel}
              onChange={(e) => setPainLevel(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-4">10</span>
            <span className="font-semibold text-lg w-8 text-center">{painLevel}</span>
          </div>
        </div>

        <YesNo label="Any facial drooping or weakness?" fieldName="has_facial_drooping" onChange={(v) => { setDrooping(v); setField("has_facial_drooping", v); }} />
        {drooping && (
          <div>
            <Label>Which side?</Label>
            <div className="flex gap-4 mt-1.5">
              {(["left", "right", "both"] as const).map((side) => (
                <label key={side} className="flex items-center gap-2 cursor-pointer text-sm capitalize">
                  <input type="radio" name="drooping_side" value={side} onChange={() => setDroopingSide(side)} />
                  {side}
                </label>
              ))}
            </div>
          </div>
        )}

        <YesNo label="Any changes to your vision?" fieldName="vision_changes" onChange={(v) => { setVisionChanges(v); setField("vision_changes", v); }} />
        {visionChanges && (
          <div>
            <Label htmlFor="vision_desc">Describe the vision change</Label>
            <Textarea id="vision_desc" value={visionDesc} onChange={(e) => setVisionDesc(e.target.value)} placeholder="e.g. blurry, double vision, loss of peripheral vision…" className="mt-1" />
          </div>
        )}

        <YesNo label="Any swelling on your face?" fieldName="has_swelling" onChange={(v) => setField("has_swelling", v)} />
        <YesNo label="Any rash or skin changes?" fieldName="has_rash" onChange={(v) => setField("has_rash", v)} />
        <YesNo label="Do you have a fever?" fieldName="has_fever" onChange={(v) => setField("has_fever", v)} />
        <YesNo label="Any difficulty breathing?" fieldName="breathing_difficulty" onChange={(v) => setField("breathing_difficulty", v)} />
        <YesNo label="Any numbness or tingling?" fieldName="has_numbness" onChange={(v) => setField("has_numbness", v)} />
        <YesNo label="Do you have a headache?" fieldName="has_headache" onChange={(v) => setField("has_headache", v)} />
        <YesNo label="Family history of genetic conditions?" fieldName="family_history_genetic" onChange={(v) => setField("family_history_genetic", v)} />
        <YesNo label="Any developmental or learning concerns?" fieldName="developmental_concerns" onChange={(v) => setField("developmental_concerns", v)} />

        <div>
          <Label>Relevant medical history (tick all that apply)</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {MEDICAL_HISTORY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedHistory.includes(opt.value)}
                  onChange={() => toggleHistory(opt.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="meds">Current medications (optional)</Label>
          <Textarea id="meds" value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="List any medications you're currently taking…" className="mt-1" />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving…" : "Analyse my results"}
        </Button>
      </form>
    </StepLayout>
  );
}
