import { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "./routes";
import Navbar from "../components/ui/Navbar";

export default function App() {
  const { pathname } = useLocation();
  const bare = pathname === "/login";

  return (
    <div className="min-h-screen bg-[#f8eee3] text-[#2f1a12] overflow-x-hidden">
      {!bare && <Navbar />}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[60vh]" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c26a3b]" />
          </div>
        }
      >
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </div>
  );
}
