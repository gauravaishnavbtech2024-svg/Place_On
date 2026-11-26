import { Resend } from "resend";
import type { Company } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailDispatchResult {
  sentCount: number;
  failedCount: number;
  skippedReason?: string;
}

export async function sendCompanyAnnouncementEmails(
  company: Company,
  recipientEmails: string[],
  appUrl: string
): Promise<EmailDispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      sentCount: 0,
      failedCount: 0,
      skippedReason:
        "RESEND_API_KEY is not configured. Company was saved, but automated emails were skipped.",
    };
  }

  const uniqueEmails = Array.from(
    new Set(
      recipientEmails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@"))
    )
  );

  if (uniqueEmails.length === 0) {
    return {
      sentCount: 0,
      failedCount: 0,
      skippedReason: "No registered students found to email yet.",
    };
  }

  const resend = new Resend(apiKey);
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "PlaceOn <onboarding@resend.dev>";
  const deadlineFormatted = new Date(company.deadline).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const coursesText = company.allowed_courses?.length
    ? company.allowed_courses.join(", ")
    : "All Courses";

  const eligibilityParts: string[] = [`Courses: ${coursesText}`];
  if (company.min_tenth_percentage !== null) {
    eligibilityParts.push(`Min 10th: ${company.min_tenth_percentage}%`);
  }
  if (company.min_twelfth_percentage !== null) {
    eligibilityParts.push(`Min 12th: ${company.min_twelfth_percentage}%`);
  }
  if (company.min_sem_cgpa !== null) {
    eligibilityParts.push(`Min Sem CGPA: ${company.min_sem_cgpa}`);
  }

  const subject = `New Placement Drive: ${company.name} — ${company.role} (${company.package_ctc})`;
  const portalUrl = `${appUrl.replace(/\/$/, "")}/student`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fdfeff; color: #18162b;">
      <div style="background: #2f228c; color: #fdfeff; padding: 20px 24px; border-bottom: 3px solid #d7201c; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">PlaceOn &mdash; IcfaiTech (IU Jaipur) Placement Monitor</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #e2e8f0;">New Campus Placement Drive Notification</p>
      </div>
      <div style="background: #fdfeff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 4px; font-size: 22px; color: #18162b;">${escapeHtml(company.name)}</h2>
        <p style="margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #d7201c;">${escapeHtml(company.role)}</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 130px;">Package (CTC)</td>
            <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(company.package_ctc)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Location</td>
            <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(company.location)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Deadline</td>
            <td style="padding: 8px 0; font-weight: 600;">${escapeHtml(deadlineFormatted)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Eligibility</td>
            <td style="padding: 8px 0;">${escapeHtml(eligibilityParts.join(" | "))}</td>
          </tr>
        </table>

        <div style="background: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 14px; line-height: 1.5; color: #334155; margin-bottom: 20px; white-space: pre-line;">
          ${escapeHtml(company.description)}
        </div>

        <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: #2f228c; color: #fdfeff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 20px; border-radius: 8px;">
          Open PlaceOn &amp; Mark Interest
        </a>

        <p style="margin: 20px 0 0; font-size: 12px; color: #64748b;">
          Please sign in with your @iujaipur.edu.in Google account and mark Interested or Not Interested before the deadline.
        </p>
      </div>
    </div>
  `;

  let sentCount = 0;
  let failedCount = 0;

  // Resend batch endpoint supports up to 100 emails per call
  const chunkSize = 100;
  for (let i = 0; i < uniqueEmails.length; i += chunkSize) {
    const chunk = uniqueEmails.slice(i, i + chunkSize);
    try {
      const payload = chunk.map((to) => ({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }));
      const { error } = await resend.batch.send(payload);
      if (error) {
        failedCount += chunk.length;
      } else {
        sentCount += chunk.length;
      }
    } catch {
      failedCount += chunk.length;
    }
  }

  return { sentCount, failedCount };
}
