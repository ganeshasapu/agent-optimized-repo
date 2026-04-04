import Link from "next/link";

import { Button } from "@biarritz/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </main>
  );
}
