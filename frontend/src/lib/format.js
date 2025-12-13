export function fmtDateTime(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt || "");
  }
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}