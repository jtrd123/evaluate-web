"use client";

interface ClassEntry {
  name: string;
  year: string;
  total: number;
  done: number;
}

interface ActivityRow {
  id: string;
  submitted_at: string | null;
  teacher: { full_name: string; employee_id: string } | null;
  period: { title: string } | null;
}

interface Props {
  classSummary: ClassEntry[];
  recentActivity: ActivityRow[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "เมื่อกี้";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const d = Math.floor(h / 24);
  return `${d} วันที่แล้ว`;
}

export default function AdminDashboard({ classSummary, recentActivity }: Props) {
  return (
    <div className="space-y-6">
      {/* Class completion */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-primary">ความคืบหน้าแยกตามห้อง</h2>
          <a href="/admin/reports" className="text-xs font-semibold text-primary/60 hover:text-primary transition-colors">
            ดูรายงานเต็ม →
          </a>
        </div>

        {classSummary.length === 0 ? (
          <p className="text-sm text-base-black/40 text-center py-8">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {classSummary.map((c) => {
              const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
              const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
              const textColor = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
              return (
                <div key={`${c.name}|${c.year}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-base-black">{c.name}</span>
                      <span className="text-xs text-base-black/30">({c.year})</span>
                    </div>
                    <span className={`text-xs font-bold ${textColor}`}>
                      {c.done}/{c.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-primary">กิจกรรมล่าสุด</h2>
          <span className="text-xs text-base-black/30">การส่งประเมิน 8 รายการล่าสุด</span>
        </div>

        {recentActivity.length === 0 ? (
          <p className="text-sm text-base-black/40 text-center py-6">ยังไม่มีการส่งประเมิน</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-base-black truncate">
                    {row.teacher?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-base-black/40 truncate">
                    {row.period?.title ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-base-black/30 shrink-0">{timeAgo(row.submitted_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
