export function NonDiagnosticBanner() {
  return (
    <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-center text-xs text-amber-800 no-print">
      <strong>Not a diagnosis.</strong> This tool identifies visual patterns to support clinical
      triage only. All results must be verified by a qualified health professional.
    </div>
  );
}
