import axios from "axios";

// IMPORTANT: Replace with your actual Render backend URL
const API_URL = import.meta.env.PROD
  ? "https://image-ticketing-system.onrender.com/api" // ⬅️ PUT YOUR RENDER URL HERE
  : "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log API errors for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  login: (data) => api.post("/auth/login", data),
  adminLogin: (data) => api.post("/auth/admin-login", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (data) => api.post("/auth/reset-password", data),
};

export const ticketAPI = {
  create: (data) => api.post("/tickets", data),
  getMyTickets: () => api.get("/tickets/my-tickets"),
  getAllTickets: () => api.get("/tickets/all"),
  updateStatus: (id, data) => api.patch(`/tickets/${id}/status`, data),
  addComment: (id, data) => api.post(`/tickets/${id}/comment`, data),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
  bulkDeleteSolved: () => api.post("/tickets/bulk-delete"),
  getStats: () => api.get("/tickets/stats/dashboard"),
};

export default api;
