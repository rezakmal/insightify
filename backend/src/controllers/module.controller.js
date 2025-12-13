import Module from "../models/Module.js";
import Activity from "../models/Activity.js";
import Course from "../models/Course.js";
import QuizResult from "../models/QuizResult.js";
import UserCourse from "../models/UserCourse.js";

// POST /api/modules
export const createModule = async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (!title) return res.status(400).json({ message: "Title required" });
    const mod = await Module.create({ title, content });
    return res.status(201).json({ message: "Module created", module: mod });
  } catch (err) {
    res.status(500).json({ message: "Failed to create module", error: err.message });
  }
};

// GET /api/modules/:moduleId
// Public route - can access module content without auth
export const getModuleById = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const moduleData = await Module.findById(moduleId);
    if (!moduleData) return res.status(404).json({ message: "Module not found" });

    const courseId = req.query.courseId;
    const userId = req.user?._id;

    // enforce gating only when course context is provided
    if (courseId) {
      const course = await Course.findById(courseId).populate("modules.moduleId");
      if (!course) return res.status(404).json({ message: "Course not found" });
      
      const ordered = course.modules.slice().sort((a,b) => (a.order||0) - (b.order||0));
      const index = ordered.findIndex(x => x.moduleId._id.toString() === moduleId.toString());
      
      if (index > 0) {
        // require previous module passed quiz
        const prevModuleId = ordered[index-1].moduleId._id;
        const quizDone = await QuizResult.findOne({ userId, moduleId: prevModuleId, passed: true });
        if (!quizDone) {
          return res.status(403).json({ message: "You must complete the quiz of the previous module first." });
        }
      }

      // ensure enrollment
      const enrolled = await UserCourse.findOne({ userId, courseId }).select("_id");
      if (!enrolled) {
        return res.status(403).json({ message: "Enroll to this course first" });
      }
    }

    return res.json(moduleData);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch module", error: err.message });
  }
};

// POST /api/modules/:moduleId/start
// Body: { userId: "...", courseId: "..." }
export const startModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const userId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const moduleData = await Module.findById(moduleId);
    if (!moduleData) {
      return res.status(404).json({ message: "Module not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const userCourse = await UserCourse.findOne({ userId, courseId }).select("_id");
    if (!userCourse) {
      return res.status(403).json({ message: "Enroll to this course first" });
    }

    await Activity.create({
      user: userId,
      course: courseId,
      module: moduleId,
      type: "module_start",
      occurredAt: new Date()
    });

    return res.json({ message: "Module started" });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to start module"
    });
  }
};

// POST /api/modules/:moduleId/complete
// Body: { userId: "...", courseId: "..." }
// require a QuizResult.passed == true for module to be considered fully completed in progress calculations.
export const completeModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const userId = req.user._id;
    const { courseId } = req.body || {};

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const moduleData = await Module.findById(moduleId);
    if (!moduleData) {
      return res.status(404).json({ message: "Module not found" });
    }

    const userCourse = await UserCourse.findOne({ userId, courseId });
    if (!userCourse) {
      return res.status(400).json({ message: "User not enrolled in this course" });
    }

    userCourse.completedModules = userCourse.completedModules || [];

    const alreadyCompleted = userCourse.completedModules.some(
      (id) => id.toString() === moduleData._id.toString()
    );

    if (!alreadyCompleted) {
      userCourse.completedModules.push(moduleData._id);
    }

    const course = await Course.findById(courseId).populate("modules.moduleId");
    if (!course) {
      return res.status(404).json({ message: "Course not found" }); 
    }

    const totalModules = course.modules.length;

    const progress =
      totalModules === 0
        ? 0
        : Math.round((userCourse.completedModules.length / totalModules) * 100);

    userCourse.progress = progress;
    userCourse.isCompleted = userCourse.completedModules.length === totalModules;

    await userCourse.save();

    await Activity.create({
      user: userId,
      course: courseId,
      module: moduleId,
      type: "module_complete",
      occurredAt: new Date(),
    });

    return res.json({
      message: "Module completed",
      progress: userCourse.progress,
      isCompleted: userCourse.isCompleted,
    });
  } catch (err) {
    console.error("Complete module error:", err);
    return res
      .status(500)
      .json({ message: "Failed to complete module", error: err.message });
  }
};

// GET /api/modules/:moduleId/status
// Query: ?userId=...
export const getModuleStatus = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const userId = req.user._id;

    const logs = await Activity.find({
      user: userId,
      module: moduleId,
    }).sort({ occurredAt: -1 });

    const quizRes = await QuizResult.findOne({
      userId,
      moduleId,
    }).sort({ timestamp: -1 });

    if (!logs || logs.length === 0) {
      return res.json({
        status: "not_started",
        quizResult: quizRes || null,
      });
    }

    const hasCompleted = logs.some((log) => log.type === "module_complete");

    if (hasCompleted) {
      const status =
        quizRes && quizRes.passed ? "completed" : "completed_not_passed";

      return res.json({
        status,
        quizResult: quizRes || null,
      });
    }

    return res.json({
      status: "in_progress",
      quizResult: quizRes || null,
    });
  } catch (err) {
    console.error("Get module status error:", err);
    return res
      .status(500)
      .json({ message: "Failed to get module status", error: err.message });
  }
};
