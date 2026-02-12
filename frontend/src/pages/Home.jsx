import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    navigate(`/seguimiento?code=${encodeURIComponent(code.trim())}`);
  };

  return (
    <section className="min-h-[calc(100vh-120px)] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl bg-white p-10 text-center border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <h1 className="text-2xl font-semibold text-slate-900">
            Rastrea tu Pedido
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa el código de seguimiento que te proporcionamos
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4 text-sm text-slate-600">
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
                placeholder="Ej: TM-2501-X9"
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-brand-600 px-6 py-4 text-sm font-semibold text-white shadow-sm"
            >
              Rastrear Paquete
            </button>
          </form>
        </div>

        <div className="mt-10 text-center text-xs text-slate-400">
          LogiMed Tingo María © 2026
          <span className="block mt-1">Distribución segura de medicamentos</span>
        </div>
      </div>
    </section>
  );
};

export default Home;
