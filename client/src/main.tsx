import { createRoot } from "react-dom/client";
import App from "./App";
import { applyDocumentLanguage } from "./lib/i18n";
import "./index.css";

applyDocumentLanguage();
createRoot(document.getElementById("root")!).render(<App />);
