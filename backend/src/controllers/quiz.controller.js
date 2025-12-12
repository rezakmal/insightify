import Quiz from "../models/Quiz.js";
import Module from "../models/Module.js";
import QuizResult from "../models/QuizResult.js";
import Activity from "../models/Activity.js";
import UserCourse from "../models/UserCourse.js";

// POST /api/quiz/:moduleId/start
export const startQuiz = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const quiz = await Quiz.findOne({ moduleId });
    const { courseId } = req.body || {};

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }
    const questions = quiz.questions.map((q) => {
      const options = q.options.map((opt, idx) => ({
        label: String.fromCharCode(65 + idx), // A, B, C, D
        text: opt,
      }));

      return {
        questionId: q.id.toString(),
        question: q.question,
        options,
      };
    });

    await Activity.create({
      user: req.user._id,
      course: courseId,
      module: moduleId,
      type: "quiz_start",
      occurredAt: new Date(),
    });

    return res.json({
      moduleId,
      deadlineAt: quiz.deadlineAt || null,
      questions,
      totalQuestions: questions.length,
    });
  } catch (err) {
    console.error("Start quiz error:", err);
    return res
      .status(500)
      .json({ message: "Failed to start quiz", error: err.message });
  }
};

// POST /api/quiz/:moduleId/submit
// body: { courseId: "...", answers: [ { questionId, selectedOption: "A"/"B"/"C"/"D" } ] }
export const submitQuiz = async (req, res) => {
  const userId = req.user._id;
  const moduleId = req.params.moduleId;
  const { answers, courseId } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res
      .status(400)
      .json({ message: "answers array is required and cannot be empty" });
  }

  try {
    const quiz = await Quiz.findOne({ moduleId });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let correct = 0;
    const total = quiz.questions.length;


    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id.toString() === answer.questionId);
      if (!question) continue;

      if (typeof answer.selectedOption !== "string" || answer.selectedOption.length !== 1) continue;

      const selectedIndex = answer.selectedOption.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (selectedIndex === question.answer) correct++;
    }

    const score = total === 0 ? 0 : Math.round((correct / total) * 100);
    const passed = score >= 70;

    // compute duration based on latest quiz_start log
    const lastStart = await Activity.findOne({
      user: userId,
      course: courseId,
      module: moduleId,
      type: "quiz_start",
    }).sort({ occurredAt: -1 });

    let duration = null;
    if (lastStart?.occurredAt) {
      duration = Math.max(
        0,
        Math.round((Date.now() - new Date(lastStart.occurredAt).getTime()) / 1000)
      );
    }

    const quizResult = await QuizResult.create({
      userId,
      moduleId,
      score,
      totalQuestions: total,
      passed,
      duration,
      examFinishedAt: new Date(),
    });

    await UserCourse.updateOne(
      {
        userId,
        courseId,
      },
      {
        $push: {
          quizResults: {
            moduleId,
            correct,
            total,
            score,
            passed,
            timestamp: new Date(),
          },
        },
      },
      { upsert: true }
    );

    await Activity.create({
      user: userId,
      course: courseId,
      module: moduleId,
      type: "quiz_submit",
      occurredAt: new Date(),
      metadata: {
        score,
        passed,
        quizResultId: quizResult._id,
      },
    });

    return res.json({
      message: "Quiz submitted",
      correct,
      total,
      score,
      passed,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);
    return res
      .status(500)
      .json({ message: "Failed to submit quiz", error: err.message });
  }
};
