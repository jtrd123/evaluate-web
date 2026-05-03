"use client";

import { useRouter } from "next/navigation";

interface Props {
  years: string[];
  currentYear: string;
  basePath: string;
}

export default function YearSelector({ years, currentYear, basePath }: Props) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const y = e.target.value;
    router.push(y ? `${basePath}?year=${y}` : basePath);
  }

  return (
    <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
      <svg className="w-4 h-4 text-primary/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
      </svg>
      <label className="text-xs font-semibold text-base-black/50 shrink-0">ปีการศึกษา</label>
      <select
        value={currentYear}
        onChange={handleChange}
        className="text-sm font-semibold text-primary bg-transparent focus:outline-none cursor-pointer pr-1"
      >
        <option value="">ทั้งหมด</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
