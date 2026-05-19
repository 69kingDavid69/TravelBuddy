/**
 * Application entry point.
 * Bootstraps the React component tree into the DOM with StrictMode
 * to catch potential side-effects during double-rendering in development.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
