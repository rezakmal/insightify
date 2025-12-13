import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // block logged-out tokens
    const isBlacklisted = await BlacklistedToken.findOne({ token }).select("_id");
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token has been logged out" });
    }

    // verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // check active session (since you use Session model)
    const activeSession = await Session.findOne({ userId: decoded.id }).select("_id");
    if (!activeSession) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    // attach user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};