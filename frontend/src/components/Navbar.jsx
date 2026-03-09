import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="bg-emerald-700 shadow-md">
      <div className="flex items-center justify-between px-12 py-4">

        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center gap-3 text-white transition transform hover:scale-105 active:scale-95 duration-200"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
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

          <div className="leading-tight">
            <h1 className="text-xl font-extrabold tracking-wide">
              SelvaCargo
            </h1>
            <span className="text-xs text-emerald-200 tracking-wider">
              Tingo María
            </span>
          </div>
        </Link>

        {/* MENU */}
        <nav className="flex items-center gap-8 text-sm font-semibold">

          {/* INICIAR SESION */}
          <Link
            to="/cliente/login"
            className="text-white transition transform hover:scale-110 active:scale-95 duration-200"
          >
            Iniciar sesión
          </Link>

          {/* REGISTRARSE */}
          <Link
            to="/cliente/registro"
            className="rounded-full bg-white px-4 py-2 text-emerald-700 border border-white transition-all duration-300 transform hover:bg-emerald-700 hover:text-white hover:scale-110 active:scale-95"
          >
            Registrarse
          </Link>

          {/* ACCESO ADMIN */}
          <Link
            to="/admin/login"
            className="flex items-center gap-2 text-white transition transform hover:scale-110 active:scale-95 duration-200"
          >
            Acceso Admin

            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>

          </Link>

        </nav>
      </div>
    </header>
  );
};

export default Navbar;