"use client";

export default function UsersError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <h1 className="text-sm font-medium">Users</h1>
      </header>
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          Unable to load users
        </p>
        <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
      </div>
    </div>
  );
}
