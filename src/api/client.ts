import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// React Hook to inject the Clerk Token into Axios headers.
// Uses a ref so the interceptor is registered once and the closure always
// reads the latest getToken without re-registering on every render.
export function useApiClient() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    const id = apiClient.interceptors.request.use(
      async (config) => {
        try {
          const token = await getTokenRef.current();
          if (token) config.headers.Authorization = `Bearer ${token}`;
        } catch (err) {
          console.error("Failed to fetch Clerk token", err);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return () => apiClient.interceptors.request.eject(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // register once

  return apiClient;
}
