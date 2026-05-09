import Link from "next/link";
import dynamic from "next/dynamic";

const PolygonFace = dynamic(() => import("@/components/landing/PolygonFace"), { ssr: false });

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#fafaf9" }}>

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-6">
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-gray-400">
          Triage
        </span>
      </nav>

      {/* Hero */}
      <div className="relative flex min-h-screen items-center">

        {/* Text block — left */}
        <div className="relative z-10 flex flex-col justify-center px-8 pt-20 pb-16 sm:px-12 lg:px-20 w-full lg:w-1/2 xl:w-5/12">
          <p className="mb-5 text-[10px] font-semibold tracking-[0.3em] uppercase text-gray-400">
            AI-assisted facial triage
          </p>

          <h1
            className="mb-6 font-light leading-[1.08] tracking-tight text-gray-900"
            style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}
          >
            Know when<br />to seek care.
          </h1>

          <p className="mb-10 max-w-sm text-base leading-relaxed text-gray-500">
            A guided visual assessment that surfaces facial patterns and symptom signals,
            then generates a structured note for your doctor.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/consent"
              className="inline-flex items-center justify-center rounded-full border border-gray-900 px-8 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              Get started
            </Link>
            <span className="text-xs text-gray-400 sm:ml-2">
              Camera &amp; microphone required
            </span>
          </div>

          <p className="mt-8 text-[11px] leading-relaxed text-gray-400 max-w-xs">
            Not a diagnostic tool. All findings require verification by a qualified clinician.
            Media deleted after 24 hours.
          </p>
        </div>

        {/* WebGL face — right */}
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[58%] pointer-events-none lg:pointer-events-auto"
          style={{ opacity: 1 }}
        >
          <PolygonFace />
        </div>
      </div>

      {/* Explore cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5">
        <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400">Move to explore</span>
        <div className="h-4 w-px bg-gray-300 animate-pulse" />
      </div>
    </div>
  );
}
