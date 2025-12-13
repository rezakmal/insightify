import { createBrowserRouter } from "react-router-dom";
import { RequireAuth, RequireGuest } from "../lib/guards";

import AppShell from "../components/layout/AppShell";
import LoginPage from "../features/auth/LoginPage";
import SignupPage from "../features/auth/SignupPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import ActivityPage from "../features/dashboard/ActivityPage";
import CoursesPage from "../features/courses/CoursesPage";
import CourseDetailPage from "../features/courses/CourseDetailPage";
import ModulePage from "../features/courses/ModulePage";
import QuizPage from "../features/courses/QuizPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "courses", element: <CoursesPage /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "courses/:courseId/modules/:moduleId", element: <ModulePage /> },
      { path: "courses/:courseId/modules/:moduleId/quiz", element: <QuizPage /> },
      { index: true, element: <DashboardPage /> },
      { path: "*", element: <div className="p-8 text-slate-700">Not found.</div> },
    ],
  },
  {
    path: "/login",
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    ),
  },
  {
    path: "/signup",
    element: (
      <RequireGuest>
        <SignupPage />
      </RequireGuest>
    ),
  },
]);

