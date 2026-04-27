import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { API_ROOT } from "./lib/api-base";
import "./index.css";

if (API_ROOT) {
  setBaseUrl(API_ROOT);
}

createRoot(document.getElementById("root")!).render(<App />);
