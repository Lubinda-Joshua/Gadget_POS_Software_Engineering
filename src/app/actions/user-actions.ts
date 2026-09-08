"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ---- Schemas ----

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "CASHIER"]),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["ADMIN", "CASHIER"]).optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .refine((pwd) => pwd !== "", "New password is required"),
});

// ---- Helper: Check Admin Authorization ----

async function checkAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized: Please log in");
  }
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

// ---- Actions ----

/**
 * Creates a new user (Admin only)
 */
export async function createUserAction(data: z.infer<typeof createUserSchema>) {
  await checkAdminAuth();

  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = parsed.data;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "User with this email already exists" };
    }

    // Call Better Auth server-side API to create user.
    // In Better Auth v1, auth.api is typed dynamically based on plugins.
    // If TypeScript fails to resolve the types, cast to any is avoided by using standard call.
    await auth.api.signUpEmail({
      body: { name, email, password },
    });

    // Update user role
    const user = await prisma.user.update({
      where: { email },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath("/settings/users");
    return { success: true, user };
  } catch (err) {
    console.error("Create user error:", err);
    return { error: err instanceof Error ? err.message : "Failed to create user" };
  }
}

/**
 * Updates an existing user's details (Admin only)
 */
export async function updateUserAction(id: string, data: z.infer<typeof updateUserSchema>) {
  const session = await checkAdminAuth();

  const parsed = updateUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  const updates = parsed.data;

  try {
    // Prevent self-demotion from admin
    if (updates.role && updates.role !== "ADMIN" && session.user.id === id) {
      return { error: "Cannot demote yourself from admin role" };
    }

    // If changing email, check for duplicates
    if (updates.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updates.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return { error: "Email already in use" };
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.role && { role: updates.role }),
      },
    });

    revalidatePath("/settings/users");
    return { success: true, user };
  } catch (err) {
    console.error("Update user action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update user" };
  }
}

/**
 * Deletes a user (Admin only).
 * Checks for historical transaction records to maintain audit safety.
 */
export async function deleteUserAction(id: string) {
  const session = await checkAdminAuth();

  try {
    // Prevent self-deletion
    if (id === session.user.id) {
      return { error: "Cannot delete your own account" };
    }

    // Prevent deleting the last admin
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === "ADMIN" && adminCount === 1) {
      return { error: "Cannot delete the last admin account" };
    }

    // DB Audit Safety: Check if user has associated historical sales, refunds, or stock adjustments
    const [salesCount, refundsCount, adjustmentsCount] = await Promise.all([
      prisma.sale.count({ where: { userId: id } }),
      prisma.refund.count({ where: { userId: id } }),
      prisma.stockAdjustment.count({ where: { userId: id } }),
    ]);

    if (salesCount > 0 || refundsCount > 0 || adjustmentsCount > 0) {
      return {
        error: "Cannot delete this user because they have historical sales, refunds, or stock adjustments in the system. You can update their name or change their role instead to preserve audit logs.",
      };
    }

    await prisma.user.delete({ where: { id } });

    revalidatePath("/settings/users");
    return { success: true };
  } catch (err) {
    console.error("Delete user action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete user" };
  }
}

/**
 * Updates the current user's profile
 */
export async function updateProfileAction(data: z.infer<typeof updateProfileSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  const { name, email } = parsed.data;

  try {
    // Update user profile using Better Auth server-side API so that session/cookie cache is updated
    await auth.api.updateUser({
      body: {
        ...(name && { name }),
        ...(email && { email }),
      },
      headers: await headers(),
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    revalidatePath("/settings/profile");
    revalidatePath("/pos");
    return { success: true, user: updatedUser };
  } catch (err) {
    console.error("Update profile action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update profile" };
  }
}

/**
 * Changes the current user's password
 */
export async function changePasswordAction(data: z.infer<typeof changePasswordSchema>) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized: Please log in" };
  }

  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Validation failed", details: parsed.error.issues };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
      headers: await headers(),
    });

    return { success: true, message: "Password changed successfully" };
  } catch (err) {
    console.error("Change password action error:", err);
    return { error: err instanceof Error ? err.message : "Failed to change password" };
  }
}
