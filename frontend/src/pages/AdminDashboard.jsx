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
  if (status === "Entregado") return "bg-brand-50 text-brand-700";
  if (status === "En Tránsito") return "bg-accent-50 text-accent-500";
  return "bg-warning-50 text-warning-500";
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
        const almacen = data.filter((p) => p.estadoActual === "En Almacén").length;
        const transito = data.filter((p) => p.estadoActual === "En Tránsito").length;
        const entregado = data.filter((p) => p.estadoActual === "Entregado").length;
        const entregadosHoy = data.filter(
          (p) => p.estadoActual === "Entregado" && isToday(p.creadoEn)
        ).length;
        setStats({ ingresados, almacen, transito, entregado, entregadosHoy });
        setLatest(data.slice(0, 5));
      } catch (err) {
        setError(err.message || "No se pudieron cargar los paquetes.");
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">Resumen de operaciones del día.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/paquetes/nuevo")}
          className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          + Nuevo Paquete
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
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

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Paquetes Recientes
            </h2>
            <p className="text-sm text-slate-500">Últimos paquetes registrados</p>
          </div>
          <Link to="/admin/paquetes" className="flex items-center gap-2 text-sm text-slate-500">
            Ver todos
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {latest.length === 0 && (
            <p className="text-sm text-slate-500">Sin registros aún.</p>
          )}
          {latest.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7l9-4 9 4-9 4-9-4z" />
                    <path d="M3 7v10l9 4 9-4V7" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {pkg.codigoSeguimiento}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pkg.destinatario?.nombre || "Cliente"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                    pkg.estadoActual
                  )}`}
                >
                  {pkg.estadoActual}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/paquetes/${pkg.id}`)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h11v10H3z" />
                    <path d="M14 10h4l3 3v4h-7z" />
                    <circle cx="7" cy="19" r="1.5" />
                    <circle cx="18" cy="19" r="1.5" />
                  </svg>
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
