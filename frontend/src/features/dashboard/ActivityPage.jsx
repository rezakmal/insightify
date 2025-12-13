import { useEffect, useState } from "react";
import { learningApi } from "../../lib/api";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { fmtDateTime } from "../../lib/format";

function toneFromType(type) {
  if (type?.includes("quiz_submit")) return "success";
  if (type?.includes("quiz_start")) return "warning";
  if (type?.includes("module_complete")) return "success";
  if (type?.includes("module_start")) return "warning";
  return "neutral";
}

export default function ActivityPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const res = await learningApi.myActivity({ page: 1, limit: 50 });
        if (!alive) return;
        setData(res);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load activity");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, []);

  if (loading) return <Loader label="Loading activity..." />;
  if (err) return <ErrorBox message={err} />;

  const items = data?.data || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black text-slate-900">Activity</h1>
        <p className="mt-2 text-slate-600">Last 50 tracked events from your learning flow.</p>
      </header>

      <Card title="Events">
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a._id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-black text-slate-900">{a.type}</div>
                <div className="mt-1 text-xs text-slate-500">{fmtDateTime(a.occurredAt)}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {a.course ? <Badge tone="neutral">course</Badge> : null}
                {a.module ? <Badge tone="neutral">module</Badge> : null}
                <Badge tone={toneFromType(a.type)}>{a.type?.split("_")[0] || "event"}</Badge>
              </div>
            </div>
          ))}

          {!items.length ? <div className="text-sm text-slate-600">No activity yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}