import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi, modulesApi } from "../../lib/api";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Card from "../../components/ui/Card";
import Toast from "../../components/ui/Toast";
import Badge from "../../components/ui/Badge";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-bold tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function statusTone(st) {
  if (st === "completed") return "success";
  if (st === "in_progress") return "warning";
  if (st === "completed_not_passed") return "danger";
  return "neutral";
}

function statusLabel(st) {
  if (st === "completed") return "Completed";
  if (st === "in_progress") return "In progress";
  if (st === "completed_not_passed") return "Completed (Not passed)";
  if (st === "not_started") return "Not started";
  return "Unknown";
}

export default function CourseDetailPage() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [moduleStatuses, setModuleStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const loadProgress = async () => {
    try {
      const p = await coursesApi.progress(courseId);
      setProgress(p);
      return p;
    } catch {
      setProgress(null);
      return null;
    }
  };

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [c, m] = await Promise.all([coursesApi.detail(courseId), coursesApi.modules(courseId)]);
        if (!alive) return;
        setCourse(c);
        setModules(Array.isArray(m) ? m : []);

        // progress (auth)
        await loadProgress();

        // Status tiap modul (auth) optional, tapi berguna
        if (Array.isArray(m) && m.length) {
          const pairs = await Promise.all(
            m.map(async (mod) => {
              try {
                const st = await modulesApi.status(mod._id);
                return [mod._id, st?.status || "unknown"];
              } catch {
                return [mod._id, "unknown"];
              }
            })
          );
          if (!alive) return;
          setModuleStatuses(Object.fromEntries(pairs));
        }
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load course");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [courseId]);

  const onEnroll = async () => {
    setToast({ type: "", text: "" });
    setBusy(true);
    try {
      await coursesApi.enroll(courseId);
      setToast({ type: "success", text: "Enrolled. Progress tracking enabled." });
      await loadProgress();
    } catch (e) {
      setToast({ type: "error", text: e.message || "Enroll failed" });
    } finally {
      setBusy(false);
      setTimeout(() => setToast({ type: "", text: "" }), 2500);
    }
  };

  const nextModuleId = useMemo(() => {
    const nm = progress?.nextModule;
    return nm?._id ? nm._id : nm ? String(nm) : null;
  }, [progress]);

  const isEnrolled = useMemo(() => {
    // Backend kamu ga kasih field explicit "enrolled", jadi kita infer:
    // kalau progress bisa dibaca -> token valid dan userCourse exist (biasanya setelah enroll).
    return !!progress;
  }, [progress]);

  if (loading) return <Loader label="Loading course..." />;
  if (err) return <ErrorBox message={err} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-slate-900">{course?.title}</h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            {course?.description || "No description."}
          </p>
        </div>

        {!isEnrolled ? (
          <button
            onClick={onEnroll}
            disabled={busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Enrolling..." : "Enroll"}
          </button>
        ) : (
          <Badge tone="success" className="self-start">Enrolled</Badge>
        )}
      </header>

      {toast.text ? <Toast variant={toast.type}>{toast.text}</Toast> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Progress" className="lg:col-span-1">
          {!progress ? (
            <div className="text-sm text-slate-600 leading-relaxed">
              Enroll to track progress and unlock module gating.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Modules" value={`${progress.completedModules}/${progress.totalModules}`} />
                <Stat label="Progress" value={`${progress.progressPercentage}%`} />
              </div>

              {progress.isFinished ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <div className="text-sm font-bold">Course Completed</div>
                  <div className="mt-1 text-sm text-emerald-800">
                    You finished all modules. Your results are recorded.
                  </div>
                </div>
              ) : nextModuleId ? (
                <Link
                  to={`/courses/${courseId}/modules/${nextModuleId}`}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Continue
                </Link>
              ) : (
                <div className="text-sm text-slate-500">No next module.</div>
              )}
            </div>
          )}
        </Card>

        <Card title="Modules" className="lg:col-span-2">
          <div className="space-y-3">
            {modules.map((m, idx) => {
              const st = moduleStatuses[m._id] || "unknown";
              return (
                <Link
                  key={m._id}
                  to={`/courses/${courseId}/modules/${m._id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {idx + 1}. {m.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {m.content || "No content."}
                      </div>
                    </div>

                    <Badge tone={statusTone(st)}>{statusLabel(st)}</Badge>
                  </div>
                </Link>
              );
            })}

            {modules.length === 0 ? (
              <div className="text-sm text-slate-600">No modules.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}


