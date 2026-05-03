"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { QuestionStat } from "@/lib/types/database.types";

interface Props {
  stats: QuestionStat[];
}

function truncate(text: string, len = 22) {
  return text.length > len ? text.slice(0, len) + "…" : text;
}

export default function TeacherResultsChart({ stats }: Props) {
  const data = stats.map((s, i) => ({
    name: `ข้อ ${i + 1}`,
    fullName: s.question_text,
    average: s.average !== null ? parseFloat(s.average.toFixed(2)) : 0,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#00000070" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: "#00000050" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#2e006b08" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-base-white border border-gray-100 rounded-xl shadow-card p-3 max-w-xs">
                    <p className="text-xs text-base-black/50 mb-1">{truncate(d.fullName, 60)}</p>
                    <p className="text-primary font-bold text-lg">{d.average} <span className="text-xs font-normal text-base-black/40">/ 5.00</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="average" radius={[8, 8, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.average >= 4 ? "#2e006b" : entry.average >= 3 ? "#722bff" : "#ffd445"}
              />
            ))}
            <LabelList
              dataKey="average"
              position="top"
              style={{ fontSize: 11, fontWeight: 700, fill: "#2e006b" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
        {stats.map((s, i) => (
          <div key={s.question_id} className="flex items-start gap-2 max-w-[180px]">
            <span className="w-5 h-5 rounded bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-base-black/50 leading-relaxed">
              {s.question_text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
