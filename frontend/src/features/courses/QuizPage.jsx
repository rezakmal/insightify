import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { modulesApi, quizApi } from "../../lib/api";
import Loader from "../../components/ui/Loader";
import ErrorBox from "../../components/ui/ErrorBox";
import Card from "../../components/ui/Card";
import Toast from "../../components/ui/Toast";
import Badge from "../../components/ui/Badge";

export default function QuizPage() {
  const { courseId, moduleId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;

    async function start() {
      setErr("");
      setToast({ type: "", text: "" });
      setResult(null);
      setAnswers({});
      setLoading(true);

      try {
        const q = await quizApi.start(moduleId, courseId);
        if (!alive) return;
        setQuiz(q);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to start quiz");
      } finally {
        if (alive) setLoading(false);
      }
    }

    start();
    return () => {
      alive = false;
    };
  }, [courseId, moduleId]);

  const questions = useMemo(() => {
    const raw = quiz?.questions || [];
    return raw.map((q) => ({
      ...q,
      questionId: String(q?.questionId ?? ""),
      options: Array.isArray(q?.options) ? q.options : [],
    }));
  }, [quiz]);

  const canSubmit = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((q) => {
      const picked = answers[q.questionId];
      return typeof picked === "string" && picked.trim().length > 0;
    });
  }, [questions, answers]);

  const onPick = (questionId, label) => {
    if (result) return; // setelah submit, kunci pilihan (biar ga “mengubah sejarah”)
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const onSubmit = async () => {
    if (!canSubmit || submitting || result) return;

    setToast({ type: "", text: "" });
    setErr("");
    setSubmitting(true);

    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q.questionId,
        selectedOption: answers[q.questionId],
      }));

      const res = await quizApi.submit(moduleId, courseId, payloadAnswers);
      setResult(res);

      if (res?.passed) {
        await modulesApi.complete(moduleId, courseId);
        setToast({ type: "success", text: "Passed. Module completed and progress updated." });
      } else {
        setToast({ type: "error", text: "Not passed yet. Review the module and try again." });
      }

      setTimeout(() => setToast({ type: "", text: "" }), 3000);
    } catch (e) {
      setErr(e.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Starting quiz..." />;
  if (err) return <ErrorBox message={err} />;
  if (!quiz) return <ErrorBox message="Quiz data missing." />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Quiz</h1>
          <p className="mt-2 text-slate-600">
            Total questions: <b className="text-slate-900">{quiz.totalQuestions}</b>
          </p>
        </div>

        <Link
          to={`/courses/${courseId}/modules/${moduleId}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 hover:bg-slate-50"
        >
          Back to Module
        </Link>
      </header>

      {toast.text ? <Toast variant={toast.type}>{toast.text}</Toast> : null}

      {result ? (
        <Card className="border-2 border-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xl font-black text-slate-900">
                {result.passed ? " PASSED" : " FAILED"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Score <b className="text-slate-900">{result.score}%</b> | Correct{" "}
                <b className="text-slate-900">{result.correct}</b>/{result.total}
              </div>
            </div>
            <Badge tone={result.passed ? "success" : "danger"}>
              {result.passed ? "Unlocked next module" : "Try again"}
            </Badge>
          </div>
        </Card>
      ) : null}

      <Card title="Questions">
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.questionId} className="rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-black text-slate-900">
                {idx + 1}. {q.question}
              </div>

              <div className="mt-4 grid gap-2">
                {q.options.map((o) => {
                  const picked = answers[q.questionId] === o.label;
                  return (
                    <button
                      key={`${q.questionId}-${o.label}`}
                      type="button"
                      onClick={() => onPick(q.questionId, o.label)}
                      disabled={!!result}
                      className={[
                        "w-full rounded-2xl border px-4 py-3 text-left text-sm transition disabled:opacity-70",
                        picked
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
                      ].join(" ")}
                    >
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs font-black">
                        {o.label}
                      </span>
                      {o.text}
                    </button>
                  );
                })}
              </div>

              {q.options.length === 0 ? (
                <div className="mt-3 text-sm text-red-700">Options missing for this question.</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            disabled={!canSubmit || submitting || !!result}
            onClick={onSubmit}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : result ? "Submitted" : "Submit"}
          </button>
        </div>
      </Card>
    </div>
  );
}