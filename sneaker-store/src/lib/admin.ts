import type { User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ENV_ADMIN_USER_ID } from "@/lib/env-admin";
import { prisma } from "@/lib/prisma";

export type AdminSessionUser = Pick<User, "id" | "email" | "name" | "role">;

export async function requireAdminUser(): Promise<AdminSessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const id = (session.user as { id?: string }).id;
  const tokenRole = (session.user as { role?: string }).role;
  if (tokenRole !== "admin" || !id) return null;

  const dbUser = await prisma.user.findUnique({ where: { id } });
  if (dbUser?.role === "admin") {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };
  }
  if (id === ENV_ADMIN_USER_ID) {
    return {
      id,
      email: session.user.email ?? process.env.ADMIN_EMAIL?.trim() ?? "",
      name: session.user.name ?? "Admin",
      role: "admin",
    };
  }
  return null;
}

