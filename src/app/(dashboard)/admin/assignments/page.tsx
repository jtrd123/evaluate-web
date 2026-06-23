import { createClient } from "@/lib/supabase/server";
import AssignmentManager from "@/components/admin/AssignmentManager";
import ClassAssignmentPanel from "@/components/admin/ClassAssignmentPanel";
import ClassTeacherView from "@/components/admin/ClassTeacherView";
import YearSelector from "@/components/admin/YearSelector";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const supabase = await createClient();

  // ── 1. Collect all available academic years ────────────────────────────────
  const [{ data: yForms }, { data: yPeriods }, { data: yClasses }] = await Promise.all([
    supabase.from("evaluation_forms").select("academic_year").not("academic_year", "is", null),
    supabase.from("evaluation_periods").select("academic_year").not("academic_year", "is", null),
    supabase.from("classes").select("academic_year").not("academic_year", "is", null),
  ]);

  const allYears = Array.from(
    new Set([
      ...(yForms ?? []).map((r) => r.academic_year as string),
      ...(yPeriods ?? []).map((r) => r.academic_year as string),
      ...(yClasses ?? []).map((r) => r.academic_year as string),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // ── 2. Fetch data, filtered by year when selected ──────────────────────────
  const classesQuery = supabase.from("classes").select("id, name, academic_year").order("name");
  if (year) classesQuery.eq("academic_year", year);

  const formsQuery = supabase.from("evaluation_forms").select("id, title, academic_year").eq("is_active", true).order("created_at");
  if (year) formsQuery.eq("academic_year", year);

  const periodsQuery = supabase.from("evaluation_periods").select("id, title, academic_year, end_at").order("start_at", { ascending: false });
  if (year) periodsQuery.eq("academic_year", year);

  const [
    { data: teachers },
    { data: classes },
    { data: forms },
    { data: periods },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, employee_id, subject").eq("role", "teacher").order("full_name"),
    classesQuery,
    formsQuery,
    periodsQuery,
  ]);

  // ── 3. Filter students to those whose class is in the filtered set ─────────
  const classIds = (classes ?? []).map((c) => c.id);
  const studentsQuery = supabase
    .from("profiles")
    .select("id, full_name, student_number, class_id")
    .eq("role", "student")
    .order("full_name");
  if (year && classIds.length > 0) studentsQuery.in("class_id", classIds);
  else if (year && classIds.length === 0) studentsQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // no match

  // ── 4. Fetch assignments, include period.academic_year for grouping ─────────
  const assignmentsQuery = supabase
    .from("teacher_assignments")
    .select(`
      id, created_at,
      student:profiles!teacher_assignments_student_id_fkey (id, full_name, student_number),
      teacher:profiles!teacher_assignments_teacher_id_fkey (id, full_name, employee_id, subject),
      form:evaluation_forms!teacher_assignments_form_id_fkey (id, title),
      period:evaluation_periods!teacher_assignments_period_id_fkey (id, title, academic_year),
      class:classes (id, name)
    `)
    .order("created_at", { ascending: false });

  const [{ data: students }, { data: assignments }] = await Promise.all([
    studentsQuery,
    assignmentsQuery,
  ]);

  // Student count per class (for ClassTeacherView)
  const studentCounts: Record<string, number> = {};
  for (const s of students ?? []) {
    if (s.class_id) studentCounts[s.class_id] = (studentCounts[s.class_id] ?? 0) + 1;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-primary">จับคู่ครู–นักเรียน</h1>
          <p className="text-base-black/50 text-sm mt-1">กำหนดนักเรียนคนไหนประเมินครูคนไหน</p>
        </div>
        {allYears.length > 0 && (
          <YearSelector years={allYears} currentYear={year ?? ""} basePath="/admin/assignments" />
        )}
      </div>

      {/* Class-based bulk assignment */}
      <div className="mb-6">
        <ClassAssignmentPanel
          teachers={teachers ?? []}
          classes={classes ?? []}
          forms={forms ?? []}
          periods={periods ?? []}
        />
      </div>

      {/* Relationship overview */}
      <div className="mb-6">
        <ClassTeacherView
          periods={periods ?? []}
          classes={classes ?? []}
          studentCounts={studentCounts}
        />
      </div>

      {/* Individual / manual assignment */}
      <AssignmentManager
        teachers={teachers ?? []}
        students={students ?? []}
        forms={forms ?? []}
        periods={periods ?? []}
        classes={classes ?? []}
        yearFilter={year ?? ""}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialAssignments={(assignments ?? []) as any}
      />
    </div>
  );
}
