import Activity from "../models/Activity.js";
import QuizResult from "../models/QuizResult.js";
import UserCourse from "../models/UserCourse.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    const now = new Date();
    const from7 = new Date(now);
    from7.setDate(from7.getDate() - 6);
    from7.setHours(0, 0, 0, 0);

    const [totalEvents, eventsLast7Days, totalQuizAttempts, passCount, enrollments, latestActivities] =
      await Promise.all([
        Activity.countDocuments({ user: userId }),
        Activity.countDocuments({ user: userId, occurredAt: { $gte: from7 } }),
        QuizResult.countDocuments({ userId }),
        QuizResult.countDocuments({ userId, passed: true }),
        UserCourse.countDocuments({ userId }),
        Activity.find({ user: userId })
          .sort({ occurredAt: -1 })
          .limit(10)
          .select("-__v"),
      ]);

    const passRate = totalQuizAttempts === 0 ? 0 : Math.round((passCount / totalQuizAttempts) * 100);

    return res.json({
      totalEvents,
      eventsLast7Days,
      totalQuizAttempts,
      passRate,
      enrolledCourses: enrollments,
      latestActivities,
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    return res.status(500).json({ message: "Failed to fetch dashboard overview", error: err.message });
  }
};
