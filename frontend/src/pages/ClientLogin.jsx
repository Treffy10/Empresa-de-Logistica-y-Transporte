import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, login, setToken, setUser } from "../services/api.js";

const images = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
  "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55",
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7",
  "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e"
];

const ClientLogin = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentImage, setCurrentImage] = useState(0);

  // ROTACIÓN DE IMÁGENES
  useEffect(() => {

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);

  }, []);

  // EL ERROR DESAPARECE EN 5 SEGUNDOS
  useEffect(() => {

    if (error) {

      const timer = setTimeout(() => {
        setError("");
      }, 5000);

      return () => clearTimeout(timer);

    }

  }, [error]);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setError("");
    setLoading(true);

    try {

      const data = await login({ usuario: email, password });

      if (data.user?.roleName !== "Cliente") {

        setError("Esta cuenta es de personal. Use el acceso de administración.");
        setLoading(false);
        return;

      }

      setToken(data.token);
      setUser(data.user);

      navigate("/cliente");

    } catch (err) {

      setError("Credenciales inválidas.");

      // LIMPIAR CAMPOS
      setEmail("");
      setPassword("");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    if (getToken()) {

      const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

      if (user?.roleName === "Cliente") {

        navigate("/cliente", { replace: true });

      }

    }

  }, [navigate]);

  return (

    <div className="relative min-h-screen flex flex-col overflow-hidden">

      {/* FONDO CON IMÁGENES */}

      <div className="absolute inset-0 -z-10">

        {images.map((img, index) => (

          <img
            key={index}
            src={`${img}?auto=format&fit=crop&w=1600&q=80`}
            className={`absolute w-full h-full object-cover transition-opacity duration-[2000ms] ${
              index === currentImage ? "opacity-30" : "opacity-0"
            }`}
          />

        ))}

      </div>

      {/* HEADER */}

      <header className="bg-emerald-700 text-white shadow-md">

        <div className="w-full px-6 py-4 flex items-center gap-6">

          <div>

            <h1 className="text-2xl font-extrabold tracking-wide">
              SelvaCargo
            </h1>

            <span className="text-xs text-emerald-200 tracking-wider">
              Tingo María
            </span>

          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 hover:scale-105 active:scale-95"
          >

            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>

            Volver al inicio

          </Link>

        </div>

      </header>

      {/* LOGIN */}

      <main className="flex-1 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-md p-8 shadow-2xl border border-slate-200">

          <h2 className="text-3xl font-semibold text-emerald-700 tracking-wide">
            Iniciar sesión
          </h2>

          <div className="w-16 h-1 bg-emerald-600 rounded-full mt-2"></div>

          <p className="mt-3 text-sm text-slate-600">
            Ingresa tus credenciales para acceder a tus envíos
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >

            {/* EMAIL */}

            <label className="block text-sm text-slate-700">

              Email

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="correo@ejemplo.com"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

            </label>

            {/* PASSWORD */}

            <label className="block text-sm text-slate-700">

              Contraseña

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

            </label>

            {/* ERROR */}

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 animate-pulse">

                {error}

              </div>

            )}

            {/* BOTÓN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-300 hover:scale-[1.04] hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
            >

              {loading ? "Ingresando..." : "Ingresar"}

            </button>

          </form>

          <p className="mt-5 text-center text-sm text-slate-600">

            ¿No tienes cuenta?{" "}

            <Link
              to="/cliente/registro"
              className="font-semibold text-emerald-600 hover:underline"
            >
              Regístrate
            </Link>

          </p>

        </div>

      </main>

    </div>

  );

};

export default ClientLogin;