import { userService } from "../services/user.service";
import { UserList } from "../components/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await userService.list();

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="flex h-11 items-center justify-between border-b px-6 shrink-0">
        <h1 className="text-sm font-medium text-foreground">Users</h1>
        <span className="text-xs text-muted-foreground">{users.length} members</span>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <UserList users={users} />
      </div>
    </div>
  );
}
