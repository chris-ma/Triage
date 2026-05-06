import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Camera, FileText, AlertTriangle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Facial Triage Assistant</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            An AI-assisted tool that analyses visible facial patterns and symptoms to help you
            know when and where to seek care.
          </p>
        </div>

        {/* Key features */}
        <div className="grid grid-cols-1 gap-4 mb-10">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Camera className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Guided capture</h3>
                  <p className="text-sm text-muted-foreground">
                    Frontal photo, illuminated colour captures, head scan, and brief speech test.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Doctor-ready summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Generates a structured note with findings, urgency, and referral guidance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Privacy-first</h3>
                  <p className="text-sm text-muted-foreground">
                    All images and videos are encrypted and automatically deleted after 24 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important notice */}
        <Card className="border-amber-200 bg-amber-50 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>This is not a diagnostic tool.</strong> Results are visual pattern
                matches that need verification by a doctor. If you have a medical emergency,
                call 000 immediately.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/consent">
            <Button size="lg" className="w-full sm:w-auto px-12">
              Get started
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            Best experienced on Chrome or Firefox desktop. Camera access required.
          </p>
        </div>
      </div>
    </div>
  );
}
