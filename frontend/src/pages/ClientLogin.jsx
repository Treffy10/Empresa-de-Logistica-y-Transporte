import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, login, setToken, setUser } from "../services/api.js";

const ClientLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError(err.message || "No se pudo iniciar sesión.");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 py-4">
        <div className="mx-auto max-w-xl px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-600 font-semibold">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h11v10H3z" />
              <path d="M14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="19" r="1.5" />
              <circle cx="18" cy="19" r="1.5" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa tus credenciales para acceder a tus envíos
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-600">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="correo@ejemplo.com"
              />
            </label>
            <label className="block text-sm text-slate-600">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="••••••"
              />
            </label>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link to="/cliente/registro" className="font-semibold text-brand-600">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default ClientLogin;
