/**
 * Design Philosophy: Technical Command Center
 * - Persistent sidebar navigation
 * - Split panel layout
 * - Monospace typography throughout
 */

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  FileSpreadsheet,
  Settings,
  BarChart3,
  FileDown,
  Terminal,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    path: "/",
    label: "IMPORT",
    icon: FileSpreadsheet,
  },
  {
    path: "/configure",
    label: "CONFIG",
    icon: Settings,
  },
  {
    path: "/analyze",
    label: "ANALYZE",
    icon: BarChart3,
  },
  {
    path: "/export",
    label: "EXPORT",
    icon: FileDown,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo/Title */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-primary glow-cyan" />
            <div>
              <h1 className="text-lg font-bold text-primary glow-cyan">
                VARIATION
              </h1>
              <p className="text-xs text-muted-foreground">CALCULATOR v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive &&
                          "bg-primary text-primary-foreground font-bold"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>SYSTEM: ONLINE</p>
            <p>STATUS: READY</p>
            <p className="text-primary glow-cyan">█</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
