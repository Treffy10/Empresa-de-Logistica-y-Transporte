import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const images = [
  "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1600", 
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1600",
];

const Home = () => {
  const [code, setCode] = useState("");
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000); // cambia cada 4 segundos

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    navigate(`/seguimiento?code=${encodeURIComponent(code.trim())}`);
  };

  return (
    <section className="h-screen flex">
      
      {/* LADO IZQUIERDO - SLIDER */}
      <div className="hidden md:block w-1/2 relative overflow-hidden">
        <img
          key={current}
          src={images[current]}
          alt="Selva"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-2000"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute bottom-24 left-10 text-white">
          <h2 className="text-3xl font-bold">Conectamos la Selva</h2>
          <p className="text-sm mt-2">Logística segura y rápida en Tingo María</p>
        </div>
      </div>

      {/* LADO DERECHO - FORMULARIO */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center border border-slate-200 shadow-xl">
          <h1 className="text-2xl font-semibold text-slate-900">
            Rastrea tu Pedido
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa el código de seguimiento
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Ej: TM-2501-X9"
              className="w-full rounded-xl border border-slate-200 px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <button
              type="submit"
              className="w-full rounded-full bg-emerald-700 px-6 py-4 text-sm font-semibold text-white hover:bg-emerald-800 transition"
            >
              Rastrear Paquete
            </button>
          </form>
        </div>
      </div>

    </section>
  );
};

export default Home;