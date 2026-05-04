import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import QuestionManager from "@/components/admin/QuestionManager";
import FormToggle from "@/components/admin/FormToggle";
import FormSettings from "@/components/admin/FormSettings";
import PeriodManager from "@/components/admin/PeriodManager";
import DeleteFormButton from "@/components/admin/DeleteFormButton";

export const dynamic = "force-dynamic";

export default async function FormDetailPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const supabase = await createClient();

  const [{ data: form }, { data: questions }, { data: periods }] = await Promise.all([
    supabase
      .from("evaluation_forms")
      .select("id, title, description, is_active, academic_year, created_at")
      .eq("id", formId)
      .single(),
    supabase
      .from("evaluation_questions")
      .select("*")
      .eq("form_id", formId)
      .order("order_index"),
    supabase
      .from("evaluation_periods")
      .select("id, title, academic_year, start_at, end_at")
      .eq("form_id", formId)              // ← only periods for THIS form
      .order("start_at", { ascending: false }),
  ]);

  if (!form) notFound();

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-base-black/40 mb-6">
        <Link href="/admin/forms" className="hover:text-primary transition-colors">แบบฟอร์มประเมิน</Link>
        <span>/</span>
        {form.academic_year && (
          <>
            <span>ปีการศึกษา {form.academic_year}</span>
            <span>/</span>
          </>
        )}
        <span className="text-primary font-medium truncate">{form.title}</span>
      </div>

      {/* Form header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-primary">{form.title}</h1>
            {form.academic_year && (
              <span className="inline-block mt-1 text-xs font-semibold text-primary/70 bg-primary/8 px-2.5 py-0.5 rounded-full">
                ปีการศึกษา {form.academic_year}
              </span>
            )}
            {form.description && (
              <p className="text-base-black/50 text-sm mt-2">{form.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <FormToggle formId={form.id} isActive={form.is_active} />
            <DeleteFormButton formId={form.id} formTitle={form.title} />
          </div>
        </div>
      </div>

      {/* Academic year setting */}
      <div className="mb-6">
        <FormSettings
          formId={form.id}
          initialAcademicYear={form.academic_year ?? null}
        />
      </div>

      {/* Questions */}
      <div className="mb-6">
        <QuestionManager formId={form.id} initialQuestions={questions ?? []} />
      </div>

      {/* Periods — each is one evaluation round with its own date window */}
      <PeriodManager
        formId={form.id}
        formAcademicYear={form.academic_year ?? null}
        initialPeriods={periods ?? []}
      />
    </div>
  );
}
