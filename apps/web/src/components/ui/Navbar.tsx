import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/auth.service";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const linkClass = (path: string) =>
    location.pathname === path
      ? "text-blue-400"
      : "hover:text-blue-400";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="h-16 flex items-center gap-6 px-6 border-b border-neutral-800">
      <Link to="/" className={linkClass("/")}>
        Home
      </Link>

      {isAuthenticated ? (
        <Link to="/scan" className={linkClass("/scan")}>
          Scan
        </Link>
      ) : (
        <span className="text-neutral-500 cursor-not-allowed">
          Scan
        </span>
      )}

      <div className="ml-auto">
        {!isAuthenticated ? (
          <Link to="/login" className={linkClass("/login")}>
            Login
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            className="hover:text-red-400 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
