import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatSemesterScores } from "./eligibility";
import type { Company, StudentProfile } from "./types";

export function downloadInterestedStudentsPdf(
  company: Company,
  students: StudentProfile[],
  appOrigin: string
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PlaceOn — Placement Monitor", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text("IU Jaipur Campus Placement Cell | Interested Students Report", 14, 19);

  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString("en-IN")}`,
    283,
    12,
    { align: "right" }
  );
  doc.text(`Total Interested: ${students.length}`, 283, 19, { align: "right" });

  // Company Summary Block
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${company.name} — ${company.role}`, 14, 37);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const deadlineStr = new Date(company.deadline).toLocaleString("en-IN");
  doc.text(
    `Package: ${company.package_ctc}   |   Location: ${company.location}   |   Deadline: ${deadlineStr}`,
    14,
    43
  );

  const resumeUrls = students.map((s) =>
    s.resume_path ? `${appOrigin}/api/resumes/${s.id}` : null
  );

  const rows = students.map((student, index) => [
    String(index + 1),
    student.full_name || "N/A",
    student.email,
    `${student.course} (${student.branch || "General"})`,
    `Yr ${student.current_year} / Sem ${student.current_semester}`,
    `${student.tenth_percentage}%`,
    `${student.twelfth_percentage}%`,
    formatSemesterScores(student.semester_scores, student.score_type),
    student.achievements_till_12th?.trim() || "—",
    student.resume_path ? "Open CV" : "Not Uploaded",
  ]);

  autoTable(doc, {
    startY: 48,
    head: [
      [
        "S.No",
        "Name",
        "Email",
        "Course & Branch",
        "Year / Sem",
        "10th %",
        "12th %",
        "Past Semester Scores",
        "Achievements (till 12th)",
        "Resume / CV",
      ],
    ],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: "middle",
      overflow: "linebreak",
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [37, 99, 235], // blue-600
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 11, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 40 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20, halign: "center" },
      5: { cellWidth: 14, halign: "center" },
      6: { cellWidth: 14, halign: "center" },
      7: { cellWidth: 46 },
      8: { cellWidth: 46 },
      9: { cellWidth: 22, halign: "center" },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const url = resumeUrls[data.row.index];
        if (url) {
          doc.link(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            { url }
          );
        }
      }
    },
    willDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const url = resumeUrls[data.row.index];
        if (url) {
          doc.setTextColor(37, 99, 235);
        } else {
          doc.setTextColor(148, 163, 184);
        }
      }
    },
  });

  const safeCompanyName = company.name
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
  doc.save(`PlaceOn_${safeCompanyName || "Company"}_Interested_Students.pdf`);
}
