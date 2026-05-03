# Teacher Evaluation App — Setup Guide

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL and anon key
```

## 3. Set up Supabase database
1. Go to [Supabase Dashboard](https://supabase.com) → SQL Editor
2. Run `supabase/schema.sql`  ← creates all tables + RLS policies
3. Create 3 auth users via Supabase Auth → Users → "Add user":
   - admin@school.ac.th / password123
   - teacher1@school.ac.th / password123
   - student1@school.ac.th / password123
4. Run `supabase/seed.sql`  ← inserts profiles, form, questions, assignment

## 4. Enable Google Auth (optional)
Supabase Dashboard → Authentication → Providers → Google → Enable

## 5. Run development server
```bash
npm run dev
# → http://localhost:3000
```

---

## Project structure
```
src/
├── app/
│   ├── login/              Login page (email + Google)
│   ├── auth/callback/      OAuth callback route
│   ├── (dashboard)/
│   │   ├── student/        Student dashboard + evaluation form
│   │   ├── teacher/        Teacher results dashboard
│   │   └── admin/          Admin overview + submission table
│   ├── layout.tsx
│   └── page.tsx            Root redirect by role
├── components/
│   ├── Navbar.tsx
│   ├── ui/Button.tsx
│   ├── student/TeacherEvalCard.tsx
│   ├── teacher/TeacherResultsChart.tsx
│   └── admin/AdminDashboard.tsx
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── types/database.types.ts
│   └── utils.ts
├── middleware.ts            Route protection + role-based redirect
supabase/
├── schema.sql              Tables + indexes + RLS policies + view
└── seed.sql                Mock data for 3 test users
```

## Security highlights
- **Students**: write-only on `evaluation_responses` (INSERT, no SELECT)
- **Teachers**: read via `teacher_evaluation_results` VIEW — student_id is excluded at the database level
- **Admin**: full access via `get_my_role() = 'admin'` RLS policies
- All routes protected via Next.js middleware with role checks
- Prevent double-submission: UNIQUE(student_id, teacher_id, period_id)
