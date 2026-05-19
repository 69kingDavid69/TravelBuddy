/**
 * Application entry point — mounts the root React component into the DOM.
 *
 * StrictMode is enabled to surface lifecycle issues during development;
 * it has no effect in production builds.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
