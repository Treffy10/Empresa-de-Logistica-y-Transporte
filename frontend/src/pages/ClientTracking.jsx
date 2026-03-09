import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTracking } from "../services/api.js";
import Timeline from "../components/Timeline.jsx";

const statusTone = (status) => {
  if (status === "Entregado") return "bg-emerald-100 text-emerald-700";
  if (status === "En Tránsito") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const ClientTracking = () => {

  const backgroundImages = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581093458791-9f3c3250e56b?q=80&w=1920&auto=format&fit=crop"
  ];

  const [bgIndex, setBgIndex] = useState(0);

  const [code, setCode] = useState("");
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTracking(null);

    if (!code.trim()) return;

    setLoading(true);

    try {
      const data = await getTracking(code.trim());
      setTracking(data);
    } catch (err) {
      setError(err.message || "Código no encontrado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex justify-center px-6 pt-20 pb-12 relative overflow-hidden">

      {/* IMAGENES DE FONDO ROTATIVAS */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-[2000ms]"
        style={{
          backgroundImage: `url(${backgroundImages[bgIndex]})`,
          opacity: 0.10
        }}
      />

      {/* OVERLAY VERDE */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-emerald-900/10"></div>

      <div className="w-full max-w-2xl relative z-10">

        {/* TITULO */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-700">
            Rastrear paquete
          </h1>

          <p className="text-slate-500 mt-2">
            Ingresa tu código de seguimiento para ver el estado de tu envío
          </p>

          <div className="w-16 h-1 bg-emerald-600 mx-auto mt-3 rounded-full"></div>
        </div>

        {/* FORM */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-slate-100">

          <form onSubmit={handleSubmit}>

            <label className="text-sm font-semibold text-slate-600">
              Código de seguimiento
            </label>

            <div className="flex gap-3 mt-2">

              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: TM-2026-1234"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:scale-105 transition disabled:opacity-60"
              >
                {loading ? "Buscando..." : "Rastrear"}
              </button>

            </div>

          </form>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

        </div>

        {/* RESULTADO */}
        {tracking && (
          <div className="mt-8 space-y-6">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>
                  <p className="font-mono text-xl font-bold text-slate-900">
                    {tracking.codigoSeguimiento}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {tracking.descripcion || "Sin descripción"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-1 text-sm font-semibold ${statusTone(
                    tracking.estadoActual
                  )}`}
                >
                  {tracking.estadoActual}
                </span>

              </div>

              <h3 className="mt-6 text-sm font-semibold text-slate-700">
                Destinatario
              </h3>

              <p className="mt-1 text-slate-800">
                {tracking.destinatario?.nombre || "—"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {tracking.destinoTexto || tracking.destinatario?.direccion || ""}
              </p>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <Timeline items={tracking.historial || []} title="Línea de tiempo" />
            </div>

            <div className="text-center">
              <Link
                to="/cliente/envios"
                className="inline-block rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Ver mis envíos
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ClientTracking;