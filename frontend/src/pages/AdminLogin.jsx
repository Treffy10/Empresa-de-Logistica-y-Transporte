import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, login, setToken, setUser } from "../services/api.js";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);

  const images = [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80"
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login({ usuario: username, password });

      setToken(data.token);

      setUser(
        data.user || {
          nombre: "Administrador Sistema",
          email: username,
          rolId: null,
          roleName: "Administrador"
        }
      );

      if (data.user?.roleName === "Cliente") {
        navigate("/cliente");
      } else {
        navigate("/admin");
      }

    } catch (err) {
      setError(err.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getToken()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNextIndex((currentIndex + 1) % images.length);
      setIsFading(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  useEffect(() => {
    if (!isFading) return;

    const timer = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setIsFading(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [isFading, nextIndex]);

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">

        {/* LADO IZQUIERDO */}
        <div className="flex flex-col justify-center px-6 py-12">

          <div className="mx-auto w-full max-w-md text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="19" r="1.5" />
                <circle cx="18" cy="19" r="1.5" />
              </svg>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                SelvaCargo
              </h1>

              <p className="text-sm font-medium text-slate-600">
                Tingo María
              </p>

              <div className="mx-auto mt-3 h-[2px] w-16 rounded-full bg-green-500"></div>

              <p className="mt-2 text-xs text-slate-500">
                Sistema de gestión logística
              </p>
            </div>
          </div>

          {/* FORM */}
          <div className="mx-auto mt-8 w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">

            {/* TITULO VERDE */}
            <div className="mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                Iniciar sesión
              </h2>

              <div className="mt-2 h-[3px] w-14 rounded-full bg-green-600"></div>
            </div>

            <p className="text-sm text-slate-500">
              Ingresa tus credenciales de administrador
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
              autoComplete="off"
            >

              <div>
                <label className="text-sm text-slate-600">
                  Email
                </label>

                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="correo@empresa.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">
                  Contraseña
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

            </form>
          </div>

          {/* BOTON RASTREO */}
          <div className="mx-auto mt-6 text-center">
            <p className="text-xs text-slate-400 mb-3">
              ¿Quieres rastrear un paquete sin iniciar sesión?
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-green-600 px-5 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-600 hover:text-white"
            >
              Ir al portal de rastreo
            </Link>
          </div>

        </div>

        {/* LADO DERECHO */}
        <div className="hidden items-center justify-center bg-slate-900 lg:flex">
          <div className="relative h-full w-full overflow-hidden">

            <div
              className="absolute inset-0 bg-cover bg-left transition-opacity duration-700"
              style={{
                backgroundImage: `linear-gradient(rgba(6,95,70,0.55), rgba(6,95,70,0.55)), url('${images[currentIndex]}')`,
                opacity: isFading ? 0 : 1
              }}
            />

            <div
              className="absolute inset-0 bg-cover bg-left transition-opacity duration-700"
              style={{
                backgroundImage: `linear-gradient(rgba(6,95,70,0.55), rgba(6,95,70,0.55)), url('${images[nextIndex]}')`,
                opacity: isFading ? 1 : 0
              }}
            />

            <div className="relative z-10 flex h-full items-center px-12">
              <div className="max-w-md text-white">

                <h2 className="text-3xl font-semibold">
                  Distribución segura de medicamentos
                </h2>

                <p className="mt-4 text-sm text-white/90">
                  Conectamos distribuidoras con clientes en Tingo María,
                  asegurando entregas rápidas y seguimiento en tiempo real.
                </p>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;