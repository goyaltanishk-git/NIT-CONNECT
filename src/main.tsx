import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./sentry";

// Init Sentry before anything renders so it catches all errors
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
