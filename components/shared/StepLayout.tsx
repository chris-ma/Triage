import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function StepLayout({ step, totalSteps, title, subtitle, children, className }: StepLayoutProps) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className={cn("min-h-screen flex flex-col", className)} style={{ background: "#fafaf9" }}>
      {/* Progress bar — thin hairline */}
      <div className="h-px bg-gray-200 w-full">
        <div
          className="h-full bg-gray-900 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-10">
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400 mb-2">
            Step {step} of {totalSteps}
          </p>
          <h1 className="text-2xl font-light text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-400 mt-1.5 text-sm">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
