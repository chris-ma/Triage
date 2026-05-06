import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/shared/SessionContext";
import { NonDiagnosticBanner } from "@/components/shared/NonDiagnosticBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Facial Triage Assistant",
  description:
    "AI-assisted facial pattern analysis to support clinical triage. Not a diagnosis tool.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <main className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <NonDiagnosticBanner />
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
