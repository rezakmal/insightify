import { NavLink } from "react-router-dom";

function Item({ to, icon, label }) {
  return (
    <NavLink to={to}>
      {({ isActive }) => (
        <div
          className={[
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            isActive
              ? "bg-blue-50 text-[#1E3A8A] ring-1 ring-blue-100"
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
          ].join(" ")}
        >
          <span
            className={[
              "material-symbols-outlined text-[20px] transition",
              isActive
                ? "text-[#1E3A8A]"
                : "text-slate-500 group-hover:text-slate-800",
            ].join(" ")}
          >
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open = false, onClose }) {
  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 h-screen w-72 border-r border-slate-200 bg-white",
        "transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
    >
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white shadow-sm">
              <span className="material-symbols-outlined">insights</span>
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900">Insightify</div>
              <div className="text-xs text-slate-500">Learning insight dashboard</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex flex-1 flex-col gap-2 px-1">


          <Item to="/dashboard" icon="dashboard" label="Dashboard" />
          <Item to="/courses" icon="school" label="Courses" />
          <Item to="/activity" icon="history" label="Activity" />
        </nav>

        {/* Footer */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-[#F9FAFB] p-4">
          <div className="mt-1 text-xs text-slate-500">
            Insightify 2025.
          </div>
        </div>
      </div>
    </aside>
  );
}