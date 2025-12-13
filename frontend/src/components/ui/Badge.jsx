export default function Badge({ tone = "neutral", children, className = "" }) {
  const styles =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "danger"
      ? "bg-red-50 text-red-800 border-red-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        styles,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}