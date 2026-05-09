export function NonDiagnosticBanner() {
  return (
    <div className="border-t border-gray-200 px-4 py-2.5 text-center text-[11px] text-gray-400 no-print tracking-wide">
      <strong className="font-medium text-gray-500">Not a diagnosis.</strong>{" "}
      This tool identifies visual patterns to support clinical triage only. All results must be verified by a qualified health professional.
    </div>
  );
}
