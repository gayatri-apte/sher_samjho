import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App";
import "./styles/tailwind.css";
import { api } from "./config/api";

// Wake the backend as soon as the app opens, so the first real request
// (deck, search, scan) doesn't pay the server start-up time.
fetch(api.health).catch(() => undefined);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
