import { userService } from "../services/user.service";
import { UserList } from "../components/user-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await userService.list();

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Users</h1>
      <UserList users={users} />
    </main>
  );
}
