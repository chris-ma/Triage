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
    <div className={cn("min-h-screen flex flex-col", className)}>
      {/* Step progress bar */}
      <div className="h-1.5 bg-muted w-full">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
            Step {step} of {totalSteps}
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
