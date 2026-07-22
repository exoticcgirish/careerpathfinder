import axios from "axios";

const TOKEN_KEY = "cpf_token";

import axios from "axios";

const TOKEN_KEY = "cpf_token";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const auth = {
  saveToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  async login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.user;
  },
  async signup(email, password, full_name) {
    const { data } = await api.post("/auth/signup", {
      email,
      password,
      full_name,
    });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.user;
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export const roadmaps = {
  generate: (payload) =>
    api.post("/roadmap/generate", payload).then((r) => r.data),
  list: () => api.get("/roadmap").then((r) => r.data),
  get: (id) => api.get(`/roadmap/${id}`).then((r) => r.data),
  remove: (id) => api.delete(`/roadmap/${id}`),
};
