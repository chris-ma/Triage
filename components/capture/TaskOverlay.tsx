interface TaskOverlayProps {
  instruction: string;
  subtext?: string;
  animate?: "arrow-left" | "arrow-right" | "none";
}

export function TaskOverlay({ instruction, subtext, animate = "none" }: TaskOverlayProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white rounded-xl p-4">
      {animate !== "none" && (
        <div className="text-2xl mb-2 text-center">
          {animate === "arrow-left" ? "← → ←" : "→ ← →"}
        </div>
      )}
      <p className="font-semibold text-sm text-center">{instruction}</p>
      {subtext && <p className="text-xs text-gray-300 text-center mt-1">{subtext}</p>}
    </div>
  );
}
