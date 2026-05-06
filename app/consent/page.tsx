"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/components/shared/SessionContext";
import { Shield, Eye, Clock, Trash2, ChevronRight } from "lucide-react";

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
        body: JSON.stringify({
          consented_at: new Date().toISOString(),
          consent_version: "1.0",
        }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const { sessionId } = await res.json();
      setSessionId(sessionId);
      router.push("/details");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const items = [
    {
      icon: <Eye className="h-5 w-5 text-blue-600" />,
      bg: "bg-blue-100",
      title: "What we collect",
      body: "Facial photos, a short video scan, a speech recording, and your symptom answers. No name or contact information is required.",
    },
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      bg: "bg-green-100",
      title: "How it is stored",
      body: "All media is encrypted in transit and at rest. Only our secure servers process your data. It is never sold or shared with third parties.",
    },
    {
      icon: <Clock className="h-5 w-5 text-amber-600" />,
      bg: "bg-amber-100",
      title: "How long we keep it",
      body: "Your images, videos, and results are automatically deleted 24 hours after your session ends.",
    },
    {
      icon: <Trash2 className="h-5 w-5 text-red-600" />,
      bg: "bg-red-100",
      title: "Your rights",
      body: "You can stop at any time. Under Australian privacy law, facial biometric data is sensitive information — we treat it accordingly.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-10 flex-1">
        <h1 className="text-2xl font-bold mb-2">Before we begin</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          This app uses your camera and microphone to analyse visible facial patterns. Please read
          what we collect and how we use it.
        </p>

        <div className="space-y-3 mb-8">
          {items.map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-4 pb-4">
                <div className="flex gap-3">
                  <div
                    className={`flex-shrink-0 w-9 h-9 ${item.bg} rounded-full flex items-center justify-center`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-gray-200 bg-white mb-6">
          <CardContent className="pt-4 pb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                I understand that this tool is for triage support only and is{" "}
                <strong>not a medical diagnosis</strong>. I consent to my facial images, video,
                and symptom data being processed and automatically deleted after 24 hours.
              </span>
            </label>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
            Decline
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!agreed || loading}
            onClick={handleConsent}
          >
            {loading ? "Starting…" : "I consent — continue"}
            {!loading && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
