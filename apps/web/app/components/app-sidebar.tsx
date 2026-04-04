"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@biarritz/ui";
import { APP_NAME } from "@biarritz/shared";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.07926 0.222253C7.31275 -0.0296107 7.68775 -0.0296107 7.92124 0.222253L14.4212 7.22225C14.6286 7.44767 14.6286 7.80233 14.4212 8.02775C14.2138 8.25317 13.8788 8.25317 13.6714 8.02775L13 7.28988V13.5C13 13.7761 12.7761 14 12.5 14H9.50002C9.22388 14 9.00002 13.7761 9.00002 13.5V10.5H6.00002V13.5C6.00002 13.7761 5.77617 14 5.50002 14H2.50002C2.22388 14 2.00002 13.7761 2.00002 13.5V7.28988L1.32868 8.02775C1.12127 8.25317 0.786276 8.25317 0.578868 8.02775C0.37146 7.80233 0.37146 7.44767 0.578868 7.22225L7.07926 0.222253Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4778 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.07095 0.0489958C6.67391 0.0489958 6.28696 0.175676 5.94651 0.397331L5.66162 0.580948C5.51609 0.674955 5.35308 0.741372 5.18199 0.776016L4.86064 0.842039C4.46719 0.921276 4.10644 1.13305 3.84144 1.44353C3.5765 1.75401 3.42297 2.14629 3.40595 2.55604L3.39082 2.88556C3.38362 3.05861 3.34017 3.22857 3.26387 3.38396L3.11926 3.67597C2.94299 4.03176 2.89427 4.43696 2.97981 4.82492C3.06535 5.21289 3.28013 5.56007 3.58919 5.80985L3.83473 6.00697C3.96219 6.10892 4.07225 6.23109 4.16085 6.36933L4.33636 6.64833C4.5496 6.98521 4.86985 7.24149 5.24532 7.37372C5.62079 7.50595 6.02857 7.50595 6.40404 7.37372L6.68894 7.27474C6.85249 7.21763 7.02536 7.18883 7.19932 7.18883C7.37328 7.18883 7.54615 7.21763 7.7097 7.27474L7.99459 7.37372C8.37007 7.50595 8.77784 7.50595 9.15331 7.37372C9.52878 7.24149 9.84903 6.98521 10.0623 6.64833L10.2378 6.36933C10.3264 6.23109 10.4364 6.10892 10.5639 6.00697L10.8094 5.80985C11.1185 5.56007 11.3333 5.21289 11.4188 4.82492C11.5044 4.43696 11.4556 4.03176 11.2794 3.67597L11.1348 3.38396C11.0585 3.22857 11.015 3.05861 11.0078 2.88556L10.9927 2.55604C10.9757 2.14629 10.8221 1.75401 10.5572 1.44353C10.2922 1.13305 9.93144 0.921276 9.53799 0.842039L9.21664 0.776016C9.04555 0.741372 8.88254 0.674955 8.73701 0.580948L8.45212 0.397331C8.11167 0.175676 7.72473 0.0489958 7.32769 0.0489958H7.07095Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
      <path
        d="M5.50003 7.49999C5.50003 6.39542 6.39546 5.49999 7.50003 5.49999C8.6046 5.49999 9.50003 6.39542 9.50003 7.49999C9.50003 8.60456 8.6046 9.49999 7.50003 9.49999C6.39546 9.49999 5.50003 8.60456 5.50003 7.49999Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: <HomeIcon /> },
  { label: "Users", href: "/users", icon: <UsersIcon /> },
  { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-sidebar border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="flex h-11 items-center px-3 border-b border-sidebar-border">
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          {APP_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-active text-sidebar-foreground"
                  : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
