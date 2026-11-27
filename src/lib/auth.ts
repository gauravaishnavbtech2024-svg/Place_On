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

function parseEmailList(raw?: string): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getEnvAdminEmails(): string[] {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function getEnvLeadershipEmails(): string[] {
  return parseEmailList(process.env.LEADERSHIP_EMAILS);
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

export async function isLeadershipEmail(email?: string | null): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const envLeadership = getEnvLeadershipEmails();
  if (envLeadership.includes(normalized)) {
    return true;
  }

  const adminClient = createAdminClient();
  const client = adminClient ?? (await createClient());

  const { data: match, error: matchError } = await client
    .from("leadership_whitelist")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();

  if (!matchError && match) {
    return true;
  }

  // If no dedicated leadership emails are configured in env or DB yet,
  // allow configured admins to access the leadership portal until leadership emails are set.
  if (envLeadership.length === 0) {
    const { count, error: countError } = await client
      .from("leadership_whitelist")
      .select("email", { count: "exact", head: true });

    if (countError || (count ?? 0) === 0) {
      return isAdminEmail(normalized);
    }
  }

  return false;
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

export async function syncEnvLeadershipToWhitelist(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized || !getEnvLeadershipEmails().includes(normalized)) return;

  const adminClient = createAdminClient();
  if (!adminClient) return;

  await adminClient
    .from("leadership_whitelist")
    .upsert({ email: normalized, added_by: "env" }, { onConflict: "email" });
}
