import type { ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";

// Real pages
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import ScanPage from "../pages/scan/ScanPage";

/**
 * Route definition type
 */
export type AppRoute = {
  path: string;
  element: ReactNode;
  protected?: boolean;
};

/**
 * Central route registry
 */
const routes: AppRoute[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/scan",
    element: (
      <ProtectedRoute>
        <ScanPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
];

export default routes;
