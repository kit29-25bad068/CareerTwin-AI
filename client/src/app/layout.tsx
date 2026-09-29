import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerTwin AI - Privacy-First AI Career Intelligence Platform",
  description:
    "Evidence-Driven Adaptive Learning, Dual-Source AI Mock Interviews grounded in real company datasets, Resume & CV Analyzer, and MediaPipe Eye Tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© 2026 CareerTwin AI. Privacy-First Career Intelligence.</p>
              <p className="text-[11px] text-slate-600">
                Grounding Engine: 985 Company Questions | Adaptive Graph: 12 Concepts
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
