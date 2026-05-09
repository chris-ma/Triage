"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/shared/SessionContext";

const ITEMS = [
  {
    label: "What we collect",
    body: "Facial photos, a short video scan, a speech recording, and your symptom answers. No name or contact information is required.",
  },
  {
    label: "How it is stored",
    body: "All media is encrypted in transit and at rest. Only our secure servers process your data. It is never sold or shared with third parties.",
  },
  {
    label: "How long we keep it",
    body: "Your images, videos, and results are automatically deleted 24 hours after your session ends.",
  },
  {
    label: "Your rights",
    body: "You can stop at any time. Under Australian privacy law, facial biometric data is sensitive information — we treat it accordingly.",
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const { setSessionId } = useSession();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConsent() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consented_at: new Date().toISOString(), consent_version: "1.0" }),
      });
      if (res.status === 503) throw new Error("Service not configured — add Supabase env vars in the Vercel dashboard");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || body.error || "Failed to create session");
      }
      const { sessionId } = await res.json();
      setSessionId(sessionId);
      router.push("/details");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#fafaf9" }}>
      <div className="max-w-lg mx-auto w-full px-5 py-12 flex-1">

        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400 mb-3">
          Before we begin
        </p>
        <h1 className="text-2xl font-light text-gray-900 mb-1.5">Your privacy, explained</h1>
        <p className="text-sm text-gray-400 mb-10">
          This app uses your camera and microphone to analyse visible facial patterns.
        </p>

        <div className="space-y-0 mb-10">
          {ITEMS.map((item, i) => (
            <div key={item.label} className={`py-5 ${i < ITEMS.length - 1 ? "border-b border-gray-100" : ""}`}>
              <p className="text-xs font-medium text-gray-900 mb-1">{item.label}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-8 p-4 rounded-lg border border-gray-200 bg-white">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-gray-900"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="text-sm text-gray-600 leading-relaxed">
            I understand that this tool is for triage support only and is{" "}
            <strong className="font-medium text-gray-900">not a medical diagnosis</strong>. I consent to my facial images,
            video, and symptom data being processed and automatically deleted after 24 hours.
          </span>
        </label>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 rounded-full border border-gray-200 py-3 text-sm text-gray-500 hover:border-gray-400 transition-colors"
          >
            Decline
          </button>
          <button
            disabled={!agreed || loading}
            onClick={handleConsent}
            className="flex-1 rounded-full bg-gray-900 py-3 text-sm text-white disabled:opacity-40 hover:bg-gray-700 transition-colors"
          >
            {loading ? "Starting…" : "I consent — continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
