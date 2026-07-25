import { createRoot } from "react-dom/client";

import App from "./App";

import "./index.css";

// Configure API base URL for production
// In development, Vite proxy handles /api -> localhost:3001
// In production (Vercel), we need to point to Railway backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Set the base URL for the API client
// This must be done before any API calls are made
if (API_BASE_URL) {
  const { setBaseUrl } = await import("@workspace/api-client-react");
  setBaseUrl(API_BASE_URL);
}

createRoot(document.getElementById("root")!).render(<App />);
