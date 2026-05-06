"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/shared/SessionContext";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Sex = "male" | "female" | "other" | "prefer_not_to_say";

interface FormState {
  age: string;
  sex: Sex | "";
  chief_complaint: string;
  onset_days: string;
  is_sudden: boolean | null;
}

interface FormErrors {
  age?: string;
  sex?: string;
  chief_complaint?: string;
  onset_days?: string;
  is_sudden?: string;
}

export default function DetailsPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    age: "",
    sex: "",
    chief_complaint: "",
    onset_days: "",
    is_sudden: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    const age = parseInt(form.age);
    if (!form.age || isNaN(age) || age < 1 || age > 120) e.age = "Please enter a valid age (1–120).";
    if (!form.sex) e.sex = "Please select a sex.";
    if (form.chief_complaint.trim().length < 5) e.chief_complaint = "Please describe your concern (at least 5 characters).";
    const onset = parseInt(form.onset_days);
    if (!form.onset_days || isNaN(onset) || onset < 0) e.onset_days = "Please enter a valid number of days.";
    if (form.is_sudden === null) e.is_sudden = "Please select one.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!sessionId) { router.push("/consent"); return; }
    setLoading(true);
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        intake_data: {
          age: parseInt(form.age),
          sex: form.sex,
          chief_complaint: form.chief_complaint.trim(),
          onset_days: parseInt(form.onset_days),
          is_sudden: form.is_sudden,
        },
        status: "pending",
      }),
    });
    setLoading(false);
    router.push("/capture/face");
  }

  return (
    <StepLayout step={1} totalSteps={7} title="Base details" subtitle="Tell us a little about yourself before we take any photos.">
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            placeholder="e.g. 42"
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            className="mt-1"
          />
          {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
        </div>

        <div>
          <Label>Sex assigned at birth</Label>
          <Select onValueChange={(v) => setForm((f) => ({ ...f, sex: v as Sex }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
        </div>

        <div>
          <Label htmlFor="chief_complaint">Main concern</Label>
          <Textarea
            id="chief_complaint"
            placeholder="Briefly describe what you've noticed or what's worrying you…"
            value={form.chief_complaint}
            onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
            className="mt-1"
          />
          {errors.chief_complaint && (
            <p className="text-xs text-red-500 mt-1">{errors.chief_complaint}</p>
          )}
        </div>

        <div>
          <Label htmlFor="onset_days">How long has this been present? (days)</Label>
          <Input
            id="onset_days"
            type="number"
            placeholder="e.g. 7"
            value={form.onset_days}
            onChange={(e) => setForm((f) => ({ ...f, onset_days: e.target.value }))}
            className="mt-1"
          />
          {errors.onset_days && (
            <p className="text-xs text-red-500 mt-1">{errors.onset_days}</p>
          )}
        </div>

        <div>
          <Label>Did it come on suddenly?</Label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_sudden"
                value="true"
                onChange={() => setForm((f) => ({ ...f, is_sudden: true }))}
              />
              <span className="text-sm">Yes — came on quickly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="is_sudden"
                value="false"
                onChange={() => setForm((f) => ({ ...f, is_sudden: false }))}
              />
              <span className="text-sm">No — gradual or longstanding</span>
            </label>
          </div>
          {errors.is_sudden && (
            <p className="text-xs text-red-500 mt-1">{errors.is_sudden}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Continue to photo capture"}
        </Button>
      </form>
    </StepLayout>
  );
}
