import User from "../models/User.js";
import Session from "../models/Session.js";

export const signup = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) return res.status(400).json({ message: "Email already used" });

    const user = await User.create({ displayName, email, password });

    res.status(201).json({
      message: "Signup successful",
      userId: user._id.toString(),
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Create or update active session
    await Session.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, createdAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      message: "Login successful",
      userId: user._id.toString(),
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const profile = async (req, res) => {
  res.json(req.user);
};

// Logout - user can only logout themselves (protected by middleware)
export const logout = async (req, res) => {
  try {
    // req.user is already set by protect middleware
    // This ensures user can only logout themselves, not other users
    const userId = req.user._id;

    // Check if user has active session (should always be true if protect middleware passed)
    const activeSession = await Session.findOne({ userId });

    if (!activeSession) {
      return res.status(400).json({ 
        message: "User is not logged in. Already logged out." 
      });
    }

    // Delete active session (invalidate session)
    await Session.deleteOne({ userId });

    // Logout successful - frontend should remove userId from storage
    res.json({ 
      message: "Logout successful",
      userId: userId.toString()
    });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};