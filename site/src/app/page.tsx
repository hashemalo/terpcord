"use client";

import {
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";

import ProfessorCard from "../components/prof";
import DualProf from "../components/dualprof";

interface CourseJson {
  name: string;
  professors: string[];
  description: string;
}

interface Dept {
  code: string;
  courses: CourseJson[];
}

interface DataJson {
  depts: Dept[];
}

interface CourseEntry {
  dept: string;
  name: string;
  description: string;
  professors: string[];
}

export default function Home() {
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CourseEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCourse, setSelectedCourse] = useState<CourseEntry | null>(
    null
  );

  // load & flatten JSON on mount
  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data: DataJson) => {
        const flat = data.depts.flatMap((dept) =>
          dept.courses.map((course) => ({
            dept: dept.code,
            name: course.name,
            description: course.description,
            professors: course.professors,
          }))
        );
        setCourses(flat);
      })
      .catch(console.error);
  }, []);

  // update suggestions when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = courses.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 10));
    setHighlightedIndex(-1);
  }, [query, courses]);

  // typing resets selection
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedCourse(null);
  };

  // pick a course
  const selectCourse = (course: CourseEntry) => {
    setSelectedCourse(course);
    setQuery(course.name);
    setSuggestions([]);
  };

  // keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectCourse(suggestions[highlightedIndex]);
      }
    }
  };

  return (
    <div className="mx-auto p-8 font-jakarta">
      <div className="flex justify-center items-center mb-8">
        <img
          src="/logo.png"
          alt="Dr. Terp Logo"
          className="w-25 h-25 select-none"
        />
        <h1 className="text-6xl font-bold font-rubik text-center select-none">
        <span className="text-red-500">Dr.</span>{" "}
        <span className="text-green-300">Terp</span>
      </h1>
      </div>
      <div className="absolute top-4 right-4 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
        * FTC: First Time Teaching
      </div>

      

      <div className="mx-auto w-1/2 relative">
        <input
          type="text"
          placeholder="Search courses… e.g. AAAS100"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full text-xl p-3 border rounded-lg focus:outline-none focus:ring"
        />

        {suggestions.length > 0 && !selectedCourse && (
          <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-lg text-black">
            {suggestions.map((c, idx) => (
              <li
                key={c.name}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e: MouseEvent) => {
                  e.preventDefault(); // prevent blur
                  selectCourse(c);
                }}
                className={`p-2 cursor-pointer text-black ${
                  idx === highlightedIndex ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedCourse && (
        <div className="w-full mt-8 flex flex-col space-y-8">
          <h2 className="text-2xl font-semibold">{selectedCourse.name}</h2>
          <p className="text-gray-400">{selectedCourse.description}</p>

          {(() => {
            // 1) Filter out TBA
            const raw = selectedCourse.professors.filter(
              (p) => p !== "Instructor: TBA"
            );

            // 2) Dual‐professor detection: single entry with comma
            if (raw.length === 1 && raw[0].includes(",")) {
              const splitNames = raw[0].split(",").map((n) => n.trim());
              // now splitNames.length should be 2
              return (
                <DualProf profs={splitNames} course={selectedCourse.name} />
              );
            }

            // 3) Zero instructors
            if (raw.length === 0) {
              return (
                <p className="text-xl font-semibold text-center text-gray-500">
                  Sorry, no professors have been assigned to this course yet.
                  Come back later!
                </p>
              );
            }

            // 4) One or more than two discrete instructors
            return (
              <div className="flex flex-row space-x-2 overflow-x-auto">
                {raw.map((prof) => (
                  <ProfessorCard
                    key={prof}
                    name={prof}
                    course={selectedCourse.name}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}
      <footer className="mt-auto text-gray-600">
        <div className="flex flex-col items-center justify-center space-y-2">
          <p>Hashem Alomar</p>
          <a
            href="mailto:halomar@umd.edu"
            className="text-gray-600 hover:underline"
          >
            halomar@umd.edu
          </a>
          <a
            href="https://github.com/hashemalo/terpcord"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-300 transition"
            aria-label="GitHub Repository"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.386-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.933 0-1.312.469-2.384 1.236-3.223-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.49 11.49 0 0 1 3-.404c1.02.005 2.045.138 3 .404 2.29-1.552 3.295-1.23 3.295-1.23.655 1.653.244 2.874.12 3.176.77.84 1.234 1.911 1.234 3.223 0 4.61-2.807 5.625-5.48 5.922.43.37.823 1.096.823 2.21v3.284c0 .32.19.694.8.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
