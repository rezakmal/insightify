import jwt from "jsonwebtoken";
import User from "../models/User.js";

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
  try {
    return res.json({ message: "Logut successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to logout" });
  }
}