export default function Card({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}