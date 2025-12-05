import User from "../models/User.js";
import Session from "../models/Session.js";

// Simple auth middleware for MVP - check userId and active session
export const protect = async (req, res, next) => {
  // Get userId from body, query, or params (whichever available)
  // Add null checks to prevent undefined errors
  const userId = (req.body && req.body.userId) || (req.query && req.query.userId) || (req.params && req.params.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    // Fetch user and attach to request
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has active session (not logged out)
    const activeSession = await Session.findOne({ userId });

    if (!activeSession) {
      return res.status(401).json({ message: "Session expired or user not logged in. Please login again." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid userId", error: err.message });
  }
};