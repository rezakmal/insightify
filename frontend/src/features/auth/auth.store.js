import { setToken, setUser } from "../../lib/auth";

export function persistAuth(payload) {
  if (!payload?.token) return false;
  setToken(payload.token);
  if (payload.user) {
    setUser(payload.user);
  }
  return true;
}
