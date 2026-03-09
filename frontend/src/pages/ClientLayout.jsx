import { Outlet, Link, useNavigate, NavLink } from "react-router-dom";
import { getUser, clearToken } from "../services/api.js";

const ClientLayout = () => {
  const user = getUser();
  const navigate = useNavigate();

  const firstName = user?.nombre ? user.nombre.split(" ")[0] : user?.email;

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-emerald-600 shadow-md border-b border-emerald-700">
        <div className="w-full px-6 py-4 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/cliente" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>
            </span>

            <span className="leading-tight">
              <span className="block text-xl font-bold text-white tracking-wide">
                SelvaCargo
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Mi cuenta
              </span>
            </span>
          </Link>

          {/* USER */}
          <div className="flex items-center gap-5">

            <span className="text-sm font-medium text-white">
              Hola, {firstName}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-600 shadow transition transform hover:scale-110 hover:bg-emerald-50 active:scale-95"
            >
              Cerrar sesión
            </button>

          </div>

        </div>

        {/* NAV */}
        <nav className="w-full px-6 flex gap-8 border-t border-emerald-500">
          <NavLink
            to="/cliente"
            end
            className={({ isActive }) =>
              `py-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-emerald-100 hover:text-white"
              }`
            }
          >
            Inicio
          </NavLink>

          <NavLink
            to="/cliente/enviar"
            className={({ isActive }) =>
              `py-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-emerald-100 hover:text-white"
              }`
            }
          >
            Registrar paquete
          </NavLink>

          <NavLink
            to="/cliente/rastrear"
            className={({ isActive }) =>
              `py-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-emerald-100 hover:text-white"
              }`
            }
          >
            Rastrear
          </NavLink>

          <NavLink
            to="/cliente/envios"
            className={({ isActive }) =>
              `py-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-emerald-100 hover:text-white"
              }`
            }
          >
            Mis envíos
          </NavLink>
        </nav>
      </header>

      {/* CONTENIDO */}
      <main className="w-full">
        <Outlet />
      </main>

    </div>
  );
};

export default ClientLayout;