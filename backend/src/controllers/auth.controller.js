import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d"});

export const signup = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!displayName || !email || !password) {
      return res.status(400).json({message: "displayName, email, and password are required"});
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already used" });
    }

    const user = await User.create({ displayName, email, password });

    const token = generateToken(user._id);
    
    await Session.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, createdAt: new Date() },
      { upsert: true, new: true}
    );

    return res.status(201).json({
      message: "Signup successful",
      token,
      userId: user._id.toString(),
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required"});
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    // Create or update active session
    await Session.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Login successful",
      token,
      userId: user._id.toString(),
      user: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};

export const profile = async (req, res) => {
  res.json(req.user);
};

// Logout - user can only logout themselves (protected by middleware)
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(400).json({ message: "No token provided"});
    }
    
    const token = authHeader.split(" ")[1];

    await BlacklistedToken.create({ token });

    if (req.user && req.user._id) {
      await Session.deleteOne({ userId: req.user._id });
    }

    return res.json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
  
};