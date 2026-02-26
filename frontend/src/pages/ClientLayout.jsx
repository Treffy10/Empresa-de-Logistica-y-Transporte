import { Outlet, Link, useNavigate, NavLink } from "react-router-dom";
import { getUser, clearToken } from "../services/api.js";

const ClientLayout = () => {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/cliente" className="flex items-center gap-3 text-lg font-bold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>
            </span>
            <span>
              LogiMed
              <span className="block text-xs font-medium text-slate-400">Mi cuenta</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.nombre || user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-6 flex gap-6 border-t border-slate-100">
          <NavLink
            to="/cliente"
            end
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive ? "border-brand-600 text-brand-600" : "border-transparent text-slate-600 hover:text-brand-600"
              }`
            }
          >
            Inicio
          </NavLink>
          <NavLink
            to="/cliente/enviar"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive ? "border-brand-600 text-brand-600" : "border-transparent text-slate-600 hover:text-brand-600"
              }`
            }
          >
            Enviar paquete
          </NavLink>
          <NavLink
            to="/cliente/rastrear"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive ? "border-brand-600 text-brand-600" : "border-transparent text-slate-600 hover:text-brand-600"
              }`
            }
          >
            Rastrear
          </NavLink>
          <NavLink
            to="/cliente/envios"
            className={({ isActive }) =>
              `py-3 text-sm font-medium border-b-2 ${
                isActive ? "border-brand-600 text-brand-600" : "border-transparent text-slate-600 hover:text-brand-600"
              }`
            }
          >
            Mis envíos
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ClientLayout;
