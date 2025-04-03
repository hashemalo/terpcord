"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Course {
  code: string;
  name: string;
  professors?: string[];
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [showButton, setShowButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch data from the JSON file
    // and flatten the structure
    async function loadData() {
      try {
        const res = await fetch("/data/data.json");
        const data = await res.json();
        console.log("Loaded data:", data);
        const flatCourses: Course[] = data.depts.flatMap((dept: any) =>
          dept.courses.map((course: any) => ({
            code: course.name,
            name: course.description,
            professors: course.professors,
          }))
        );
        setCourses(flatCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    }
    loadData();
  }, []);

  // Handle scroll event to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    (course) =>
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow p-4">
      <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap"
          rel="stylesheet"
        />
        <div className="flex items-center justify-center space-x-3 select-none">
          <Image
            src="/terpcord.png"
            alt="TerpCord Logo"
            width={90}
            height={90}
            className="rounded-full"
          />
          <h1
            className="text-3xl font-bold tracking-tight uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <span className="text-red-500">Terp</span>
            <span className="text-blue-500">Cord</span>
          </h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4">
        <input
          type="text"
          placeholder="Search for courses..."
          className="w-full p-3 mb-4 border border-gray-700 bg-gray-800 text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul>
          {filteredCourses.map((course) => (
            <li
              key={course.code}
              className="p-4 mb-3 bg-gray-800 rounded shadow cursor-pointer hover:bg-gray-700 transition-colors"
              onClick={() => router.push(`/course/${course.code}`)}
            >
              <h2 className="text-xl font-semibold text-gray-100">
                {course.code}: {course.name}
              </h2>
              <p className="text-gray-400">{course.code.substring(0,4)}</p>
              {course.professors && (
                <p className="text-gray-500">
                  Professors: {course.professors.join(" | ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      </main>
      
      /* Scroll to Top Button */
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-opacity duration-500 ${
          showButton ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
    </div>
  );
}
