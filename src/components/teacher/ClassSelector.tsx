"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function ClassSelector({ classes, currentClassId }: { classes: { id: string; name: string; academic_year: string }[]; currentClassId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(classId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (classId) params.set("classId", classId);
    else params.delete("classId");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => go("")}
        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${!currentClassId ? "bg-primary text-white" : "bg-white text-base-black/60 border border-gray-200 hover:border-primary/30"}`}>
        ทุกชั้น
      </button>
      {classes.map(cls => (
        <button key={cls.id} onClick={() => go(cls.id)}
          className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${currentClassId === cls.id ? "bg-primary text-white" : "bg-white text-base-black/60 border border-gray-200 hover:border-primary/30"}`}>
          {cls.name}
        </button>
      ))}
    </div>
  );
}
