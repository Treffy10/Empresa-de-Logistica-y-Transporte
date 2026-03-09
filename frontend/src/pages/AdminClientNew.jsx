import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient, getDniData } from "../services/api.js";
import PhoneField from "../components/PhoneField.jsx";
import { buildPhoneValue, DEFAULT_PHONE_COUNTRY, onlyDigits } from "../utils/phone.js";

const emptyForm = {
  tipo: "persona",
  nombre: "",
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  documento: "",
  telefonoPais: DEFAULT_PHONE_COUNTRY,
  telefonoNumero: "",
  email: "",
  direccion: ""
};

const AdminClientNew = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dniLoading, setDniLoading] = useState(false);
  const [dniLookupError, setDniLookupError] = useState("");
  const lastDniQueriedRef = useRef("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue =
      name === "telefonoNumero"
        ? onlyDigits(value)
        : name === "documento"
        ? onlyDigits(value)
        : value;

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));

    setForm((prev) => {
      const next = { ...prev, [name]: nextValue };

      if (name === "tipo") {
        setDniLookupError("");
        if (nextValue !== "persona") {
          lastDniQueriedRef.current = "";
          next.documento = "";
          next.nombres = "";
          next.apellidoPaterno = "";
          next.apellidoMaterno = "";
        }
      }

      if (name === "documento") {
        setDniLookupError("");
        if (nextValue.length < 8) {
          lastDniQueriedRef.current = "";
          next.nombres = "";
          next.apellidoPaterno = "";
          next.apellidoMaterno = "";
          if (!next.nombre.includes(" ")) next.nombre = "";
        }
      }

      if (
        name === "nombres" ||
        name === "apellidoPaterno" ||
        name === "apellidoMaterno"
      ) {
        next.nombre = [next.nombres, next.apellidoPaterno, next.apellidoMaterno]
          .filter(Boolean)
          .join(" ")
          .trim();
      }

      return next;
    });
  };

  const handleCancel = () => navigate("/admin/clientes");

  const handleDocumentoKeyDown = (event) => {
    if (form.tipo !== "persona") return;

    const allowed = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End"
    ];

    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  };

  useEffect(() => {
    if (form.tipo !== "persona") return;

    const dni = onlyDigits(form.documento);

    if (dni.length !== 8 || dni === lastDniQueriedRef.current) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      setDniLoading(true);
      setDniLookupError("");

      try {
        const result = await getDniData(dni);

        if (cancelled) return;

        const nombres = String(result.nombres || "").trim();
        const apellidoPaterno = String(result.apellidoPaterno || "").trim();
        const apellidoMaterno = String(result.apellidoMaterno || "").trim();

        const fullName =
          String(result.nombreCompleto || "").trim() ||
          [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ");

        setForm((prev) => ({
          ...prev,
          documento: dni,
          nombres: nombres || prev.nombres,
          apellidoPaterno: apellidoPaterno || prev.apellidoPaterno,
          apellidoMaterno: apellidoMaterno || prev.apellidoMaterno,
          nombre: fullName || prev.nombre
        }));
      } catch (err) {
        if (!cancelled) {
          setDniLookupError(
            err.message ||
              "No se pudo consultar RENIEC. Completa los datos manualmente."
          );
        }
      } finally {
        if (!cancelled) {
          lastDniQueriedRef.current = dni;
          setDniLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.documento, form.tipo]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const nextErrors = {};

    if (!form.tipo || !form.email.trim() || !form.direccion.trim()) {
      if (!form.tipo) nextErrors.tipo = "Selecciona el tipo.";
      if (!form.email.trim()) nextErrors.email = "El email es obligatorio.";
      if (!form.direccion.trim()) nextErrors.direccion = "La direccion es obligatoria.";
    }

    if (form.tipo === "persona") {
      const dni = onlyDigits(form.documento);

      if (!dni) nextErrors.documento = "El DNI es obligatorio.";
      else if (dni.length !== 8) nextErrors.documento = "El DNI debe tener 8 digitos.";

      if (!form.nombres.trim()) nextErrors.nombres = "Los nombres son obligatorios.";
      if (!form.apellidoPaterno.trim()) nextErrors.apellidoPaterno = "El apellido paterno es obligatorio.";
      if (!form.apellidoMaterno.trim()) nextErrors.apellidoMaterno = "El apellido materno es obligatorio.";
    }

    const phone = buildPhoneValue(form.telefonoPais, form.telefonoNumero);
    if (!phone.ok) nextErrors.telefonoNumero = phone.error;

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Revisa los campos marcados.");
      return;
    }

    setLoading(true);

    try {
      await createClient({
        ...form,
        telefonoPais: form.telefonoPais,
        telefonoNumero: phone.local,
        telefono: phone.e164
      });

      setSuccess("Cliente creado con éxito.");

      setTimeout(() => navigate("/admin/clientes"), 900);
    } catch (err) {
      setError(err.message || "No se pudo registrar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-lg">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
          👤
        </div>

        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
            Registrar Cliente
          </h2>

          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-400 mt-1"></div>

          <p className="text-sm text-slate-500 mt-2">
            Completa la información del cliente
          </p>
        </div>

      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">

        {/* TIPO */}
        <label className="text-sm font-medium text-slate-600">
          Tipo
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          >
            <option value="persona">Persona</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>

        {/* DNI */}
        <label className="text-sm font-medium text-slate-600">
          Documento
          <input
            name="documento"
            value={form.documento}
            onChange={handleChange}
            onKeyDown={handleDocumentoKeyDown}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        {form.tipo === "persona" && (
          <>
            <label className="text-sm text-slate-600">
              Nombres
              <input
                name="nombres"
                value={form.nombres}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </label>

            <label className="text-sm text-slate-600">
              Apellido paterno
              <input
                name="apellidoPaterno"
                value={form.apellidoPaterno}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </label>

            <label className="text-sm text-slate-600">
              Apellido materno
              <input
                name="apellidoMaterno"
                value={form.apellidoMaterno}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
              />
            </label>
          </>
        )}

        <PhoneField
          countryValue={form.telefonoPais}
          numberValue={form.telefonoNumero}
          onChange={handleChange}
        />

        <label className="text-sm text-slate-600">
          Email
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        <label className="text-sm text-slate-600 md:col-span-2">
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        {/* BOTONES */}
        <div className="md:col-span-2 flex justify-between mt-6">

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:scale-105"
          >
            {loading ? "Guardando..." : "Guardar Cliente"}
          </button>

        </div>

      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

    </div>
  );
};

export default AdminClientNew;