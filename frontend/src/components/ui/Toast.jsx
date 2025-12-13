export default function Toast({ variant = "info", children }) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : variant === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-slate-200 bg-white text-slate-800";

  const icon =
    variant === "success" ? "check_circle" : variant === "error" ? "error" : "info";

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5">{icon}</span>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}