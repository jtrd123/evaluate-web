import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CreateFormButton from "@/components/admin/CreateFormButton";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function FormWindowBadge({ startAt, endAt }: { startAt: string | null; endAt: string | null }) {
  const now = new Date();
  if (!startAt && !endAt) {
    return <span className="text-xs text-base-black/30">ไม่จำกัดเวลา</span>;
  }
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;

  if (end && now > end) {
    return <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ปิดรับแล้ว</span>;
  }
  if (start && now < start) {
    return <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">เปิด {formatDate(startAt!)}</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />กำลังเปิดรับ</span>;
}

export default async function FormsPage() {
  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("evaluation_forms")
    .select("id, title, description, is_active, academic_year, start_at, end_at, created_at")
    .order("academic_year", { ascending: false })
    .order("created_at", { ascending: false });

  // Group by academic_year
  const grouped = new Map<string, typeof forms>();
  for (const form of forms ?? []) {
    const year = form.academic_year ?? "ไม่ระบุปี";
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(form);
  }
  const years = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-primary">แบบฟอร์มประเมิน</h1>
          <p className="text-base-black/50 text-sm mt-1">จัดการแบบฟอร์มและคำถาม จัดกลุ่มตามปีการศึกษา</p>
        </div>
        <CreateFormButton />
      </div>

      {(!forms || forms.length === 0) ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 bg-primary/8 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="font-semibold text-primary mb-1">ยังไม่มีแบบฟอร์ม</h3>
          <p className="text-base-black/50 text-sm">กดปุ่ม &ldquo;สร้างแบบฟอร์มใหม่&rdquo; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((year) => (
            <section key={year}>
              {/* Year header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                  </svg>
                </div>
                <h2 className="text-base font-black text-primary">ปีการศึกษา {year}</h2>
                <span className="text-xs text-base-black/40 bg-gray-100 px-2 py-0.5 rounded-full">
                  {grouped.get(year)!.length} แบบฟอร์ม
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.get(year)!.map((form) => (
                  <Link
                    key={form.id}
                    href={`/admin/forms/${form.id}`}
                    className="card card-hover flex flex-col gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        form.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {form.is_active ? "เปิดใช้งาน" : "ปิดอยู่"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-primary group-hover:text-primary/80 transition-colors leading-snug">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-base-black/50 mt-1 line-clamp-2">{form.description}</p>
                      )}
                    </div>

                    {/* Evaluation window status */}
                    <div className="flex items-center gap-2">
                      <FormWindowBadge startAt={form.start_at} endAt={form.end_at} />
                    </div>
                    {(form.start_at || form.end_at) && (
                      <p className="text-xs text-base-black/40 -mt-2">
                        {form.start_at ? formatDate(form.start_at) : "—"} → {form.end_at ? formatDate(form.end_at) : "ไม่มีวันหมดอายุ"}
                      </p>
                    )}

                    <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-base-black/40">{formatDate(form.created_at)}</span>
                      <span className="text-xs text-primary font-semibold group-hover:underline">
                        จัดการ →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
