import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../lib/api";
import { persistAuth } from "./auth.store";

export default function LoginPage() {
  const nav = useNavigate();
  const loc = useLocation();

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
      const data = await authApi.login(email.trim(), password);
      persistAuth(data);
      const backTo = loc.state?.from || "/dashboard";
      nav(backTo, { replace: true });
    } catch (e2) {
      setErr(e2.message || "Login failed");
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
              Log in.
              <br />
              Continue your progress.
            </h2>

            <p className="mt-4 text-blue-200">
              Courses, quizzes, progress tracking, and ML insights, in one place. Clean and predictable. Unlike humans.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-6">
              <p className="text-sm font-semibold text-white">Quick perks</p>
              <ul className="mt-3 space-y-2 text-sm text-blue-100">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Progress updates after passing quizzes
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Activity history you can actually audit
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-blue-200">check_circle</span>
                  Personalized recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center justify-center bg-[#F9FAFB] px-6 py-12">
          <form onSubmit={onSubmit} className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-2 text-slate-600">
                Sign in to continue.{" "}
                <Link to="/signup" className="font-semibold text-blue-700 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-800">Email</div>
              <div className="relative">
                <input
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-4 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-slate-800">Password</div>
              <div className="relative">

                <input
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-11 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center text-sm text-slate-500">
              Insightify. Minimal drama, maximal progress.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}