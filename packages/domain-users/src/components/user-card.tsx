import Link from "next/link";

import { cn } from "@biarritz/ui";

import type { User } from "../types/index";

interface UserCardProps {
  user: User;
}

function UserAvatar({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium shrink-0",
        "bg-violet-muted text-violet"
      )}
    >
      {initials}
    </span>
  );
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/users/${user.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors group"
    >
      <UserAvatar name={user.name} />
      <div className="flex flex-1 flex-col min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {user.name ?? "Unnamed"}
        </span>
        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
      </div>
      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {user.createdAt.toLocaleDateString()}
      </span>
    </Link>
  );
}
