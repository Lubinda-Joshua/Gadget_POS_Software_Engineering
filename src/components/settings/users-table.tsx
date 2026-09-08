"use client";

import { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditUserForm } from "./edit-user-form";
import { deleteUserAction } from "@/app/actions/user-actions";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CASHIER";
  createdAt: Date;
  emailVerified: boolean;
}

interface UsersTableProps {
  users: User[];
  onUserDeleted?: (userId: string) => void;
  onUserUpdated?: () => void;
}

export function UsersTable({ users, onUserDeleted, onUserUpdated }: UsersTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure? This action cannot be undone.")) return;

    setDeleting(userId);
    try {
      const result = await deleteUserAction(userId);

      if (result.error) {
        toast.error(result.error as string);
        setDeleting(null);
        return;
      }

      toast.success("User deleted successfully");
      onUserDeleted?.(userId);
    } catch (e) {
      toast.error("Failed to delete user");
      setDeleting(null);
    }
  }

  function handleEditClick(user: User) {
    setEditingUser(user);
    setEditOpen(true);
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No users yet. Create your first user to get started.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3 text-left font-medium">Joined</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3">{user.name || "(No name)"}</td>
              <td className="px-4 py-3 font-mono text-xs">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting === user.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <EditUserForm
          open={editOpen}
          onOpenChange={setEditOpen}
          user={editingUser}
          onSuccess={() => {
            setEditOpen(false);
            setEditingUser(null);
            onUserUpdated?.();
          }}
        />
      )}
    </div>
  );
}
