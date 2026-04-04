import { Button } from "@biarritz/ui";
import { APP_NAME } from "@biarritz/shared";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p className="text-muted-foreground">Agent-optimized starter template</p>
      <Button>Get Started</Button>
    </main>
  );
}
