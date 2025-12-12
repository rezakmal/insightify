import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Activity from "../models/Activity.js";
import QuizResult from "../models/QuizResult.js";
import UserCourse from "../models/UserCourse.js";

// POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { title, description, modules } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    // modules expected: [{ moduleId, order }, ...]
    const course = await Course.create({ title, description, modules: modules || [] });
    return res.status(201).json({ message: "Course created", course });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create course", error: err.message });
  }
};

// GET /api/courses
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().select("-__v");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

// GET /api/courses/:courseId
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate({
      path: "modules.moduleId",
      model: "Module"
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

// GET /api/courses/:courseId/modules
export const getModulesByCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate("modules.moduleId");
    if (!course) return res.status(404).json({ message: "Course not found" });

    // sort by order
    const modules = course.modules
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(m => m.moduleId);

    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch modules" });
  }
};

// GET /api/courses/:courseId/progress
export const getCourseProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId).populate("modules.moduleId");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const totalModules = course.modules.length;

    const moduleIds = course.modules.map((m) => (m.moduleId?._id ? m.moduleId._id : m.moduleId));

    const results = await QuizResult.find({
      userId,
      moduleId: { $in: moduleIds },
      passed: true,
    }).select("moduleId passed");

    const passedModuleIds = results.map((r) => r.moduleId.toString());
    const completedModules = passedModuleIds.length;

    const progressPercentage =
      totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

    const ordered = course.modules
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    let nextModule = null;
    for (const item of ordered) {
      const mId = (item.moduleId?._id ? item.moduleId._id : item.moduleId).toString();
      if (!passedModuleIds.includes(mId)) {
        nextModule = item.moduleId;
        break;
      }
    }

    const isFinished = completedModules === totalModules;

    return res.json({
      courseId,
      totalModules,
      completedModules,
      progressPercentage,
      isFinished,
      nextModule,
    });
  } catch (err) {
    console.error("Get course progress error:", err);
    return res.status(500).json({ message: "Failed to get progress", error: err.message });
  }
};

// POST /api/courses/enroll
export const enrollCourse = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    const course = await Course.findById(courseId).select("_id");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const exists = await UserCourse.findOne({ userId, courseId });
    if (exists) {
      return res.json({ message: "Already enrolled", data: exists });
    }

    const userCourse = await UserCourse.create({ userId, courseId });

    await Activity.create({
      user: userId,
      course: courseId,
      type: "course_enroll",
      occurredAt: new Date(),
    });

    return res.status(201).json({
      message: "Course enrolled",
      data: userCourse,
    });
  } catch (err) {
    console.error("Enroll course error:", err);
    return res.status(500).json({ message: "Failed to enroll", error: err.message });
  }
};