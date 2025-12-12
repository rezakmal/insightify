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

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
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

    answers.forEach((answer) => {
      const question = quiz.questions.find(
        (q) => q.id.toString() === answer.questionId
      );
      if (question && typeof answer.selectedOption === "string") {
        const selectedIndex = answer.selectedOption.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3

        if (selectedIndex === question.answer) {
          correct++;
        }
      }
    });

    const score = Math.round((correct / total) * 100);
    const passed = score >= 70;

    const quizResult = await QuizResult.create({
      userId,
      moduleId,
      score,
      totalQuestions: total,
      passed,
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
