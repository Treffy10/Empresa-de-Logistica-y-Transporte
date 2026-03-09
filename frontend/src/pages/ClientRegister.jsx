import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, setToken, setUser, getDniData } from "../services/api.js";
import PhoneField from "../components/PhoneField.jsx";
import { onlyDigits } from "../utils/phone.js";

const images = [
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
  "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55",
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7",
  "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e"
];

const ClientRegister = () => {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    tipoDocumento: "dni",
    documento: "",
    nombre: "",
    email: "",
    password: "",
    telefonoPais: "PE",
    telefonoNumero: "",
    tipo: "persona",
    direccion: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [dniLoading, setDniLoading] = useState(false);
  const [dniError, setDniError] = useState("");

  const [currentImage, setCurrentImage] = useState(0);

  const lastDniQueriedRef = useRef("");

  // ROTACION DE IMAGENES
  useEffect(() => {

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);

  }, []);

  // ERROR DESAPARECE
  useEffect(() => {

    if (error) {

      const timer = setTimeout(() => {
        setError("");
      }, 5000);

      return () => clearTimeout(timer);

    }

  }, [error]);

  const handleChange = (e) => {

    const { name, value } = e.target;

    const nextValue = name === "documento" ? onlyDigits(value) : value;

    setForm((prev) => {

      const next = { ...prev, [name]: nextValue };

      if (name === "tipoDocumento") {

        if (value === "ruc") next.documento = "";

        return next;

      }

      if (name === "documento" && form.tipoDocumento === "ruc") {

        return { ...next, documento: nextValue.slice(0, 11) };

      }

      if (name === "documento" && form.tipoDocumento === "dni") {

        return { ...next, documento: nextValue.slice(0, 8) };

      }

      return next;

    });

    if (name === "documento") setDniError("");

  };

  const handlePhoneChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

  };

  // CONSULTA DNI
  useEffect(() => {

    if (form.tipoDocumento !== "dni") return;

    const dni = onlyDigits(form.documento);

    if (dni.length !== 8 || dni === lastDniQueriedRef.current) return;

    let cancelled = false;

    const timer = setTimeout(async () => {

      setDniLoading(true);
      setDniError("");

      try {

        const result = await getDniData(dni);

        if (cancelled) return;

        const fullName =
          String(result.nombreCompleto || "").trim() ||
          [result.nombres, result.apellidoPaterno, result.apellidoMaterno]
            .filter(Boolean)
            .join(" ");

        setForm((prev) => ({
          ...prev,
          documento: dni,
          nombre: fullName || prev.nombre
        }));

        lastDniQueriedRef.current = dni;

      } catch (err) {

        if (!cancelled) {

          setDniError(err.message || "No se pudo consultar.");

        }

      } finally {

        if (!cancelled) setDniLoading(false);

      }

    }, 400);

    return () => {

      cancelled = true;
      clearTimeout(timer);

    };

  }, [form.documento, form.tipoDocumento]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const payload = {
        ...form,
        tipo: form.tipoDocumento === "dni" ? "persona" : "empresa"
      };

      const data = await register(payload);

      setToken(data.token);

      setUser(
        data.user || {
          nombre: payload.nombre,
          email: payload.email,
          roleName: "Cliente"
        }
      );

      navigate("/cliente");

    } catch (err) {

      setError(err.message || "No se pudo registrar.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="relative min-h-screen flex flex-col overflow-hidden">

      {/* FONDO IMAGENES */}

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
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 hover:scale-105"
          >

            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>

            Volver al inicio

          </Link>

        </div>

      </header>

      {/* REGISTRO */}

      <main className="flex-1 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-md p-8 shadow-2xl border border-slate-200">

          <h1 className="text-3xl font-semibold text-emerald-700">
            Crear cuenta
          </h1>

          <div className="w-16 h-1 bg-emerald-600 rounded-full mt-2"></div>

          <p className="mt-3 text-sm text-slate-600">
            Regístrate para enviar paquetes y rastrear tus envíos
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* DOCUMENTO */}

            <div className="text-sm text-slate-700">

              Documento *

              <div className="mt-2 flex gap-2">

                <select
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
                  className="w-24 rounded-xl border border-slate-300 px-3 py-3"
                >

                  <option value="dni">DNI</option>
                  <option value="ruc">RUC</option>

                </select>

                <input
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                  required
                  maxLength={form.tipoDocumento === "dni" ? 8 : 11}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
                />

              </div>

              {dniLoading && (
                <p className="text-xs text-slate-500 mt-1">
                  Consultando RENIEC...
                </p>
              )}

              {dniError && (
                <p className="text-xs text-amber-600 mt-1">
                  {dniError}
                </p>
              )}

            </div>

            {/* NOMBRE */}

            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            {/* EMAIL */}

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <PhoneField
              countryValue={form.telefonoPais}
              numberValue={form.telefonoNumero}
              onChange={handlePhoneChange}
            />

            {/* DIRECCION */}

            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              required
              placeholder="Dirección"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            {/* PASSWORD */}

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 animate-pulse">

                {error}

              </div>

            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >

              {loading ? "Registrando..." : "Registrarme"}

            </button>

          </form>

          <p className="mt-4 text-center text-sm text-slate-600">

            ¿Ya tienes cuenta?{" "}

            <Link to="/cliente/login" className="font-semibold text-emerald-600 hover:underline">
              Iniciar sesión
            </Link>

          </p>

        </div>

      </main>

    </div>

  );

};

export default ClientRegister;