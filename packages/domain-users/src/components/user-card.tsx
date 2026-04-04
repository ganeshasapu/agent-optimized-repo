import { Card, CardHeader, CardTitle, CardDescription } from "@biarritz/ui";

import type { User } from "../types/index";

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name ?? "Unnamed"}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
    </Card>
  );
}
