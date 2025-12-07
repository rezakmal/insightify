import dotenv from "dotenv";
import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedQuizData = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Clear existing quiz data (optional - comment out if you want to keep existing quizzes)
    await Quiz.deleteMany({});
    console.log("🧹 Cleared existing quiz data");

    // Create Quiz data
    const quizDataArray = [
      {
        moduleId: "6931abd8d734247e7c3efd2f",
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
      },
      {
        moduleId: "6931ac10d734247e7c3efd33",
        questions: [
          {
            question: "Apa itu Node.js?",
            options: ["Runtime JavaScript", "Framework CSS", "Database NoSQL", "Library React"],
            answer: 0
          },
          {
            question: "Node.js berjalan di lingkungan apa?",
            options: ["Browser", "Server-side", "Android", "Database"],
            answer: 1
          },
          {
            question: "Apa itu NPM?",
            options: ["Server lokal", "Package manager", "Framework backend", "Library UI"],
            answer: 1
          },
          {
            question: "Module bawaan Node.js untuk membuat server adalah?",
            options: ["http", "fs", "path", "url"],
            answer: 0
          },
          {
            question: "Apa itu event loop dalam Node.js?",
            options: ["Fitur database", "Mekanisme eksekusi asynchronous", "Library untuk routing", "Debugger internal"],
            answer: 1
          }
        ]
      },
      {
        moduleId: "693293c9e23792737c920513",
        questions: [
          {
            question: "Apa itu Express.js?",
            options: ["Framework Node.js", "Database SQL", "Library CSS", "Runtime Python"],
            answer: 0
          },
          {
            question: "Method HTTP untuk mengambil data adalah?",
            options: ["POST", "GET", "PUT", "DELETE"],
            answer: 1
          },
          {
            question: "Fungsi express.json() digunakan untuk?",
            options: ["Parsing JSON body", "Menghapus file", "Membuat server", "Mengatur environment"],
            answer: 0
          },
          {
            question: "Router Express.js digunakan untuk?",
            options: ["Mengelola rute", "Menyimpan file", "Menjalankan database", "Autentikasi langsung"],
            answer: 0
          },
          {
            question: "Port default yang sering digunakan Express?",
            options: ["80", "3000", "7000", "1000"],
            answer: 1
          }
        ]
      },
      {
        moduleId: "69329783e23792737c920517",
        questions: [
          {
            question: "Apa itu database?",
            options: ["Tempat menyimpan data", "Bahasa pemrograman", "Framework CSS", "Runtime JavaScript"],
            answer: 0
          },
          {
            question: "Perintah umum untuk mengambil data dalam SQL?",
            options: ["SELECT", "INSERT", "DELETE", "UPDATE"],
            answer: 0
          },
          {
            question: "Relational database menyimpan data dalam?",
            options: ["Tabel", "Folder", "File JSON", "Array"],
            answer: 0
          },
          {
            question: "MongoDB termasuk jenis database?",
            options: ["Relational", "Document-based", "Graph", "Key-value"],
            answer: 1
          },
          {
            question: "Format dokumen di MongoDB adalah?",
            options: ["XML", "CSV", "JSON-like", "YAML"],
            answer: 2
          }
        ]
      },
      {
        moduleId: "693297a6e23792737c92051b",
        questions: [
          {
            question: "Apa itu cloud computing?",
            options: ["Komputasi berbasis internet", "Framework JavaScript", "Perangkat keras baru", "Database lokal"],
            answer: 0
          },
          {
            question: "AWS adalah singkatan dari?",
            options: ["Amazon Web Services", "Advanced Web System", "Azure Web Server", "Automatic Web Software"],
            answer: 0
          },
          {
            question: "Layanan komputasi AWS untuk menjalankan server adalah?",
            options: ["S3", "EC2", "RDS", "Lambda"],
            answer: 1
          },
          {
            question: "Layanan AWS untuk menyimpan file adalah?",
            options: ["DynamoDB", "S3", "API Gateway", "CloudTrail"],
            answer: 1
          },
          {
            question: "Serverless compute di AWS disebut?",
            options: ["Lambda", "EC2", "ECS", "Route53"],
            answer: 0
          }
        ]
      }
    ];

    // Create quizzes
    const createdQuizzes = [];
    for (const quizData of quizDataArray) {
      const quiz = await Quiz.create(quizData);
      createdQuizzes.push(quiz);
    }

    console.log("✅ Quizzes created successfully!");
    console.log(`   Total Quizzes Created: ${createdQuizzes.length}`);

    // Display summary for each quiz
    createdQuizzes.forEach((quiz, quizIndex) => {
      console.log(`\n📚 Quiz ${quizIndex + 1}:`);
      console.log(`   Quiz ID: ${quiz._id}`);
      console.log(`   Module ID: ${quiz.moduleId}`);
      console.log(`   Total Questions: ${quiz.questions.length}`);

      // Display questions summary
      quiz.questions.forEach((q, index) => {
        console.log(`   Question ${index + 1}: "${q.question}"`);
        console.log(`   Correct Answer: ${q.options[q.answer]}`);
      });
    });

    console.log("\n📊 Quiz Seeding Summary:");
    console.log(`   - Created ${createdQuizzes.length} quizzes`);
    let totalQuestions = 0;
    createdQuizzes.forEach(quiz => totalQuestions += quiz.questions.length);
    console.log(`   - Added ${totalQuestions} questions total`);
    console.log("\n✅ Quiz seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding quiz data:", error);
    process.exit(1);
  }
};

seedQuizData();