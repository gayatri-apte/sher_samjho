import { Routes, Route, Navigate } from "react-router-dom";
import routes from "./routes";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f8eee3] text-[#2f1a12] overflow-x-hidden">
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
