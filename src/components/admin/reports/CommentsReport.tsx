"use client";

import { useState, useMemo } from "react";
import { formatDate } from "@/lib/utils";
import type { CommentRow, RawProfile, RawClass } from "./ReportsDashboard";

interface Props {
  comments: CommentRow[];
  teachers: RawProfile[];
  classes: RawClass[];
}

export default function CommentsReport({ comments, teachers, classes }: Props) {
  const [showStudentNames, setShowStudentNames] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState("__all__");
  const [filterClass, setFilterClass] = useState("__all__");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (filterTeacher !== "__all__" && !teachers.find((t) => t.id === filterTeacher && t.full_name === c.teacherName)) {
        const t = teachers.find((t2) => t2.id === filterTeacher);
        if (t && t.full_name !== c.teacherName) return false;
      }
      if (filterClass !== "__all__") {
        const cls = classes.find((cl) => cl.id === filterClass);
        if (cls && !c.className?.includes(cls.name)) return false;
      }
      if (search && !c.text.toLowerCase().includes(search.toLowerCase()) && !c.teacherName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [comments, filterTeacher, filterClass, search, teachers, classes]);

  // Teacher filter: keep only teachers who have comments
  const teachersWithComments = useMemo(() => {
    const names = new Set(comments.map((c) => c.teacherName));
    return teachers.filter((t) => names.has(t.full_name));
  }, [comments, teachers]);

  const classesWithComments = useMemo(() => {
    const names = new Set(comments.map((c) => c.className).filter(Boolean));
    return classes.filter((c) => [...names].some((n) => n?.includes(c.name)));
  }, [comments, classes]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          {/* Teacher filter */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-semibold text-base-black/50 mb-1.5">ครู</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-base-white"
            >
              <option value="__all__">ทุกคน</option>
              {teachersWithComments.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-semibold text-base-black/50 mb-1.5">ชั้นเรียน</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-base-white"
            >
              <option value="__all__">ทุกชั้น</option>
              {classesWithComments.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.academic_year})</option>
              ))}
            </select>
          </div>

          {/* Keyword search */}
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-semibold text-base-black/50 mb-1.5">ค้นหาคำ</label>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="พิมพ์คำค้นหา..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Show names toggle */}
          <div className="flex flex-col gap-1">
            <label className="block text-xs font-semibold text-base-black/50">แสดงชื่อนักเรียน</label>
            <button
              onClick={() => setShowStudentNames((p) => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                showStudentNames
                  ? "bg-primary text-base-white border-primary"
                  : "bg-base-white text-base-black/60 border-gray-200 hover:border-primary/30"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showStudentNames ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                )}
              </svg>
              {showStudentNames ? "กำลังแสดง" : "ซ่อนอยู่"}
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-base-black/40">
          แสดง {filtered.length} จาก {comments.length} ข้อเสนอแนะ
          {showStudentNames && (
            <span className="ml-2 bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">⚠ กำลังแสดงชื่อนักเรียน</span>
          )}
        </div>
      </div>

      {/* Comment cards */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <svg className="w-10 h-10 text-gray-200 mb-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
          </svg>
          <p className="text-base-black/40 text-sm">ไม่พบข้อเสนอแนะ</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => (
            <div key={i} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3">
                {/* Quote icon */}
                <div className="w-8 h-8 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-base-black leading-relaxed mb-3">{c.text}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Teacher */}
                    <span className="inline-flex items-center gap-1.5 text-xs bg-primary/8 text-primary font-semibold px-2.5 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      {c.teacherName}
                    </span>

                    {/* Subject */}
                    {c.teacherSubject && (
                      <span className="text-xs text-base-black/40">{c.teacherSubject}</span>
                    )}

                    {/* Class */}
                    {c.className && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{c.className}</span>
                    )}

                    {/* Student name (if toggle on) */}
                    {showStudentNames && c.studentName && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        </svg>
                        {c.studentName} {c.studentNumber ? `(${c.studentNumber})` : ""}
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-xs text-base-black/30 ml-auto">{formatDate(c.submittedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
