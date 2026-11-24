import { NextResponse } from "next/server";
import { isAllowedStudentEmail, normalizeEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedStudentEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Please select a PDF file to upload." },
      { status: 400 }
    );
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Only PDF files (.pdf) are allowed for CV/Resume." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "CV file size must be 5 MB or less." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const storagePath = `${user.id}/resume.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("students")
    .select("full_name, branch")
    .eq("id", user.id)
    .maybeSingle();

  const hasAcademicFields = Boolean(
    existing?.full_name?.trim() && existing?.branch?.trim()
  );

  const { data: updated, error: dbError } = await supabase
    .from("students")
    .upsert(
      {
        id: user.id,
        email: normalizeEmail(user.email),
        resume_path: storagePath,
        resume_filename: file.name,
        profile_completed: hasAcademicFields,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ student: updated });
}
