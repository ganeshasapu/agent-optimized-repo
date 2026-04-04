import Link from "next/link";

import { Button } from "@biarritz/ui";
import { APP_NAME } from "@biarritz/shared";

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="flex h-11 items-center border-b px-6 shrink-0">
        <h1 className="text-sm font-medium text-foreground">Home</h1>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Agent-optimized starter template. Navigate using the sidebar to
            explore users and settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href="/users">View Users</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
