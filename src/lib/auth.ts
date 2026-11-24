import { ALLOWED_STUDENT_DOMAIN } from "./constants";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export function normalizeEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

export function isAllowedStudentEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return false;
  return normalized.endsWith(`@${ALLOWED_STUDENT_DOMAIN}`);
}

export function getEnvAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminEmail(email?: string | null): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  if (getEnvAdminEmails().includes(normalized)) {
    return true;
  }

  const adminClient = createAdminClient();
  const client = adminClient ?? (await createClient());

  const { data, error } = await client
    .from("admin_whitelist")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function syncEnvAdminToWhitelist(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized || !getEnvAdminEmails().includes(normalized)) return;

  const adminClient = createAdminClient();
  if (!adminClient) return;

  await adminClient
    .from("admin_whitelist")
    .upsert({ email: normalized, added_by: "env" }, { onConflict: "email" });
}
