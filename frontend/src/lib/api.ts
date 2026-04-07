"use client";

import axios from "axios";

export const storageKeys = {
  access: "crm-access-token",
  refresh: "crm-refresh-token",
  user: "crm-user",
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(storageKeys.access);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.localStorage.removeItem(storageKeys.access);
      window.localStorage.removeItem(storageKeys.refresh);
      window.localStorage.removeItem(storageKeys.user);
    }
    return Promise.reject(error);
  },
);
