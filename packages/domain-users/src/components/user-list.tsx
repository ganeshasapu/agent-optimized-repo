import type { User } from "../types/index";
import { UserCard } from "./user-card";

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-sm font-medium text-foreground">No members yet</p>
        <p className="text-xs text-muted-foreground">Users will appear here once added.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden divide-y">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
