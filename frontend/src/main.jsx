import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { startPublicDataCache } from "./services/publicDataCache.js";
import "./index.css";

// Start fetching public content in the background.
// This does not delay the application from rendering.
startPublicDataCache();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);