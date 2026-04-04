import { notFound } from "next/navigation";

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

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-4 text-3xl font-bold">{user.name ?? "Unnamed"}</h1>
      <p className="text-muted-foreground">{user.email}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Joined {user.createdAt.toLocaleDateString()}
      </p>
    </main>
  );
}
