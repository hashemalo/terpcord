"use client";

import { useState, useEffect } from "react";

interface DualProfProps {
  profs: string[]; // exactly two entries
  course: string;
}

interface ProfessorInfo {
  name: string;
  slug: string;
  type: "professor" | "ta";
  courses: string[];
  average_rating: number;
  reviews?: any[];
}

interface GradeRecord {
  course: string;
  professor: string;
  semester: string;
  section: string;
  "A+": number;
  A: number;
  "A-": number;
  "B+": number;
  B: number;
  "B-": number;
  "C+": number;
  C: number;
  "C-": number;
  "D+": number;
  D: number;
  "D-": number;
  F: number;
  W: number;
  Other: number;
}

const API_BASE = "https://planetterp.com/api/v1";

export default function DualProf({ profs, course }: DualProfProps) {
  const [infos, setInfos] = useState<ProfessorInfo[]>([]);
  const [gradesArr, setGradesArr] = useState<GradeRecord[][]>([]);

  useEffect(() => {
    // Fetch both professors’ info + reviews
    Promise.all(
      profs.map((name) =>
        fetch(
          `${API_BASE}/professor?name=${encodeURIComponent(name)}&reviews=true`
        ).then((r) => r.json())
      )
    )
      .then((data: ProfessorInfo[]) => setInfos(data))
      .catch(console.error);

    // Fetch both professors’ grade records
    Promise.all(
      profs.map((name) =>
        fetch(
          `${API_BASE}/grades?course=${encodeURIComponent(
            course
          )}&professor=${encodeURIComponent(name)}`
        ).then((r) => r.json())
      )
    )
      .then((data: GradeRecord[] | GradeRecord[][]) =>
        setGradesArr(
          (data as GradeRecord[][]).map((d) => (Array.isArray(d) ? d : [d]))
        )
      )
      .catch(console.error);
  }, [profs, course]);

  const calcAvgGpa = (records: GradeRecord[]) => {
    if (!records.length) return "FTC";
    const total = records.reduce((sum, rec) => {
      const pts =
        rec["A+"] * 4 +
        rec["A"] * 4 +
        rec["A-"] * 3.7 +
        rec["B+"] * 3.3 +
        rec["B"] * 3 +
        rec["B-"] * 2.7 +
        rec["C+"] * 2.3 +
        rec["C"] * 2 +
        rec["C-"] * 1.7 +
        rec["D+"] * 1.3 +
        rec["D"] * 1 +
        rec["D-"] * 0.7;
      const count = Object.values(rec).reduce(
        (c, v) => c + (typeof v === "number" ? v : 0),
        0
      );
      return sum + (count ? pts / count : 0);
    }, 0);
    const avg = total / records.length;
    const s = avg.toFixed(2);
    return isNaN(Number(s)) ? "FTC" : s;
  };

  if (infos.length < profs.length || gradesArr.length < profs.length) {
    return <p className="text-gray-500">Loading instructors…</p>;
  }

  return (
    <div className="w-full p-8 border rounded-lg shadow-lg hover:shadow-xl transition">
      <h4 className="text-2xl font-semibold mb-4">
        {profs[0]} & {profs[1]}
      </h4>
      <div className="flex divide-x-2">
        {profs.map((name, i) => {
          const info = infos[i];
          const grades = gradesArr[i];
          return (
            <div key={name} className="flex-1 p-4">
              <h5 className="text-xl font-medium mb-2">
                {info ? (
                  <a
                    href={`https://planetterp.com/professor/${info.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {info.name}
                  </a>
                ) : (
                  <span>{name}</span>
                )}{" "}
              </h5>
              <p>⭐ Rating: {info.average_rating.toFixed(2)}</p>
              <p>
                🎓 Avg. {course} GPA: {calcAvgGpa(grades)}
              </p>
              {info.reviews && (
                <p className="mt-2 text-sm text-gray-500">
                  💬 {info.reviews.length} reviews
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
