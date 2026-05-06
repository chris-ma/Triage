import type { UrgencyLevel } from "@/lib/inference/types";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

interface UrgencyBannerProps {
  level: UrgencyLevel;
  reason: string;
  redFlags: string[];
}

const CONFIG: Record<
  UrgencyLevel,
  { bg: string; border: string; text: string; icon: React.ReactNode; label: string }
> = {
  emergency: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-900",
    icon: <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />,
    label: "Seek emergency care now",
  },
  urgent: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-900",
    icon: <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />,
    label: "Seek care promptly (same day)",
  },
  routine: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-900",
    icon: <Info className="h-6 w-6 text-blue-600 flex-shrink-0" />,
    label: "Schedule a medical appointment",
  },
  informational: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-900",
    icon: <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />,
    label: "No urgent action required",
  },
};

export function UrgencyBanner({ level, reason, redFlags }: UrgencyBannerProps) {
  const cfg = CONFIG[level];
  return (
    <div className={`rounded-xl border-2 ${cfg.bg} ${cfg.border} p-4 space-y-2`}>
      <div className="flex gap-3 items-start">
        {cfg.icon}
        <div>
          <p className={`font-bold text-base ${cfg.text}`}>{cfg.label}</p>
          <p className={`text-sm mt-0.5 ${cfg.text}`}>{reason}</p>
        </div>
      </div>
      {redFlags.length > 0 && (
        <ul className={`text-xs ${cfg.text} list-disc ml-9 space-y-0.5`}>
          {redFlags.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
