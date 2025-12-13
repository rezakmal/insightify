import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { modulesApi } from "../../lib/api";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Card from "../../components/ui/Card";
import Toast from "../../components/ui/Toast";
import Badge from "../../components/ui/Badge";
import { getUser } from "../../lib/auth";

function toneFromStatus(st) {
  if (st === "completed") return "success";
  if (st === "in_progress") return "warning";
  if (st === "completed_not_passed") return "danger";
  return "neutral";
}

export default function ModulePage() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const userId = getUser()?._id;

  const [mod, setMod] = useState(null);
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [locked, setLocked] = useState(false);

  const [toast, setToast] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLocked(false);
      setToast({ type: "", text: "" });
      setLoading(true);

      try {
        const m = await modulesApi.get(moduleId, { courseId });

        let s = null;
        try {
          s = await modulesApi.status(moduleId);
        } catch {
          s = null;
        }

        if (!alive) return;
        setMod(m);
        setStatus(s);
      } catch (e) {
        if (!alive) return;
        if (e.status === 403) {
          setLocked(true);
          setErr(e.message || "You must complete the previous module quiz first.");
        } else {
          setErr(e.message || "Failed to load module");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, [courseId, moduleId, userId]);

  const startModule = async () => {
    if (busy || locked) return;
    setToast({ type: "", text: "" });
    setBusy(true);
    try {
      await modulesApi.start(moduleId, courseId);
      setToast({ type: "success", text: "Module started. Activity logged." });
      const s = await modulesApi.status(moduleId).catch(() => null);
      if (s) setStatus(s);
    } catch (e) {
      setToast({ type: "error", text: e.message || "Start failed" });
    } finally {
      setBusy(false);
      setTimeout(() => setToast({ type: "", text: "" }), 2500);
    }
  };

  const canGoQuiz = useMemo(() => {
    if (locked) return false;
    const st = status?.status;
    return st === "not_started" || st === "in_progress" || st === "completed" || st === "completed_not_passed" || !st;
  }, [status, locked]);

  const goToQuiz = async () => {
    if (!canGoQuiz || busy) return;
    setBusy(true);
    setToast({ type: "", text: "" });
    try {
      // pastikan ada module_start untuk duration quiz
      const st = status?.status;
      if (st === "not_started" || !st) {
        await modulesApi.start(moduleId, courseId);
        const s = await modulesApi.status(moduleId).catch(() => null);
        if (s) setStatus(s);
      }

      navigate(`/courses/${courseId}/modules/${moduleId}/quiz`);
    } catch (e) {
      if (e.status === 403) {
        setLocked(true);
        setErr(e.message || "Locked. Finish previous module quiz first.");
        return;
      }
      setToast({ type: "error", text: e.message || "Failed to start quiz" });
      setTimeout(() => setToast({ type: "", text: "" }), 2500);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading module..." />;
  if (err) {
    return (
      <div className="space-y-4">
        <ErrorBox message={err} />
        {locked ? (
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
          >
            Back to Course
          </button>
        ) : null}
      </div>
    );
  }

  const stText = status?.status || "unknown";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black text-slate-900">{mod?.title}</h1>
          <div className="mt-3">
            <Badge tone={toneFromStatus(stText)}>{stText}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={startModule}
            disabled={busy || locked}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          >
            {busy ? "..." : "Start"}
          </button>

          <button
            type="button"
            onClick={goToQuiz}
            disabled={!canGoQuiz || busy}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Starting..." : "Go to Quiz"}
          </button>
        </div>
      </header>

      {toast.text ? <Toast variant={toast.type}>{toast.text}</Toast> : null}

      <Card title="Content">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
          {mod?.content || "No content."}
        </pre>
      </Card>
    </div>
  );
}
