import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "../services/api.js";

const emptyForm = {
  tipo: "persona",
  nombre: "",
  documento: "",
  telefono: "",
  email: "",
  direccion: ""
};

const AdminClientNew = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/admin/clientes");
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
      await createClient(form);
      navigate("/admin/clientes");
    } catch (err) {
      setError(err.message || "No se pudo registrar el cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Registrar cliente
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Completa la información del cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-600">
          Tipo
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="persona">Persona</option>
            <option value="empresa">Empresa</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Nombre / Razón social
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Nombre completo"
          />
        </label>
        <label className="text-sm text-slate-600">
          Documento
          <input
            name="documento"
            value={form.documento}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="DNI o RUC"
          />
        </label>
        <label className="text-sm text-slate-600">
          Teléfono
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Número de contacto"
          />
        </label>
        <label className="text-sm text-slate-600">
          Email
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="correo@empresa.com"
          />
        </label>
        <label className="text-sm text-slate-600">
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Dirección"
          />
        </label>
        <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-between">
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
            {loading ? "Guardando..." : "Guardar cliente"}
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

export default AdminClientNew;
