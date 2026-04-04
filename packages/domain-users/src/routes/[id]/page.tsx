import { notFound } from "next/navigation";
import Link from "next/link";

import { Button } from "@biarritz/ui";

import { userService } from "../../services/user.service";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await userService.getById(id);

  if (!user) {
    notFound();
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="flex h-11 items-center gap-2 border-b px-6 shrink-0">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
          <Link href="/users">Users</Link>
        </Button>
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-medium text-foreground">{user.name ?? "Unnamed"}</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-muted text-violet text-lg font-semibold">
              {initials}
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">{user.name ?? "Unnamed"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Details */}
          <div className="border rounded-lg divide-y">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</span>
              <span className="text-sm text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Member since</span>
              <span className="text-sm text-foreground">{user.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">ID</span>
              <span className="text-sm text-muted-foreground font-mono">{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
