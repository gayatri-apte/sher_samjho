import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth";
import {logout} from "../../services/auth.service";

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
    <nav className="h-16 flex items-center gap-6 px-4 sm:px-6 border-b border-neutral-800 min-w-0 shrink-0">
      <Link to="/" className={linkClass("/")}>
        Home
      </Link>
      <Link to="/search" className={linkClass("/search")}>
        Search
      </Link>
      <Link to="/discover" className={linkClass("/discover")}>
        Discover
      </Link>
      <Link to="/reader" className={linkClass("/reader")}>
        Reader
      </Link>
      <Link to="/feed" className={linkClass("/feed")}>
        Daily Feed
      </Link>

      {isAuthenticated ? (
        <>
          <Link to="/scan" className={linkClass("/scan")}>
            Scan
          </Link>
          <Link to="/history" className={linkClass("/history")}>
            History
          </Link>
          <Link to="/vocabulary" className={linkClass("/vocabulary")}>
            Vocabulary
          </Link>
          <Link to="/admin" className={linkClass("/admin")}>
            Admin
          </Link>
        </>
      ) : (
        <>
          <span className="text-neutral-500 cursor-not-allowed">
            Scan
          </span>
          <span className="text-neutral-500 cursor-not-allowed">
            History
          </span>
          <span className="text-neutral-500 cursor-not-allowed">
            Vocabulary
          </span>
          <span className="text-neutral-500 cursor-not-allowed">
            Admin
          </span>
        </>
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
