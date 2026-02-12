import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDistributor } from "../services/api.js";

const emptyForm = {
  nombre: "",
  razonSocial: "",
  telefono: "",
  direccion: ""
};

const AdminDistributorNew = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/admin/distribuidoras");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      await createDistributor(form);
      navigate("/admin/distribuidoras");
    } catch (err) {
      setError(err.message || "No se pudo registrar la distribuidora.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Registrar distribuidora
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Completa la información de la distribuidora
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="text-sm text-slate-600">
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Nombre comercial"
          />
        </label>
        <label className="text-sm text-slate-600">
          Razón social
          <input
            name="razonSocial"
            value={form.razonSocial}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Distribuidora de Medicamentos S.A."
          />
        </label>
        <label className="text-sm text-slate-600">
          Teléfono
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="064-562100"
          />
        </label>
        <label className="text-sm text-slate-600">
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Av. Ejemplo 123, Tingo María"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white"
          >
            {loading ? "Guardando..." : "Guardar distribuidora"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default AdminDistributorNew;
