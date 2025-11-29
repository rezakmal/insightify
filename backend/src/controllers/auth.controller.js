import jwt from "jsonwebtoken";
import User from "../models/User.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const signup = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) return res.status(400).json({ message: "Email already used" });

    const user = await User.create({ displayName, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user,
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

    res.json({
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const profile = async (req, res) => {
  res.json(req.user);
};

export const logout = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(400).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    // add token to the blacklist
    await BlacklistedToken.create({ token });

    res.json({ message: "Logout successful (server-side)" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};