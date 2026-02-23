import {useState, useRef, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth";
import {logout} from "../../services/auth.service";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {isAuthenticated} = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const linkClass = (path: string) =>
    location.pathname === path
      ? "text-blue-400"
      : "hover:text-blue-400";

  const unauthenticatedLinkClass = "hover:text-blue-400 cursor-pointer";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainNavItems: {path: string; label: string}[] = [
    {path: "/", label: "Home"},
    {path: "/search", label: "Search"},
    {path: "/discover", label: "Discover"},
    {path: "/poetry-ai", label: "Poetry AI"},
    {path: "/scan", label: "Scan"},
    {path: "/admin", label: "Admin"},
  ];

  const moreNavItems: {path: string; label: string}[] = [
    {path: "/reader", label: "Reader"},
    {path: "/feed", label: "Daily Feed"},
    {path: "/history", label: "History"},
    {path: "/vocabulary", label: "Vocabulary"},
  ];

  return (
    <nav className="h-16 flex items-center gap-6 px-4 sm:px-6 border-b border-neutral-800 min-w-0 shrink-0">
      {mainNavItems.map(({path, label}) =>
        isAuthenticated ? (
          <Link key={path} to={path} className={linkClass(path)}>
            {label}
          </Link>
        ) : path === "/" ? (
          <Link key={path} to={path} className={linkClass(path)}>
            {label}
          </Link>
        ) : (
          <Link key={path} to="/login" className={unauthenticatedLinkClass}>
            {label}
          </Link>
        )
      )}

      <div className="relative" ref={moreRef}>
        {isAuthenticated ? (
          <>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={
                moreNavItems.some(({path}) => location.pathname === path)
                  ? "text-blue-400"
                  : "hover:text-blue-400"
              }
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              More
            </button>
            {moreOpen && (
              <div
                className="absolute left-0 top-full mt-1 py-2 w-40 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl z-50"
                role="menu"
              >
                {moreNavItems.map(({path, label}) => (
                  <Link
                    key={path}
                    to={path}
                    role="menuitem"
                    className={`block px-4 py-2 text-sm ${linkClass(path)}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={unauthenticatedLinkClass}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              More
            </button>
            {moreOpen && (
              <div
                className="absolute left-0 top-full mt-1 py-2 w-40 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl z-50"
                role="menu"
              >
                {moreNavItems.map(({path, label}) => (
                  <Link
                    key={path}
                    to="/login"
                    role="menuitem"
                    className="block px-4 py-2 text-sm hover:text-blue-400"
                    onClick={() => setMoreOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
