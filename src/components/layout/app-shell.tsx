"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, Package, ReceiptText, BarChart3, Settings } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { DarkModeToggle } from "./dark-mode-toggle";
import { cn } from "@/lib/utils";

interface AppShellProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
  cssVars: React.CSSProperties;
  children: React.ReactNode;
}

export function AppShell({ user, cssVars, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const bottomNav = [
    { href: "/pos", label: "POS", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
    { href: "/products", label: "Products", icon: Package, roles: ["ADMIN"] },
    { href: "/sales", label: "Sales", icon: ReceiptText, roles: ["ADMIN", "CASHIER"] },
    { href: "/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
  ].filter((item) => item.roles.includes(user.role ?? "CASHIER"));

  return (
    <div className="flex h-screen overflow-hidden bg-background print:block print:h-auto print:overflow-visible" style={cssVars}>
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:block shrink-0 print:hidden">
        <AppSidebar user={user} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <div className="relative z-10 h-full w-56 shrink-0">
            <AppSidebar user={user} onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 print:block print:overflow-visible">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-sidebar lg:bg-background px-4 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-md p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Mobile logo — only visible on mobile (sidebar hidden) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/android-chrome-192x192.png"
              alt="Gadget POS"
              className="lg:hidden h-7 w-7 rounded-lg object-contain"
            />
            <span className="text-sm font-semibold text-white lg:hidden">Gadget POS</span>
            <span className="text-sm font-medium text-muted-foreground hidden lg:block">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <DarkModeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto print:overflow-visible">{children}</main>

        {/* Mobile bottom navigation */}
        <nav className="flex lg:hidden shrink-0 border-t bg-background print:hidden">
          {bottomNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
