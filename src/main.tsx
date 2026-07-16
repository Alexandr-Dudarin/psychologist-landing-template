import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App";
import { LanguageProvider } from "./app/providers/LanguageProvider";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { ScrollToTop } from "./app/router/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import "./styles/fonts.css";
import "./styles/variables.css";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);