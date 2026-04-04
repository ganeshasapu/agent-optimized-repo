import Link from "next/link";

import type { User } from "../types/index";

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No users yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first user to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="section-heading px-4 py-1.5 border-b flex items-center">
        <span>Name</span>
        <span className="ml-auto">Email</span>
      </div>
      <div className="divide-y">
        {users.map((user) => (
          <Link key={user.id} href={`/users/${user.id}`} className="list-row">
            <span className="font-medium text-foreground truncate">
              {user.name ?? "Unnamed"}
            </span>
            <span className="text-muted-foreground ml-auto text-xs">
              {user.email}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
