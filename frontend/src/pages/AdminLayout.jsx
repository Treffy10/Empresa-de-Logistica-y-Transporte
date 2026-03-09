import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, getUser } from "../services/api.js";

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 transform ${
    isActive
      ? "bg-green-500 text-white scale-105 shadow-md"
      : "text-white hover:bg-green-500 hover:scale-105"
  }`;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const user = getUser();
  const roleName = user?.roleName;

  const isAdmin = roleName === "Administrador";
  const canSeeDistributors =
    roleName === "Administrador" || roleName === "Operador logístico";
  const canSeeClients =
    roleName === "Administrador" || roleName === "Operador logístico";
  const canSeeDashboard =
    roleName === "Administrador" || roleName === "Operador logístico";

  const handleLogout = () => {
    clearToken();
    navigate("/");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-100">
      <div className="flex h-full">

        {/* SIDEBAR */}
        <aside className="hidden w-64 flex-col bg-gradient-to-b from-green-700 to-green-600 shadow-xl px-6 py-6 lg:flex">

          {/* LOGO EMPRESA */}
          <div className="flex items-center gap-4 mb-8">

            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">

              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-green-700 animate-truck"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>

            </div>

            <div className="leading-tight">
              <h1 className="text-xl font-extrabold text-white tracking-wide">
                Selva Cargo
              </h1>

              <p className="text-sm text-green-200 font-medium">
                Tingo María
              </p>
            </div>

          </div>

          {/* MENU */}
          <nav className="space-y-3 flex-1">

            {canSeeDashboard && (
              <NavLink to="/admin" className={navClass} end>
                📊 Dashboard
              </NavLink>
            )}

            <NavLink to="/admin/paquetes" className={navClass}>
              📦 Paquetes
            </NavLink>

            {isAdmin && (
              <NavLink to="/admin/sucursales" className={navClass}>
                🏢 Sucursales
              </NavLink>
            )}

            {canSeeDistributors && (
              <NavLink to="/admin/distribuidoras" className={navClass}>
                🚚 Distribuidoras
              </NavLink>
            )}

            {canSeeClients && (
              <NavLink to="/admin/clientes" className={navClass}>
                👥 Clientes
              </NavLink>
            )}

            {isAdmin && (
              <NavLink to="/admin/usuarios" className={navClass}>
                🔐 Usuarios
              </NavLink>
            )}

          </nav>

          {/* TARJETA USUARIO */}
          <div className="mt-auto rounded-2xl bg-white/20 backdrop-blur p-4 border border-green-400/30">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-green-700 font-bold">
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {roleName || "Administrador"}
                </p>

                <p className="text-xs text-green-200">
                  {user?.email || "admin"}
                </p>
              </div>

            </div>

            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 hover:scale-105"
            >
              🚪 Cerrar sesión
            </button>

          </div>

        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-auto p-8">

          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg border border-green-200">
            {children || <Outlet />}
          </div>

        </main>

      </div>
    </div>
  );
};

export default AdminLayout;