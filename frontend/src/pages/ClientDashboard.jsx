import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const images = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
  "https://images.unsplash.com/photo-1553413077-190dd305871c",
  "https://images.unsplash.com/photo-1601582589907-f92af5ed9db8",
  "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e"
];

const ClientDashboard = () => {
  const [bg, setBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBg((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[80vh] flex items-start justify-center pt-16 overflow-hidden">

      {/* Fondo dinámico */}
      <div className="absolute inset-0 -z-10">
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ${
              bg === i ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}

        {/* Capa verde suave */}
        <div className="absolute inset-0 bg-green-600/10"></div>
      </div>

      {/* Contenido */}
      <div className="w-full max-w-6xl px-4">

        {/* Titulo */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Bienvenido
          </h1>
          <p className="mt-2 text-slate-600">
            Gestiona tus envíos, rastrea paquetes y realiza pagos desde aquí.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* Enviar */}
          <Link
            to="/cliente/enviar"
            className="group block rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>
            </span>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Enviar paquete
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ingresa los datos del destinatario y el peso. Tarifa estándar: 10
              soles por paquete hasta 2 kg.
            </p>
          </Link>

          {/* Rastrear */}
          <Link
            to="/cliente/rastrear"
            className="group block rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Rastrear
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Ingresa el código de seguimiento para ver el estado de tu envío
              en tiempo real.
            </p>
          </Link>

          {/* Mis envios */}
          <Link
            to="/cliente/envios"
            className="group block rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-green-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Mis envíos
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Revisa todos tus paquetes enviados y recibidos, y realiza el pago
              cuando corresponda.
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;