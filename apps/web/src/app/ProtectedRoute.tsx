import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 h-[calc(100vh-4rem)]" role="status">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c26a3b]" />
        <p className="text-[#94725a]">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where the user was going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
