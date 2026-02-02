/**
 * Design Philosophy: Formal Minimal
 * - Clean, simple header and navigation
 * - No sidebar, focus on content
 * - Minimal visual elements
 */

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/", label: "Upload" },
  { path: "/configure", label: "Configure" },
  { path: "/analyze", label: "Analyze" },
  { path: "/results", label: "Results" },
];

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Variation Calculator
            </h1>
            <p className="text-sm text-muted-foreground">v2.0</p>
          </div>

          {/* Navigation */}
          <nav className="flex gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>Variation Calculator © 2026</p>
        </div>
      </footer>
    </div>
  );
}
