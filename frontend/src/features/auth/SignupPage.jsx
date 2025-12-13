import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../lib/api";
import { persistAuth } from "./auth.store";

export default function SignupPage() {
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await authApi.signup(displayName.trim(), email.trim(), password);
      persistAuth(data);
      nav("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-[Space_Grotesk]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* LEFT: FULL BLEED */}
        <div className="hidden lg:flex items-center justify-center bg-[#1E3A8A] px-10 py-12">
          <div className="w-full max-w-lg text-white">
            <div className="mb-7 flex items-center gap-3">
              <span className="material-symbols-outlined text-5xl text-blue-200">insights</span>
              <span className="text-3xl font-bold">Insightify</span>
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Create account.
              <br />
              Start learning with clarity.
            </h2>

            <p className="mt-4 text-blue-200">
              Join, enroll in courses, take quizzes, and let the system log your progress.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-semibold text-white">Designed for</p>
              <ul className="mt-3 space-y-2 text-sm text-blue-100">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Learn and adapt with insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Quiz attempts tracked and scored
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Personalized insights
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center bg-[#F9FAFB] px-6 py-12">
          <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
              <p className="mt-2 text-slate-600">
                Already have one?{" "}
                <Link to="/login" className="font-semibold text-blue-700 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-800">Full name</div>
              <input
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-800">Email</div>
              <input
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-800">Password</div>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-11 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPw ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>
            </label>

            <button
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#1E3A8A] font-bold text-white shadow-sm transition hover:bg-[#193172] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            <div className="text-center text-sm text-slate-500">
              No weird gradients. No visual noise. Just work.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}