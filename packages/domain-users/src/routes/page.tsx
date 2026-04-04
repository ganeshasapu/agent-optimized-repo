import { userService } from "../services/user.service";
import { UserList } from "../components/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await userService.list();

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <h1 className="text-sm font-medium">Users</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <UserList users={users} />
      </div>
    </div>
  );
}
