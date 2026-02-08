import type { ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";
import HistoryPage from "../pages/history/HistoryPage";
import HistoryDetailPage from "../pages/history/HistoryDetailPage";
import VocabularyPage from "../pages/vocabulary/VocabularyPage";
import ReaderPage from "../pages/reader/ReaderPage";
import SearchPage from "../pages/search/SearchPage";


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
  {
    path: "/history",
    element: (
      <ProtectedRoute>
        <HistoryPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: "/vocabulary",
    element: (
      <ProtectedRoute>
        <VocabularyPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: "/history/:id",
    element: (
      <ProtectedRoute>
        <HistoryDetailPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: "/reader",
    element: <ReaderPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
];

export default routes;
