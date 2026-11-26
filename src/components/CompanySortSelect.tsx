"use client";

import { ArrowUpDown } from "lucide-react";
import {
  COMPANY_SORT_OPTIONS,
  type CompanySortOption,
} from "@/lib/companySort";

interface CompanySortSelectProps {
  value: CompanySortOption;
  onChange: (value: CompanySortOption) => void;
  className?: string;
}

/**
 * Shared sort selector for company drives by posted date or deadline.
 */
export function CompanySortSelect({
  value,
  onChange,
  className = "",
}: CompanySortSelectProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 ${className}`}
    >
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <select
        aria-label="Sort companies"
        value={value}
        onChange={(e) => onChange(e.target.value as CompanySortOption)}
        className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
      >
        {COMPANY_SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
