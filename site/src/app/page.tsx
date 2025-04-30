"use client";

import {
  useState,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";

interface CourseJson {
  name:        string;
  professors:  string[];
  description: string;
}

interface Dept {
  code:    string;
  courses: CourseJson[];
}

interface DataJson {
  depts: Dept[];
}

interface CourseEntry {
  dept:        string;
  name:        string;
  description: string;
  professors:  string[];
}

export default function Home() {
  const [courses, setCourses]           = useState<CourseEntry[]>([]);
  const [query, setQuery]               = useState("");
  const [suggestions, setSuggestions]   = useState<CourseEntry[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCourse, setSelectedCourse]     = useState<CourseEntry | null>(null);

  // load & flatten JSON on mount
  useEffect(() => {
    fetch("/data.json")
      .then(res => res.json())
      .then((data: DataJson) => {
        const flat = data.depts.flatMap(dept =>
          dept.courses.map(course => ({
            dept:        dept.code,
            name:        course.name,
            description: course.description,
            professors:  course.professors,
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
    const filtered = courses.filter(c =>
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
      setHighlightedIndex(i =>
        i < suggestions.length - 1 ? i + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i =>
        i > 0 ? i - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        selectCourse(suggestions[highlightedIndex]);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Dr. Terp</h1>

      <div className="relative">
        <input
          type="text"
          placeholder="Search courses… e.g. AAAS100"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring"
        />

        {suggestions.length > 0 && !selectedCourse && (
          <ul className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto text-black">
            {suggestions.map((c, idx) => (
              <li
                key={c.name}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e: MouseEvent) => {
                  e.preventDefault(); // prevent blur
                  selectCourse(c);
                }}
                className={`p-2 cursor-pointer text-black ${
                  idx === highlightedIndex
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                }`}
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedCourse && (
        <div className="mt-8 p-4 border rounded-lg shadow">
          <h2 className="text-2xl font-semibold">
            {selectedCourse.name}
          </h2>
          <p className="mt-2 text-gray-700">
            {selectedCourse.description}
          </p>
          <h3 className="mt-4 font-semibold">Professors:</h3>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {selectedCourse.professors.map(prof => (
              <li key={prof}>{prof}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
