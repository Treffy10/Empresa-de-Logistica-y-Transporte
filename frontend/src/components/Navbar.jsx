  import { Link } from "react-router-dom";

  const Navbar = () => {
    return (
      <header className="bg-emerald-900/70 backdrop-blur border-b border-emerald-800">
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-emerald-300">Selva</span>
              <span className="text-white">Cargo</span>
              <span className="block text-xs font-medium text-white">Tingo María</span>
            </span>
          </Link>
          <Link
            to="/admin/login"
            className="flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-300 transition"
          >
            <span>Acceso Admin</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 transition"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5z" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6v1H4v-1z" />
            </svg>
          </Link>
        </div>
      </header>
    );
  };

  export default Navbar;
