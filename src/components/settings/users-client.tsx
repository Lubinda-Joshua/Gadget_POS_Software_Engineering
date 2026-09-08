"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { UsersTable } from "./users-table";
import { CreateUserForm } from "./create-user-form";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CASHIER";
  createdAt: Date;
  emailVerified: boolean;
}

interface UsersClientProps {
  initialUsers: User[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [createOpen, setCreateOpen] = useState(false);

  function handleUserDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function handleUserUpdated() {
    // Refresh users list from API
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(() => {
        // Silently fail, user can refresh manually
      });
  }

  function handleUserCreated() {
    // Refresh users list from API
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(() => {
        // Silently fail, user can refresh manually
      });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{users.length} user{users.length !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Add User
        </button>
      </div>

      <UsersTable
        users={users}
        onUserDeleted={handleUserDeleted}
        onUserUpdated={handleUserUpdated}
      />

      <CreateUserForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onUserCreated={handleUserCreated}
      />
    </>
  );
}
