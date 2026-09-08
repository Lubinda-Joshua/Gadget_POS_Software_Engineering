"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "@/lib/translations";
import {
  ShoppingCart,
  Package,
  ReceiptText,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Truck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  user: {
    name: string;
    email: string;
    role?: string;
  };
  onLinkClick?: () => void;
}

const navItems = [
  { href: "/pos", key: "pos", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
  { href: "/products", key: "products", icon: Package, roles: ["ADMIN"] },
  { href: "/suppliers", key: "suppliers", icon: Truck, roles: ["ADMIN"] },
  { href: "/customers", key: "customers", icon: Users, roles: ["ADMIN"] },
  { href: "/sales", key: "sales", icon: ReceiptText, roles: ["ADMIN", "CASHIER"] },
  { href: "/warranties", key: "warranties", icon: ShieldCheck, roles: ["ADMIN", "CASHIER"] },
  { href: "/reports", key: "reports", icon: BarChart3, roles: ["ADMIN"] },
  { href: "/settings", key: "settings", icon: Settings, roles: ["ADMIN"] },
];

export function AppSidebar({ user, onLinkClick }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const role = user.role ?? "CASHIER";
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  const handleProfileClick = () => {
    router.push("/settings/profile");
    onLinkClick?.();
  };

  return (
    <aside className="bg-sidebar flex h-full w-56 shrink-0 flex-col border-r">
      {/* Brand */}
      <div className="border-sidebar-border flex h-16 items-center gap-3 border-b px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/android-chrome-192x192.png"
          alt="Gadget POS"
          className="h-9 w-9 shrink-0 rounded-xl object-contain"
        />
        <div className="flex flex-col leading-none">
          <span className="text-sidebar-foreground text-sm font-bold tracking-tight">
            Gadget POS
          </span>
          <span className="text-sidebar-primary text-[10px] font-semibold tracking-widest uppercase">
            POS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visibleNav.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(key as any)}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-sidebar-border space-y-2 border-t p-3">
        <button
          onClick={handleProfileClick}
          className="hover:bg-sidebar-accent flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left transition-colors"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground truncate text-sm leading-none font-medium">
              {user.name}
            </p>
            <p className="text-sidebar-foreground/50 mt-0.5 truncate text-xs">{user.email}</p>
          </div>
        </button>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
