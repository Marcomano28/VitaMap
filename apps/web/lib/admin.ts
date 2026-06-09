import { notFound, redirect } from "next/navigation";
import { getEnv } from "./env";
import { getSession } from "./session";

export function parseAdminEmails(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails(getEnv().ADMIN_EMAILS).has(email.trim().toLowerCase());
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session?.user) redirect("/login?next=/admin/corpus");
  if (!isAdminEmail(session.user.email)) notFound();
  return session;
}
