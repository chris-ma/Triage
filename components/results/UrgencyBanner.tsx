import type { UrgencyLevel } from "@/lib/inference/types";

interface UrgencyBannerProps {
  level: UrgencyLevel;
  reason: string;
  redFlags: string[];
}

const CONFIG: Record<UrgencyLevel, { border: string; label: string; dot: string }> = {
  emergency: {
    border: "border-l-red-500",
    label: "Seek emergency care now",
    dot: "bg-red-500",
  },
  urgent: {
    border: "border-l-amber-500",
    label: "Seek care promptly — same day",
    dot: "bg-amber-500",
  },
  routine: {
    border: "border-l-gray-400",
    label: "Schedule a medical appointment",
    dot: "bg-gray-400",
  },
  informational: {
    border: "border-l-gray-300",
    label: "No urgent action required",
    dot: "bg-gray-300",
  },
};

export function UrgencyBanner({ level, reason, redFlags }: UrgencyBannerProps) {
  const cfg = CONFIG[level];
  return (
    <div className={`bg-white border border-gray-100 border-l-4 ${cfg.border} rounded-xl p-4 space-y-2`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <div>
          <p className="font-medium text-sm text-gray-900">{cfg.label}</p>
          <p className="text-sm text-gray-500 mt-0.5">{reason}</p>
        </div>
      </div>
      {redFlags.length > 0 && (
        <ul className="text-xs text-gray-400 list-disc ml-8 space-y-0.5">
          {redFlags.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}
