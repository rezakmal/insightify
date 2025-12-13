import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "./auth";

export function RequireAuth({ children }) {
  const token = getToken();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export function RequireGuest({ children }) {
  const token = getToken();
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}
