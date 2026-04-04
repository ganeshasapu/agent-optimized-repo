import type { User } from "../types/index";
import { userService } from "../services/user.service";
import { UserList } from "../components/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  let users: User[] = [];
  let error: string | null = null;

  try {
    users = await userService.list();
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Failed to load users";
  }

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <h1 className="text-sm font-medium">Users</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Unable to load users
            </p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        ) : (
          <UserList users={users} />
        )}
      </div>
    </div>
  );
}
