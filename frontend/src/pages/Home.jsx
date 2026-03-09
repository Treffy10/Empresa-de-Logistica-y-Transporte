import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const images = [
  "https://images.pexels.com/photos/6169668/pexels-photo-6169668.jpeg",
  "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg",
  "https://images.pexels.com/photos/262353/pexels-photo-262353.jpeg"
];

const Home = () => {
  const [code, setCode] = useState("");
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    images.forEach((img) => {
      const image = new Image();
      image.src = img;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanCode = code.trim();
    if (!cleanCode) return;

    navigate(`/seguimiento?code=${encodeURIComponent(cleanCode)}`);
  };

  return (
    <section className="min-h-screen flex">

      {/* 🔵 SLIDER */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden h-screen">

        {images.map((img, index) => (
          <img
            key={`slide-${index}`}
            src={img}
            alt="Logística SelvaCargo"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-black/40"></div>

        <div className="absolute bottom-20 left-11 text-white max-w-lg">
          <h2 className="text-4xl font-bold leading-tight drop-shadow-md">
            Envíos rápidos y seguros
          </h2>
          <p className="mt-2 text-lg opacity-85">
            Conectando Tingo María de manera eficiente y confiable
          </p>
        </div>

      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-12 bg-slate-50">

        <div className="w-full max-w-xl rounded-3xl bg-white/90 backdrop-blur-xl p-12 text-center border border-slate-200 shadow-xl">

          {/* 🔹 TITULO MEJORADO */}
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent tracking-tight">
            Rastrea tu Pedido
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresa el código de seguimiento que te proporcionamos
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <label htmlFor="trackingCode" className="sr-only">
              Código de seguimiento
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm focus-within:ring-2 focus-within:ring-green-600 transition">

              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>

              <input
                id="trackingCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: TM-2501-X9"
                className="w-full bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-sm font-semibold text-white shadow-md hover:scale-[1.02] hover:shadow-lg transition"
            >
              Rastrear Paquete
            </button>

          </form>

          <div className="mt-8 flex justify-center gap-6 text-sm">

            <Link
              to="/cliente/login"
              className="font-semibold text-slate-600 hover:text-green-600 transition"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/cliente/registro"
              className="font-semibold text-green-600 hover:text-green-700 transition"
            >
              Registrarse para enviar
            </Link>

          </div>

          <div className="mt-8 text-xs text-slate-400">
            SelvaCargo Tingo María © 2026
            <span className="block mt-1">
              Control y seguimiento de manera segura
            </span>
          </div>

        </div>

      </div>

    </section>
  );
};

export default Home;