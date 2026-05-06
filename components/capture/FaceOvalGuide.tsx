export function FaceOvalGuide() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg viewBox="0 0 320 420" className="w-48 h-64 opacity-70">
        <ellipse
          cx="160"
          cy="210"
          rx="130"
          ry="180"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeDasharray="8 6"
        />
      </svg>
    </div>
  );
}
