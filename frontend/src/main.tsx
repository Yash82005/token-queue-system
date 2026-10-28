
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import Counter from "./counter";
import Display from "./Display";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/counter" element={<Counter />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
