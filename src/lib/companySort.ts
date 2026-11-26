import type { Company } from "./types";

export type CompanySortOption =
  | "posted_desc"
  | "posted_asc"
  | "deadline_asc"
  | "deadline_desc";

export const COMPANY_SORT_OPTIONS: {
  value: CompanySortOption;
  label: string;
}[] = [
  { value: "posted_desc", label: "Posted Date: Newest First" },
  { value: "posted_asc", label: "Posted Date: Oldest First" },
  { value: "deadline_asc", label: "Deadline: Soonest First" },
  { value: "deadline_desc", label: "Deadline: Latest First" },
];

/**
 * Sorts company drives by posted date (`created_at`) or application deadline.
 */
export function sortCompanies(
  companies: Company[],
  sortBy: CompanySortOption
): Company[] {
  return [...companies].sort((a, b) => {
    if (sortBy === "posted_desc" || sortBy === "posted_asc") {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortBy === "posted_asc" ? diff : -diff;
    }

    const diff =
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    return sortBy === "deadline_asc" ? diff : -diff;
  });
}
