import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../../lib/api";
import { clearAuth, getUser } from "../../lib/auth";

function titleFromPath(pathname) {
  if (pathname.startsWith("/courses")) return "Courses";
  if (pathname.startsWith("/activity")) return "Activity";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "Insightify";
}

export default function Topbar({ onMenu }) {
  const nav = useNavigate();
  const loc = useLocation();
  const user = getUser();

  const onLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // who cares, clear anyway
    } finally {
      clearAuth();
      nav("/login", { replace: true });
    }
  };

  const title = titleFromPath(loc.pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            <span className="text-xs text-slate-500 hidden sm:block">
              {user?.displayName ? `Signed in as ${user.displayName}` : "Signed in"}
            </span>
          </div>
        </div>

        {/* Right: user + logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#1E3A8A]">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="max-w-[180px]">
              <div className="truncate text-sm font-bold text-slate-900">
                {user?.displayName || "User"}
              </div>
              <div className="truncate text-xs text-slate-500">
                {user?.email || ""}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="h-10 rounded-xl bg-[#1E3A8A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#193172]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}