"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { AssignmentWithTeacher } from "@/lib/types/database.types";

interface TeacherEvalCardProps {
  assignment: AssignmentWithTeacher;
  systemEnabled?: boolean;
}

function StatusBadge({ isSubmitted }: { isSubmitted: boolean }) {
  if (isSubmitted) {
    return (
      <span className="badge-done">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        ประเมินแล้ว
      </span>
    );
  }
  return (
    <span className="badge-pending">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      รอประเมิน
    </span>
  );
}

function TeacherAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm border border-primary/10 shrink-0">
      <span className="text-primary font-bold text-lg">{initials}</span>
    </div>
  );
}

export default function TeacherEvalCard({ assignment, systemEnabled = true }: TeacherEvalCardProps) {
  const { teacher, form, period } = assignment;

  // PostgREST returns one-to-many as array — get first element
  const submission = Array.isArray(assignment.submission)
    ? assignment.submission[0] ?? null
    : assignment.submission;

  const isSubmitted = submission?.is_submitted ?? false;

  // Access window lives on the period
  const now = new Date();
  const isExpired = now > new Date(period.end_at);
  const isNotStarted = now < new Date(period.start_at);

  const isDisabled = isSubmitted || isExpired || isNotStarted || !systemEnabled;

  return (
    <article className="card group relative overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 animate-slide-up">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50 rounded-l-2xl" />

      <div className="pl-4 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TeacherAvatar name={teacher.full_name} />
            <div className="min-w-0">
              <h3 className="font-bold text-primary text-base leading-snug truncate">{teacher.full_name}</h3>
              {teacher.subject && (
                <p className="text-base-black/60 text-sm mt-0.5 truncate">{teacher.subject}</p>
              )}
              {teacher.employee_id && (
                <p className="text-base-black/40 text-xs mt-0.5 font-mono">รหัส: {teacher.employee_id}</p>
              )}
            </div>
          </div>
          <StatusBadge isSubmitted={isSubmitted} />
        </div>

        <div className="border-t border-gray-100" />

        {/* Period / form info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-black/50">
          {(form.academic_year || period.academic_year) && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
              </svg>
              <span>ปี {form.academic_year ?? period.academic_year}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isExpired ? (
              <span className="text-red-400 font-medium">หมดเขตแล้ว</span>
            ) : isNotStarted ? (
              <span className="text-amber-500 font-medium">
                เปิดรับ {formatDate(period.start_at)}
              </span>
            ) : (
              <span>ถึง {formatDate(period.end_at)}</span>
            )}
          </div>
        </div>

        {/* Already submitted notice */}
        {isSubmitted && submission?.submitted_at && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-green-700">ส่งการประเมินแล้ว</p>
              <p className="text-xs text-green-600/70">เมื่อ {formatDate(submission.submitted_at)}</p>
            </div>
          </div>
        )}

        {/* Star placeholder (pending state only) */}
        {!isSubmitted && !isExpired && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-xs text-base-black/40">ยังไม่ได้ให้คะแนน</span>
          </div>
        )}

        {/* CTA */}
        {!isDisabled ? (
          <Link
            href={`/student/evaluate/${assignment.id}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-primary font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-accent/90 hover:shadow-glow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            เริ่มประเมิน
          </Link>
        ) : (
          <button disabled className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-semibold text-sm px-5 py-2.5 rounded-xl cursor-not-allowed">
            {isSubmitted ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                ประเมินเสร็จแล้ว
              </>
            ) : isNotStarted ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ยังไม่ถึงเวลาเปิดรับ
              </>
            ) : !systemEnabled ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                ระบบปิดชั่วคราว
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                หมดเวลาประเมิน
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
