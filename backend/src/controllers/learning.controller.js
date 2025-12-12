import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import QuizResult from "../models/QuizResult.js";
import UserCourse from "../models/UserCourse.js";

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

// GET /api/users/me/activity?courseId=&moduleId=&type=&page=&limit=
export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      courseId,
      moduleId,
      type,
      page = 1,
      limit = 50,
    } = req.query;

    const q = { user: userId };

    if (courseId) {
      if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid courseId" });
      q.course = courseId;
    }

    if (moduleId) {
      if (!isValidObjectId(moduleId)) return res.status(400).json({ message: "Invalid moduleId" });
      q.module = moduleId;
    }

    if (type) q.type = type;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [total, data] = await Promise.all([
      Activity.countDocuments(q),
      Activity.find(q)
        .sort({ occurredAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v"),
    ]);

    return res.json({
      data,
      pagination: { total, page: pageNum, limit: limitNum },
    });
  } catch (err) {
    console.error("Get my activity error:", err);
    return res.status(500).json({ message: "Failed to fetch activity", error: err.message });
  }
};

// GET /api/users/me/activity/daily?days=7&courseId=
export const getMyActivityDaily = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7, courseId } = req.query;

    const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 90);

    const match = { user: userId };

    if (courseId) {
      if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid courseId" });
      match.course = new mongoose.Types.ObjectId(courseId);
    }

    const from = new Date();
    from.setDate(from.getDate() - (daysNum - 1));
    from.setHours(0, 0, 0, 0);

    match.occurredAt = { $gte: from };

    const data = await Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: "$occurredAt" },
            m: { $month: "$occurredAt" },
            d: { $dayOfMonth: "$occurredAt" },
          },
          totalEvents: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]);

    const map = new Map();
    data.forEach((x) => {
      const key = `${x._id.y}-${String(x._id.m).padStart(2, "0")}-${String(x._id.d).padStart(2, "0")}`;
      map.set(key, x.totalEvents);
    });

    const series = [];
    const cursor = new Date(from);
    for (let i = 0; i < daysNum; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate()
      ).padStart(2, "0")}`;
      series.push({ date: key, totalEvents: map.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return res.json({ days: daysNum, series });
  } catch (err) {
    console.error("Get my activity daily error:", err);
    return res.status(500).json({ message: "Failed to fetch activity daily", error: err.message });
  }
};

// GET /api/users/me/quiz-results?moduleId=&page=&limit=
export const getMyQuizResults = async (req, res) => {
  try {
    const userId = req.user._id;
    const { moduleId, page = 1, limit = 50 } = req.query;

    const q = { userId };

    if (moduleId) {
      if (!isValidObjectId(moduleId)) return res.status(400).json({ message: "Invalid moduleId" });
      q.moduleId = moduleId;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [total, data] = await Promise.all([
      QuizResult.countDocuments(q),
      QuizResult.find(q)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v"),
    ]);

    return res.json({
      data,
      pagination: { total, page: pageNum, limit: limitNum },
    });
  } catch (err) {
    console.error("Get my quiz results error:", err);
    return res.status(500).json({ message: "Failed to fetch quiz results", error: err.message });
  }
};

// GET /api/users/me/progress?courseId=
export const getMyProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.query;

    if (!courseId) return res.status(400).json({ message: "courseId is required" });
    if (!isValidObjectId(courseId)) return res.status(400).json({ message: "Invalid courseId" });

    const uc = await UserCourse.findOne({ userId, courseId }).select("-__v");
    if (!uc) return res.json({ progress: 0, isCompleted: false, completedModules: [], quizResults: [] });

    return res.json({
      progress: uc.progress || 0,
      isCompleted: !!uc.isCompleted,
      completedModules: uc.completedModules || [],
      quizResults: uc.quizResults || [],
    });
  } catch (err) {
    console.error("Get my progress error:", err);
    return res.status(500).json({ message: "Failed to fetch progress", error: err.message });
  }
};
