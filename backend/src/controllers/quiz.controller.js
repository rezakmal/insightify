import Quiz from "../models/Quiz.js";
import Module from "../models/Module.js";
import QuizResult from "../models/QuizResult.js";
import Activity from "../models/Activity.js";
import UserCourse from "../models/UserCourse.js";

// POST /api/quiz/:moduleId/start
export const startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ moduleId: req.params.moduleId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Each question has 4 options (A, B, C, D)
    const questions = quiz.questions.map(q => {
      // Return options as A, B, C, D format for frontend
      const options = q.options.map((opt, idx) => ({
        label: String.fromCharCode(65 + idx), // A, B, C, D
        text: opt
      }));
      
      return {
        questionId: q.id.toString(),
        question: q.question,
        options: options
      };
    });

    res.json({ 
      moduleId: req.params.moduleId, 
      questions: questions, 
      totalQuestions: questions.length
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to start quiz", error: err.message });
  }
};

// POST /api/quiz/:moduleId/submit
// body: { userId: "...", answers: [ { questionId: "...", selectedOption: "A" or "B" or "C" or "D" }, ... ], courseId: "..." }
export const submitQuiz = async (req, res) => {
  const { answers, courseId, userId } = req.body;

  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const moduleId = req.params.moduleId;
    const quiz = await Quiz.findOne({ moduleId });

    if (!quiz)
      return res.status(404).json({ message: "Quiz not found" });

    let correct = 0;
    const total = quiz.questions.length;

    // Process answers - answers format: [{ questionId: "...", selectedOption: "A"/"B"/"C"/"D" }]
    // Convert selectedOption (A/B/C/D) to index (0/1/2/3) and compare with correct answer index
    answers.forEach((answer) => {
      const question = quiz.questions.find(q => q.id.toString() === answer.questionId);
      if (question) {
        // Convert A/B/C/D to index (0/1/2/3)
        const selectedIndex = answer.selectedOption.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        
        // Check if selected index matches correct answer index
        if (selectedIndex === question.answer) {
          correct++;
        }
      }
    });

    // Calculate score: (correct / total) * 100
    const score = Math.round((correct / total) * 100);
    const passed = score >= 70; // 70% passing threshold

    // Save to QuizResult collection
    await QuizResult.create({
      userId,
      moduleId,
      score,
      totalQuestions: total,
      passed
    });

    // Update UserCourse quizResults array
    await UserCourse.updateOne(
      {
        userId,
        courseId
      },
      {
        $push: {
          quizResults: {
            moduleId,
            correct,
            total,
            score,
            passed,
            timestamp: new Date()
          }
        }
      },
      { upsert: true } // Create UserCourse if doesn't exist
    );

    res.json({
      message: "Quiz submitted",
      correct,
      total,
      score,
      passed
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to submit quiz", error: err.message });
  }
};