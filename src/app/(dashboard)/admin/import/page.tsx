import StudentImportWizard from "@/components/admin/import/StudentImportWizard";
import TeacherImportWizard from "@/components/admin/import/TeacherImportWizard";

export default async function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-base-black">นำเข้าข้อมูล</h1>
        <p className="text-sm text-base-black/50 mt-1">
          นำเข้ารายชื่อนักเรียนและครูจากไฟล์ Excel ของโรงเรียน
        </p>
      </div>

      <div className="space-y-8">
        {/* Student import — dedicated wizard for school's Excel format */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base-black">นักเรียน</h2>
              <p className="text-xs text-base-black/50">ใช้ไฟล์ Excel format เดิมจากโรงเรียน</p>
            </div>
          </div>
          <div className="card">
            <StudentImportWizard />
          </div>
        </section>

        {/* Teachers — waiting for school's Excel template */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base-black">ครู</h2>
              <p className="text-xs text-base-black/50">ใช้ไฟล์ Excel Template_Teacher</p>
            </div>
          </div>
          <div className="card">
            <TeacherImportWizard />
          </div>
        </section>
      </div>
    </div>
  );
}
