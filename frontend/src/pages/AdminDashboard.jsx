import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import { listPackages } from "../services/api.js";

const isToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const statusBadgeClass = (status) => {
  if (status === "Entregado")
    return "bg-green-100 text-green-700 border border-green-200";

  if (status === "En Tránsito")
    return "bg-blue-100 text-blue-700 border border-blue-200";

  return "bg-yellow-100 text-yellow-700 border border-yellow-200";
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    ingresados: 0,
    almacen: 0,
    transito: 0,
    entregado: 0,
    entregadosHoy: 0
  });

  const [latest, setLatest] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listPackages();

        const ingresados = data.filter((p) => isToday(p.creadoEn)).length;
        const almacen = data.filter(
          (p) => p.estadoActual === "En Almacén"
        ).length;

        const transito = data.filter(
          (p) => p.estadoActual === "En Tránsito"
        ).length;

        const entregado = data.filter(
          (p) => p.estadoActual === "Entregado"
        ).length;

        const entregadosHoy = data.filter(
          (p) =>
            p.estadoActual === "Entregado" &&
            isToday(p.creadoEn)
        ).length;

        setStats({
          ingresados,
          almacen,
          transito,
          entregado,
          entregadosHoy
        });

        setLatest(data.slice(0, 5));
      } catch (err) {
        setError(err.message || "No se pudieron cargar los paquetes.");
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
              🚚
            </span>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
                Panel de Control
              </h1>

              <div className="mt-1 h-1 w-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-400"></div>
            </div>

          </div>

          <p className="mt-3 text-slate-500">
            Resumen de operaciones logísticas del día
          </p>

        </div>

        <button
          onClick={() => navigate("/admin/paquetes/nuevo")}
          className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-green-700 hover:scale-105"
        >
          📦 Nuevo Paquete
        </button>

      </div>

      {/* STATS */}
      <div className="grid gap-6 lg:grid-cols-4">

        <StatCard
          label="Ingresados Hoy"
          value={stats.ingresados}
          tone="brand"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7l9-4 9 4-9 4-9-4z" />
              <path d="M3 7v10l9 4 9-4V7" />
            </svg>
          }
        />

        <StatCard
          label="En almacén"
          value={stats.almacen}
          tone="warning"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7l9-4 9 4-9 4-9-4z" />
              <path d="M3 7v10l9 4 9-4V7" />
            </svg>
          }
        />

        <StatCard
          label="En tránsito"
          value={stats.transito}
          tone="accent"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h11v10H3z" />
              <path d="M14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="19" r="1.5" />
              <circle cx="18" cy="19" r="1.5" />
            </svg>
          }
        />

        <StatCard
          label="Entregados Hoy"
          value={stats.entregadosHoy}
          tone="brand"
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12l2.5 2.5L16 9" />
            </svg>
          }
        />

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PAQUETES RECIENTES */}
      <div className="rounded-2xl bg-white p-7 shadow-lg border border-slate-100">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Paquetes Recientes
            </h2>

            <p className="text-sm text-slate-500">
              Últimos registros del sistema
            </p>
          </div>

          <Link
            to="/admin/paquetes"
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            Ver todos →
          </Link>

        </div>

        <div className="mt-6 space-y-4">

          {latest.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay paquetes registrados.
            </p>
          )}

          {latest.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-5 py-4 transition hover:shadow-md hover:bg-slate-50"
            >

              <div className="flex items-center gap-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  📦
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {pkg.codigoSeguimiento}
                  </p>

                  <p className="text-xs text-slate-500">
                    {pkg.destinatario?.nombre || "Cliente"}
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-4">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                    pkg.estadoActual
                  )}`}
                >
                  {pkg.estadoActual}
                </span>

                <button
                  onClick={() => navigate(`/admin/paquetes/${pkg.id}`)}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-green-100 hover:text-green-700"
                >
                  🚚
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;