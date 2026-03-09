import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDistributor } from "../services/api.js";
import PhoneField from "../components/PhoneField.jsx";
import { buildPhoneValue, DEFAULT_PHONE_COUNTRY, onlyDigits } from "../utils/phone.js";

const emptyForm = {
  nombre: "",
  razonSocial: "",
  telefonoPais: DEFAULT_PHONE_COUNTRY,
  telefonoNumero: "",
  direccion: ""
};

const AdminDistributorNew = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));

    setForm((prev) => ({
      ...prev,
      [name]: name === "telefonoNumero" ? onlyDigits(value) : value
    }));
  };

  const handleCancel = () => {
    navigate("/admin/distribuidoras");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!form.razonSocial.trim()) nextErrors.razonSocial = "La razon social es obligatoria.";
    if (!form.direccion.trim()) nextErrors.direccion = "La direccion es obligatoria.";

    const phone = buildPhoneValue(form.telefonoPais, form.telefonoNumero);

    if (!phone.ok) nextErrors.telefonoNumero = phone.error;

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Revisa los campos marcados.");
      return;
    }

    setLoading(true);

    try {
      await createDistributor({
        nombre: form.nombre.trim(),
        razonSocial: form.razonSocial.trim(),
        telefonoPais: form.telefonoPais,
        telefonoNumero: phone.local,
        telefono: phone.e164,
        direccion: form.direccion.trim()
      });

      setSuccess("Distribuidora creada con éxito.");

      setTimeout(() => {
        navigate("/admin/distribuidoras");
      }, 900);

    } catch (err) {
      setError(err.message || "No se pudo registrar la distribuidora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-lg">

      {/* HEADER */}
      <div>

        <div className="flex items-center gap-3">

          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
            🚚
          </span>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
              Registrar Distribuidora
            </h2>

            <div className="mt-1 h-1 w-28 rounded-full bg-gradient-to-r from-green-600 to-emerald-400"></div>
          </div>

        </div>

        <p className="mt-3 text-sm text-slate-500">
          Completa la información de la empresa distribuidora
        </p>

      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">

        {/* NOMBRE */}
        <label className="text-sm font-medium text-slate-600">

          Nombre *

          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fieldErrors.nombre ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Nombre comercial"
            required
          />

          {fieldErrors.nombre && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.nombre}
            </span>
          )}

        </label>

        {/* RAZON SOCIAL */}
        <label className="text-sm font-medium text-slate-600">

          Razón social *

          <input
            name="razonSocial"
            value={form.razonSocial}
            onChange={handleChange}
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fieldErrors.razonSocial ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Distribuidora de Medicamentos S.A."
            required
          />

          {fieldErrors.razonSocial && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.razonSocial}
            </span>
          )}

        </label>

        {/* TELEFONO */}
        <PhoneField
          countryValue={form.telefonoPais}
          numberValue={form.telefonoNumero}
          onChange={handleChange}
          error={fieldErrors.telefonoNumero}
        />

        {/* DIRECCION */}
        <label className="text-sm font-medium text-slate-600">

          Dirección *

          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 ${
              fieldErrors.direccion ? "border-red-300" : "border-slate-200"
            }`}
            placeholder="Av. Ejemplo 123, Tingo María"
            required
          />

          {fieldErrors.direccion && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.direccion}
            </span>
          )}

        </label>

        {/* BOTONES */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between mt-3">

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-green-700 hover:scale-105"
          >
            {loading ? "Guardando..." : "Guardar distribuidora"}
          </button>

        </div>

      </form>

      {/* MENSAJES */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

    </div>
  );
};

export default AdminDistributorNew;