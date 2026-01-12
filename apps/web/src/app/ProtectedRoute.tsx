import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * TEMP auth check
 * (will be replaced by Firebase auth later)
 */
function useAuth() {
  return {
    isAuthenticated: false, // change to true to test
  };
}

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
