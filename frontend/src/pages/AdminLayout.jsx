import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, getUser } from "../services/api.js";

const navClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
    isActive
      ? "bg-brand-50 text-brand-700"
      : "text-slate-500 hover:text-brand-700"
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
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden w-64 min-h-screen flex-col border-r border-slate-100 bg-white px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
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
            LogiMed
          </div>
          <p className="mt-1 text-xs text-slate-400">Tingo María</p>

          <nav className="mt-8 space-y-2">
            {canSeeDashboard && (
              <NavLink to="/admin" className={navClass} end>
                Dashboard
              </NavLink>
            )}
            <NavLink to="/admin/paquetes" className={navClass}>
              Paquetes
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/sucursales" className={navClass}>
                Sucursales
              </NavLink>
            )}
            {canSeeDistributors && (
              <NavLink to="/admin/distribuidoras" className={navClass}>
                Distribuidoras
              </NavLink>
            )}
            {canSeeClients && (
              <NavLink to="/admin/clientes" className={navClass}>
                Clientes
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/usuarios" className={navClass}>
                Usuarios
              </NavLink>
            )}
          </nav>

          <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[15px] font-semibold text-slate-700">
              {roleName || "Administrador"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {user?.email || "admin"}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 lg:px-10">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
