import Activity from "../models/Activity.js";
import QuizResult from "../models/QuizResult.js";
import UserCourse from "../models/UserCourse.js";
import MlProfile from "../models/MlProfile.js";
import MlRecommendation from "../models/MlRecommendation.js";

const ML_BASE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || "15000", 10);

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
};

const buildRawPayload = async (userId) => {
  const [activities, quizResults, userCourses] = await Promise.all([
    Activity.find({ user: userId }).sort({ occurredAt: 1 }).select("-__v"),
    QuizResult.find({ userId }).sort({ timestamp: 1 }).select("-__v"),
    UserCourse.find({ userId }).select("-__v"),
  ]);

  return {
    userId: userId.toString(),
    activities,
    quizResults,
    userCourses,
  };
};

const handleMlNetworkError = (res, err) => {
  const isAbort =
    err?.name === "AbortError" ||
    (typeof err?.message === "string" && err.message.toLowerCase().includes("aborted"));

  // TypeError: fetch failed (ECONNREFUSED, DNS, dsb)
  const isFetchFailed =
    err instanceof TypeError ||
    (typeof err?.message === "string" && err.message.toLowerCase().includes("fetch failed"));

  if (isAbort) {
    return res.status(502).json({
      message: "ML service timeout",
      detail: `Request to ML exceeded ${ML_TIMEOUT_MS}ms`,
    });
  }

  if (isFetchFailed) {
    return res.status(502).json({
      message: "ML service unreachable",
      detail: `Cannot reach ML service at ${ML_BASE_URL}`,
    });
  }

  return null;
};

export const generateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const raw = await buildRawPayload(userId);

    let resp;
    try {
      resp = await fetchWithTimeout(`${ML_BASE_URL}/profile/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
    } catch (err) {
      console.error("Generate profile fetch error:", err);
      const handled = handleMlNetworkError(res, err); 
      if (handled) return handled;
      return res.status(502).json({ message: "ML service error", detail: err.message });
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({
        message: "ML service error",
        status: resp.status,
        detail: text || `ML responded with status ${resp.status}`,
      });
    }

    const payload = await resp.json();

    await MlProfile.findOneAndUpdate(
      { userId },
      { userId, payload, generatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ message: "Profile generated", payload });
  } catch (err) {
    console.error("Generate profile error:", err);
    return res.status(500).json({ message: "Failed to generate profile", error: err.message });
  }
};

export const generateRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const raw = await buildRawPayload(userId);

    let resp;
    try {
      resp = await fetchWithTimeout(`${ML_BASE_URL}/recommendations/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raw),
      });
    } catch (err) {
      console.error("Generate recommendations fetch error:", err);
      const handled = handleMlNetworkError(res, err);
      if (handled) return handled;
      return res.status(502).json({ message: "ML service error", detail: err.message });
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({
        message: "ML service error",
        status: resp.status,
        detail: text || `ML responded with status ${resp.status}`,
      });
    }

    const payload = await resp.json();

    await MlRecommendation.findOneAndUpdate(
      { userId },
      { userId, payload, generatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ message: "Recommendations generated", payload });
  } catch (err) {
    console.error("Generate recommendations error:", err);
    return res.status(500).json({ message: "Failed to generate recommendations", error: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await MlProfile.findOne({ userId }).select("-__v");
    return res.json(doc ? doc.payload : null);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
};

export const getMyRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await MlRecommendation.findOne({ userId }).select("-__v");
    return res.json(doc ? doc.payload : null);
  } catch (err) {
    console.error("Get recommendations error:", err);
    return res.status(500).json({ message: "Failed to fetch recommendations", error: err.message });
  }
};