import { lazy, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
const HistoryPage = lazy(() => import("../pages/history/HistoryPage"));
const HistoryDetailPage = lazy(() => import("../pages/history/HistoryDetailPage"));
const VocabularyPage = lazy(() => import("../pages/vocabulary/VocabularyPage"));
const ReaderPage = lazy(() => import("../pages/reader/ReaderPage"));
const SearchPage = lazy(() => import("../pages/search/SearchPage"));
const DiscoverPage = lazy(() => import("../pages/discover/DiscoverPage"));
const EraExplorerPage = lazy(() => import("../pages/explorer/EraExplorerPage"));
const PoetExplorer = lazy(() => import("./explorer/PoetExplorer"));
const PoetDetails = lazy(() => import("./explorer/PoetDetails"));
const DailyFeed = lazy(() => import("./feed/DailyFeed"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const PoetryAIPage = lazy(() => import("./poetry-ai/PoetryAIPage"));
const LeaderboardPage = lazy(() => import("./leaderboard/LeaderboardPage"));
const DashboardPage = lazy(() => import("./dashboard/DashboardPage"));

const UstadPage = lazy(() => import("../pages/ustad/UstadPage"));
const FindSherPage = lazy(() => import("../pages/find/FindSherPage"));
const BaitBaziPage = lazy(() => import("../pages/baitbazi/BaitBaziPage"));

// Real pages
import HomePage from "../pages/home/HomePage";
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const ScanPage = lazy(() => import("../pages/scan/ScanPage"));

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
  // Voice features
  { path: "/ustad", element: <UstadPage /> },
  { path: "/ustad/:sherId", element: <UstadPage /> },
  { path: "/find", element: <FindSherPage /> },
  { path: "/baitbazi", element: <BaitBaziPage /> },
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
    element: <Navigate to="/discover" replace />,
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
  {
    path: "/poetry-ai",
    element: <PoetryAIPage />,
  },
  {
    path: "/poetry-ai/:textHash",
    element: <PoetryAIPage />,
  },
  {
    path: "/leaderboard",
    element: (
      <ProtectedRoute>
        <LeaderboardPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
    protected: true,
  },
];

export default routes;
