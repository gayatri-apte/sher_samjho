import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex gap-6 px-6 py-4 border-b border-neutral-800">
      <Link to="/" className="hover:text-blue-400">
        Home
      </Link>

      <Link to="/scan" className="hover:text-blue-400">
        Scan
      </Link>

      <Link to="/login" className="hover:text-blue-400 ml-auto">
        Login
      </Link>
    </nav>
  );
}
