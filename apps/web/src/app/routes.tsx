import type { ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";
import HistoryPage from "../pages/history/HistoryPage";
import HistoryDetailPage from "../pages/history/HistoryDetailPage";
import VocabularyPage from "../pages/vocabulary/VocabularyPage";
import ReaderPage from "../pages/reader/ReaderPage";
import SearchPage from "../pages/search/SearchPage";
import DiscoverPage from "../pages/discover/DiscoverPage";
import EraExplorerPage from "../pages/explorer/EraExplorerPage";
import PoetExplorer from "./explorer/PoetExplorer";
import PoetDetails from "./explorer/PoetDetails";
import ThemeExplorer from "./explorer/ThemeExplorer";
import DailyFeed from "./feed/DailyFeed";
import AdminDashboard from "./admin/AdminDashboard";

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
    path: "/feed",
    element: <DailyFeed />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/discover",
    element: <DiscoverPage />,
  },
  {
    path: "/explorer",
    element: <EraExplorerPage />,
  },
  {
    path: "/explorer/poets",
    element: <PoetExplorer />,
  },
  {
    path: "/explorer/poets/:name",
    element: <PoetDetails />,
  },
  {
    path: "/explorer/themes",
    element: <ThemeExplorer />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
    protected: true,
  },
];

export default routes;
