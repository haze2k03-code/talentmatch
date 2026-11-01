import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentMatch",
  description: "Match clients to open roles and track every job search through the pipeline.",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/roles", label: "Open roles" },
  { href: "/pipeline", label: "Pipeline" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight">
              TalentMatch
              <span className="ml-2 text-sm font-normal text-ink-3">client delivery tracker</span>
            </Link>
            <nav className="flex gap-5 text-sm text-ink-2">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-ink">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
