import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Timeline from "../components/Timeline.jsx";
import { getTracking } from "../services/api.js";

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return new Date(trimmed);
    }
    const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    return new Date(`${withT}Z`);
  }
  return new Date(value);
};

const formatDate = (value) => {
  const date = normalizeDate(value);
  if (!date || Number.isNaN(date.getTime())) return value || "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
    hour12: true
  }).format(date);
};

const statusTone = (status) => {
  if (status === "Entregado") return "bg-brand-50 text-brand-700";
  if (status === "En Tránsito") return "bg-accent-50 text-accent-500";
  return "bg-warning-50 text-warning-500";
};

const Tracking = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(null);
  const [searchParams] = useSearchParams();

  const fetchTracking = async (value) => {
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    setTracking(null);

    try {
      const data = await getTracking(value.trim());
      setTracking(data);
    } catch (err) {
      setError(err.message || "No se encontró el código de seguimiento.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetchTracking(code);
  };

  useEffect(() => {
    const queryCode = searchParams.get("code");
    if (!queryCode) return;
    setCode(queryCode);
    fetchTracking(queryCode);
  }, [searchParams]);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 text-center">
          Rastrea tu pedido
        </h1>
        <p className="mt-2 text-center text-slate-500">
          Ingresa el código de seguimiento que te proporcionamos.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4 sm:flex-row"
        >
          <div className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej. TM-2026-0001"
              className="w-full bg-transparent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Rastrear paquete"}
          </button>
        </form>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {tracking && (
        <div className="mt-10 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                {tracking.codigoSeguimiento}
              </p>
              <p className="text-sm text-slate-500">
                Registrado el {formatDate(tracking.historial?.[0]?.fechaHora)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-1 text-sm font-semibold ${statusTone(
                  tracking.estadoActual
                )}`}
              >
                {tracking.estadoActual}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-semibold text-slate-700">
                  Distribuidora
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {tracking.remitente?.nombre || "Sin remitente"}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-semibold text-slate-700">
                  Cliente destino
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {tracking.destinatario?.nombre || "Sin destinatario"}
                </p>
                <div className="mt-3 text-sm text-slate-500">
                  <p>{tracking.destinatario?.direccion || "Dirección no registrada"}</p>
                  <p>{tracking.destinatario?.telefono || "Teléfono no registrado"}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Detalles</p>
                <p className="mt-3 text-sm text-slate-500">Descripción</p>
                <p className="text-slate-800">
                  {tracking.descripcion || "Sin descripción"}
                </p>
                <p className="mt-3 text-sm text-slate-500">Observaciones</p>
                <p className="text-slate-800">
                  {tracking.historial?.[tracking.historial.length - 1]?.observacion ||
                    "Sin observaciones"}
                </p>
              </div>
            </div>

            <Timeline items={tracking.historial} title="Línea de tiempo" />
          </div>
        </div>
      )}
    </section>
  );
};

export default Tracking;
