"use client";

import { useState, useEffect } from "react";

interface ProfessorCardProps {
  name: string;
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

export default function ProfessorCard({ name, course }: ProfessorCardProps) {
  const [info, setInfo] = useState<ProfessorInfo | null>(null);
  const [grades, setGrades] = useState<GradeRecord[] | null>(null);

  useEffect(() => {
    // 1) Professor info + reviews
    fetch(`${API_BASE}/professor?name=${encodeURIComponent(name)}&reviews=true`)
      .then((res) => res.json())
      .then((data: ProfessorInfo) => setInfo(data))
      .catch(console.error);

    // 2) Grades for this course + professor
    fetch(
      `${API_BASE}/grades?course=${encodeURIComponent(
        course
      )}&professor=${encodeURIComponent(name)}`
    )
      .then((res) => res.json())
      .then((data: GradeRecord[]) => setGrades(data))
      .catch(console.error);
  }, [name, course]);

  const avgGpa = (() => {
    // coerce into array or empty
    const arr = Array.isArray(grades) ? grades : [];
    if (arr.length === 0) return "FTC";

    const totalAvg =
      arr.reduce((sum, rec) => {
        const totalPoints =
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
        return sum + (count ? totalPoints / count : 0);
      }, 0) / arr.length;

    const str = totalAvg.toFixed(2);
    return isNaN(Number(str)) ? "FTC" : str;
  })();

  // compute the average of section GPAs

  return (
    <div className="w-full p-8 border rounded-lg shadow hover:shadow-lg transition">
      <h4 className="text-xl font-semibold mb-2">
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
        )}
        {" "}
      </h4>

      {info ? (
        <p>⭐ Rating: {info.average_rating.toFixed(2)}</p>
      ) : (
        <p className="text-gray-500">Loading rating…</p>
      )}

      {grades ? (
        <p>
          🎓 Avg. {course} GPA: {avgGpa}
        </p>
      ) : (
        <p className="text-gray-500">Loading grades…</p>
      )}

      {info?.reviews && (
        <p className="mt-2 text-sm text-gray-500">
          💬 {info.reviews.length} reviews
        </p>
      )}
    </div>
  );
}
