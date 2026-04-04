"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@biarritz/ui";

interface SettingsNavItem {
  label: string;
  href: string;
  description: string;
}

const navItems: SettingsNavItem[] = [
  { label: "General", href: "/settings", description: "Manage general settings" },
  { label: "Profile", href: "/settings/profile", description: "Your profile information" },
  { label: "Appearance", href: "/settings/appearance", description: "Theme and display" },
  { label: "Notifications", href: "/settings/notifications", description: "Notification preferences" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const isActive =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col gap-0.5 rounded-md px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
