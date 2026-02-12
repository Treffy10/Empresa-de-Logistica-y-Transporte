import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createBranch } from "../services/api.js";

const emptyForm = {
  nombre: "",
  direccion: ""
};

const AdminBranchNew = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/admin/sucursales");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.direccion.trim()) {
      setError("Nombre y dirección son obligatorios.");
      return;
    }
    setLoading(true);
    try {
      await createBranch(form);
      navigate("/admin/sucursales");
    } catch (err) {
      setError(err.message || "No se pudo registrar la sucursal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Registrar sucursal
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Completa la información de la sucursal
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
            placeholder="Sucursal Tingo María"
          />
        </label>
        <label className="text-sm text-slate-600">
          Dirección
          <input
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Av. Principal 123"
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
            {loading ? "Guardando..." : "Guardar sucursal"}
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

export default AdminBranchNew;
