import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { coursesApi } from "../../lib/api";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Toast from "../../components/ui/Toast";

function CourseCard({ item, onEnroll, enrolling }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="h-36 w-full bg-gradient-to-br from-slate-900 to-slate-700" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            <span className="material-symbols-outlined text-[16px]">school</span>
            Course
          </div>

          <h3 className="mt-3 text-lg font-black text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-3">
            {item.description || "No description."}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/courses/${item._id}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50"
          >
            Detail
          </Link>

          <button
            onClick={() => onEnroll(item._id)}
            disabled={enrolling}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {enrolling ? "..." : "Enroll"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const data = await coursesApi.list();
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to fetch courses");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const title = (x.title || "").toLowerCase();
      const desc = (x.description || "").toLowerCase();
      return title.includes(s) || desc.includes(s);
    });
  }, [items, q]);

  const onEnroll = async (courseId) => {
    setToast({ type: "", text: "" });
    setBusyId(courseId);
    try {
      await coursesApi.enroll(courseId);
      setToast({ type: "success", text: "Enrolled. Activity logged." });
    } catch (e) {
      setToast({ type: "error", text: e.message || "Enroll failed" });
    } finally {
      setBusyId("");
      setTimeout(() => setToast({ type: "", text: "" }), 2500);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900">Courses</h1>
        <p className="mt-2 text-slate-600">
          Browse and enroll. Progress will track after you start modules and submit quizzes.
        </p>
      </header>

      <div className="max-w-md">
        <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-4">
          <span className="material-symbols-outlined text-slate-400">search</span>
          <input
            className="ml-3 w-full bg-transparent text-sm outline-none"
            placeholder="Search courses..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {toast.text ? <Toast variant={toast.type}>{toast.text}</Toast> : null}

      {loading ? <Loader label="Loading courses..." /> : null}
      {err ? <ErrorBox message={err} /> : null}

      {!loading && !err ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c._id} item={c} onEnroll={onEnroll} enrolling={busyId === c._id} />
          ))}
        </div>
      ) : null}
    </div>
  );
}