import { useEffect, useMemo, useState } from "react";
import { dashboardApi, mlApi } from "../../lib/api";
import { getUser } from "../../lib/auth";
import Card from "../../components/ui/Card";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Toast from "../../components/ui/Toast";
import Badge from "../../components/ui/Badge";

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-bold tracking-widest text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const user = getUser();

  const [overview, setOverview] = useState(null);
  const [rec, setRec] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ type: "", text: "" });

  const enoughSignal = useMemo(() => {
    const events = overview?.totalEvents ?? 0;
    return events >= 3; // threshold minimal biar ML gak ngarang
  }, [overview]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        const ov = await dashboardApi.overview();
        if (!alive) return;
        setOverview(ov);

        // 1) coba ambil recommendations dulu
        let r = null;
        try {
          r = await mlApi.myRecommendations();
        } catch {
          r = null;
        }

        if (!alive) return;
        setRec(r);

        // 2) Kalau belum ada rec, jangan generate kalau belum ada signal
        if (!r) {
          const events = ov?.totalEvents ?? 0;
          if (events < 3) {
            // intentionally do nothing
            return;
          }

          // generate hanya kalau sudah ada data yang masuk akal
          await mlApi.generateProfile();
          await mlApi.generateRecommendations();

          const r2 = await mlApi.myRecommendations().catch(() => null);
          if (!alive) return;
          setRec(r2);
          if (r2) setToast({ type: "success", text: "Insights generated based on your recent learning activity." });
          setTimeout(() => setToast({ type: "", text: "" }), 2500);
        }
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Loader label="Loading dashboard..." />;
  if (err) return <ErrorBox message={err} />;

  const persona = rec?.label || null;
  const summary = rec?.summary || null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900">
          Welcome, {user?.displayName || "User"}.
        </h1>
        <p className="mt-2 text-slate-600">
          Track your learning, pass quizzes, then we generate insights that actually mean something.
        </p>
      </header>

      {toast.text ? <Toast variant={toast.type}>{toast.text}</Toast> : null}

      <div className="grid gap-6 md:grid-cols-3">
        <Stat label="Total Events" value={overview?.totalEvents ?? 0} />
        <Stat label="Quiz Attempts" value={overview?.totalQuizAttempts ?? 0} />
        <Stat label="Pass Rate" value={`${overview?.passRate ?? 0}%`} />
      </div>

      <Card title="Learning Insights">
        {!enoughSignal ? (
          <div className="space-y-3">
            <Badge tone="neutral">Not enough activity</Badge>
            <p className="text-sm text-slate-700 leading-relaxed">
              You’re new here. Do a few learning actions first: start a module, take a quiz, submit results.
              After that, insights will appear.
            </p>
            <div className="text-sm text-slate-600">
              Minimum activity threshold: <b className="text-slate-900">3 events</b>.
            </div>
          </div>
        ) : !persona ? (
          <div className="space-y-3">
            <Badge tone="warning">Insights pending</Badge>
            <p className="text-sm text-slate-700 leading-relaxed">
              We have enough activity, but your insight hasn’t been generated yet. It should appear after profile
              and recommendation generation succeeds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-500">YOUR PERSONA</div>
                <div className="mt-1 text-2xl font-black text-slate-900">{String(persona).toUpperCase()}</div>
              </div>
              <Badge tone="success">Active</Badge>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
              {summary || "No summary provided yet."}
            </p>

            {(rec?.strengths?.length || rec?.risks?.length || rec?.tips?.length) ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-slate-900">Strengths</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {(rec?.strengths || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-slate-900">Risks</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {(rec?.risks || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-sm font-black text-slate-900">Tips</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {(rec?.tips || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Cluster detail belum diisi tim ML. Jadi kamu dapat label dan summary dulu.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title="Latest Activity">
        <div className="space-y-3">
          {(overview?.latestActivities || []).map((a) => (
            <div
              key={a._id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="text-sm font-black text-slate-900">{a.type}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(a.occurredAt).toLocaleString()}
                </div>
              </div>
              <Badge tone="neutral">{a.course || a.module ? "tracked" : "event"}</Badge>
            </div>
          ))}
          {!overview?.latestActivities?.length ? (
            <div className="text-sm text-slate-600">No activity yet.</div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}