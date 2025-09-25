import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadAngryFont } from "./fonts";

// Load the Angry font
loadAngryFont();

createRoot(document.getElementById("root")!).render(<App />);
