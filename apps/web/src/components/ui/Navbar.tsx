import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { logout } from "../../services/auth.service";

const LINKS: { to: string; label: string }[] = [
  { to: "/ustad", label: "Ustad" },
  { to: "/scan", label: "Scan" },
  { to: "/find", label: "Ek sher tha…" },
  { to: "/baitbazi", label: "Bait-bazi" },
  { to: "/feed", label: "Aaj ka sher" },
  { to: "/search", label: "Search" },
  { to: "/vocabulary", label: "Deck" },
];

const MORE: { to: string; label: string }[] = [
  { to: "/discover", label: "Discover by mood" },
  { to: "/explorer", label: "Eras" },
  { to: "/explorer/poets", label: "Poets" },
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

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#ecd6bd] bg-[#fdf4ea]/90 backdrop-blur">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0 mr-2" aria-label="Sher Samjho home">
          <span className="bg-[#c26a3b] p-1.5 rounded-lg text-white"><BookOpen size={18} /></span>
          <span className="font-semibold text-[#5a2e14]">Sher Samjho</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 min-w-0" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={cls}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="hidden sm:inline px-3 py-2 text-sm text-[#7d5b44] hover:text-[#8a2a1a]"
              title={user?.email ?? "Guest"}
            >
              Log out
            </button>
          ) : (
            <Link to="/login" className="px-4 py-2 rounded-full bg-[#c26a3b] text-white text-sm font-medium hover:bg-[#a9552a]">
              Log in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-full hover:bg-[#f6e7d8] text-[#5a2e14]"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-[#ecd6bd] bg-[#fff8f0] shadow-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-1" aria-label="All pages">
            {[...LINKS, ...MORE].map((l) => (
              <NavLink key={l.to} to={l.to} className={cls} end onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
                className="sm:hidden text-left px-3 py-2 text-sm text-[#8a2a1a]"
              >
                Log out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
