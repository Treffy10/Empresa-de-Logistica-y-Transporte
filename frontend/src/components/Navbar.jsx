import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 text-lg font-bold text-slate-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
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
          <span>
            LogiMed
            <span className="block text-xs font-medium text-slate-400">Tingo María</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/cliente/login" className="text-sm font-semibold text-slate-600 hover:text-brand-600">
            Iniciar sesión
          </Link>
          <Link to="/cliente/registro" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Registrarse
          </Link>
          <Link to="/admin/login" className="text-sm font-semibold text-slate-500">
            Acceso Admin
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
