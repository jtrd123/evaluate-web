export type UserRole = "admin" | "teacher" | "student";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  school_id: string | null;
  employee_id: string | null;
  student_number: string | null;
  subject: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  academic_year: string;
  created_at: string;
}

export interface EvaluationForm {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  academic_year: string | null;   // e.g. "2567" — grouping label only
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationQuestion {
  id: string;
  form_id: string;
  question_text: string;
  question_type: "rating" | "text";
  min_value: number | null;
  max_value: number | null;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface EvaluationPeriod {
  id: string;
  form_id: string;
  title: string;          // e.g. "ครั้งที่ 1/2567"
  academic_year: string | null;
  start_at: string;       // evaluation window open
  end_at: string;         // evaluation window close
  is_active: boolean;
  created_at: string;
}

export interface TeacherAssignment {
  id: string;
  student_id: string;
  teacher_id: string;
  form_id: string;
  period_id: string;
  class_id: string | null;
  created_at: string;
}

export interface EvaluationSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  teacher_id: string;
  form_id: string;
  period_id: string;
  is_submitted: boolean;
  submitted_at: string | null;
  created_at: string;
}

export interface EvaluationResponse {
  id: string;
  submission_id: string;
  question_id: string;
  rating_value: number | null;
  text_value: string | null;
  created_at: string;
}

// ── Enriched types for UI ────────────────────────────────────────────────────

export type SubmissionStatus = Pick<EvaluationSubmission, "id" | "is_submitted" | "submitted_at">;

export interface AssignmentWithTeacher extends TeacherAssignment {
  teacher: Pick<Profile, "id" | "full_name" | "subject" | "employee_id" | "avatar_url">;
  form: Pick<EvaluationForm, "id" | "title" | "academic_year">;
  period: Pick<EvaluationPeriod, "id" | "title" | "academic_year" | "start_at" | "end_at">;
  // PostgREST returns one-to-many as array; access [0] in code
  submission: SubmissionStatus[] | null;
}

export interface TeacherResult {
  response_id: string;
  teacher_id: string;
  form_id: string;
  period_id: string;
  submitted_at: string;
  question_id: string;
  question_text: string;
  question_type: "rating" | "text";
  order_index: number;
  rating_value: number | null;
  text_value: string | null;
}

// Average score per question aggregated for teacher dashboard
export interface QuestionStat {
  question_id: string;
  question_text: string;
  question_type: "rating" | "text";
  order_index: number;
  average: number | null;
  responses: number;
}

export interface AdminSubmissionRow {
  student_name: string;
  student_number: string;
  teacher_name: string;
  teacher_id: string;
  is_submitted: boolean;
  submitted_at: string | null;
}
