import { apiFetch } from "./fetcher";

/**
 * AUTH
 * POST /api/auth/signup
 * POST /api/auth/login
 * GET  /api/auth/profile
 * POST /api/auth/logout
 */
export const authApi = {
  signup: (displayName, email, password) =>
    apiFetch("/api/auth/signup", {
      auth: false,
      method: "POST",
      body: { displayName, email, password },
    }),

  login: (email, password) =>
    apiFetch("/api/auth/login", {
      auth: false,
      method: "POST",
      body: { email, password },
    }),

  profile: () => apiFetch("/api/auth/profile", { auth: true }),

  logout: () => apiFetch("/api/auth/logout", { auth: true, method: "POST" }),
};

/**
 * COURSES
 * GET  /api/courses
 * GET  /api/courses/:courseId
 * GET  /api/courses/:courseId/modules
 * GET  /api/courses/:courseId/progress   (protected)
 * POST /api/courses/enroll              (protected)
 */
export const coursesApi = {
  list: () => apiFetch("/api/courses", { auth: false }),

  detail: (courseId) => apiFetch(`/api/courses/${courseId}`, { auth: false }),

  modules: (courseId) => apiFetch(`/api/courses/${courseId}/modules`, { auth: false }),

  progress: (courseId) => apiFetch(`/api/courses/${courseId}/progress`, { auth: true }),

  enroll: (courseId) =>
    apiFetch("/api/courses/enroll", {
      auth: true,
      method: "POST",
      body: { courseId },
    }),
};

/**
 * MODULES
 * GET  /api/modules/:moduleId                 (public, optional gating via query)
 * POST /api/modules/:moduleId/start           (protected)
 * POST /api/modules/:moduleId/complete        (protected)
 * GET  /api/modules/:moduleId/status          (protected)
 */
export const modulesApi = {
  get: (moduleId, { courseId } = {}) => {
    const qs = new URLSearchParams();
    if (courseId) qs.set("courseId", courseId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/api/modules/${moduleId}${suffix}`, { auth: true });
  },

  start: (moduleId, courseId) =>
    apiFetch(`/api/modules/${moduleId}/start`, {
      auth: true,
      method: "POST",
      body: { courseId },
    }),

  complete: (moduleId, courseId) =>
    apiFetch(`/api/modules/${moduleId}/complete`, {
      auth: true,
      method: "POST",
      body: { courseId },
    }),

  status: (moduleId) => apiFetch(`/api/modules/${moduleId}/status`, { auth: true }),
};

/**
 * QUIZ
 * POST /api/quiz/:moduleId/start     (protected)
 * POST /api/quiz/:moduleId/submit    (protected)
 */
export const quizApi = {
  start: (moduleId, courseId) =>
    apiFetch(`/api/quiz/${moduleId}/start`, {
      auth: true,
      method: "POST",
      body: { courseId },
    }),

  submit: (moduleId, courseId, answers) =>
    apiFetch(`/api/quiz/${moduleId}/submit`, {
      auth: true,
      method: "POST",
      body: { courseId, answers },
    }),
};

/**
 * DASHBOARD
 * GET /api/dashboard/overview (protected)
 */
export const dashboardApi = {
  overview: () => apiFetch("/api/dashboard/overview", { auth: true }),
};

/**
 * LEARNING
 * GET /api/users/me/activity
 * GET /api/users/me/activity/daily
 * GET /api/users/me/quiz-results
 * GET /api/users/me/progress?courseId=
 */
export const learningApi = {
  myActivity: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/users/me/activity${qs ? `?${qs}` : ""}`, { auth: true });
  },

  myActivityDaily: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/users/me/activity/daily${qs ? `?${qs}` : ""}`, { auth: true });
  },

  myQuizResults: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/users/me/quiz-results${qs ? `?${qs}` : ""}`, { auth: true });
  },

  myProgress: (courseId) => apiFetch(`/api/users/me/progress?courseId=${encodeURIComponent(courseId)}`, { auth: true }),
};

/**
 * ML
 * POST /api/ml/profile/generate          (protected)
 * POST /api/ml/recommendations/generate  (protected)
 * GET  /api/ml/profile                   (protected)
 * GET  /api/ml/recommendations           (protected)
 */
export const mlApi = {
  generateProfile: () => apiFetch("/api/ml/profile/generate", { auth: true, method: "POST" }),
  generateRecommendations: () => apiFetch("/api/ml/recommendations/generate", { auth: true, method: "POST" }),
  myProfile: () => apiFetch("/api/ml/profile", { auth: true }),
  myRecommendations: () => apiFetch("/api/ml/recommendations", { auth: true }),
};
