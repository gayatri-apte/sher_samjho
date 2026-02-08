import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "./routes";
import Navbar from "../components/ui/Navbar";

export default function App() {
  const location = useLocation();
  const hideNav = location.pathname === "/reader" || location.pathname === "/search";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">
      {!hideNav && <Navbar />}

      <Routes>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element}
          />
        ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
