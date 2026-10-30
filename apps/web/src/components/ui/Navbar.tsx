import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Menu, X, LogOut, UserRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/auth.service";

/*
 * The home page cards already link to the core features (Ustad, Scan,
 * Ek sher tha, Bait-bazi, Aaj ka sher, Search, Deck), so the navbar only
 * carries the places that are NOT on a card — no duplicates.
 */
const LINKS: { to: string; label: string }[] = [
  { to: "/discover", label: "Discover" },
  { to: "/explorer/poets", label: "Poets" },
  { to: "/explorer", label: "Eras" },
  { to: "/history", label: "History" },
  { to: "/dashboard", label: "My progress" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);

  const cls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
      isActive ? "bg-[#f3dcc4] text-[#8b4513] font-medium" : "text-[#5b4636] hover:bg-[#f6e7d8]"
    }`;

  const name = user?.isAnonymous
    ? "Guest"
    : user?.displayName || user?.email?.split("@")[0] || "";

  async function doLogout() {
    setOpen(false);
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#ecd6bd] bg-[#fdf4ea]/90 backdrop-blur">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Sher Samjho home">
          <span className="bg-[#c26a3b] p-1.5 rounded-lg text-white"><BookOpen size={18} /></span>
          <span className="font-semibold text-[#5a2e14]">Sher Samjho</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end className={cls}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm text-[#7d5b44]">
                <UserRound size={16} /> {name}
              </span>
              <button
                type="button"
                onClick={doLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-[#7d5b44] hover:bg-[#f6e7d8] hover:text-[#8a2a1a]"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]">
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-full hover:bg-[#f6e7d8] text-[#5a2e14]"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute inset-x-0 top-16 border-b border-[#ecd6bd] bg-[#fff8f0] shadow-lg">
          <nav className="px-4 py-3 grid grid-cols-2 gap-1" aria-label="Menu">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end className={cls} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <button type="button" onClick={doLogout} className="text-left px-3 py-2 text-sm text-[#8a2a1a]">
                Log out ({name})
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
