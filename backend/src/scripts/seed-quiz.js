import dotenv from "dotenv";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import Module from "../models/Module.js";
import connectDB from "../config/db.js";

dotenv.config();

const requireValidObjectId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`${label} is not a valid ObjectId: "${id}"`);
  }
};

const seedQuizData = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    if (process.env.SEED_RESET === "true") {
      await Quiz.deleteMany({});
      console.log("🧹 Cleared existing quiz data (SEED_RESET=true)");
    } else {
      console.log("ℹ️  Skipped clearing quizzes (set SEED_RESET=true to reset)");
    }

    const quizDataArray = [
      {
        moduleId: "693c037ffcfab60a29730fc4",
        questions: [
          {
            question: "Apa itu JavaScript?",
            options: ["Bahasa pemrograman", "Bahasa markup", "Database", "Framework"],
            answer: 0
          },
          {
            question: "Apa yang dimaksud Function?",
            options: ["File penyimpanan data", "Sebuah variable khusus", "Tipe data baru", "Kumpulan kode yang dapat dipanggil ulang"],
            answer: 3
          },
          {
            question: "Apa itu OOP?",
            options: ["Sebuah library khusus", "Format penyimpanan JSON", "Framework pada JavaScript", "Sebuah paradigma pemrograman"],
            answer: 3
          },
          {
            question: "Apa itu callback?",
            options: ["Perintah untuk menghentikan program", "Variable global", "Fungsi yang dipanggil setelah fungsi lain selesai", "Method bawaan browser"],
            answer: 2
          },
          {
            question: "Apa itu promise?",
            options: ["Array khusus", "Objek untuk menangani operasi asynchronous", "Tipe data string baru", "Fungsi bawaan JavaScript"],
            answer: 1
          }
        ]
      }
    ];

    // Validate & check modules exist
    for (const [i, q] of quizDataArray.entries()) {
      requireValidObjectId(q.moduleId, `quizDataArray[${i}].moduleId`);

      const moduleExists = await Module.findById(q.moduleId).select("_id");
      if (!moduleExists) {
        throw new Error(`Module not found for moduleId: ${q.moduleId} (quiz index ${i})`);
      }

      // Validate questions: 4 options and answer range
      q.questions.forEach((question, qi) => {
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(`Quiz ${i} question ${qi}: options must have exactly 4 items`);
        }
        if (typeof question.answer !== "number" || question.answer < 0 || question.answer > 3) {
          throw new Error(`Quiz ${i} question ${qi}: answer must be number 0..3`);
        }
      });
    }

    const createdQuizzes = await Quiz.insertMany(quizDataArray, { ordered: true });

    console.log("✅ Quizzes created successfully!");
    console.log(`   Total Quizzes Created: ${createdQuizzes.length}`);

    createdQuizzes.forEach((quiz, quizIndex) => {
      console.log(`\n📚 Quiz ${quizIndex + 1}:`);
      console.log(`   Quiz ID: ${quiz._id}`);
      console.log(`   Module ID: ${quiz.moduleId}`);
      console.log(`   Total Questions: ${quiz.questions.length}`);
    });

    console.log("\n✅ Quiz seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding quiz data:", error.message);
    process.exitCode = 1;
  } finally {
    // close mongoose connection gracefully
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit();
  }
};

seedQuizData();