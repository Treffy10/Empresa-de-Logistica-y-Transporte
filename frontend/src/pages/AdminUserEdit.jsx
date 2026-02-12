import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserById,
  listBranches,
  listRoles,
  updateUser
} from "../services/api.js";

const AdminUserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    rolId: "",
    sucursalId: "",
    activo: true
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, rolesData, branchesData] = await Promise.all([
          getUserById(id),
          listRoles(),
          listBranches()
        ]);
        setRoles(rolesData);
        setBranches(branchesData);
        setForm((prev) => ({
          ...prev,
          nombre: userData.nombre || "",
          email: userData.email || "",
          telefono: userData.telefono || "",
          rolId: userData.rolId || "",
          sucursalId: userData.sucursalId || "",
          activo: userData.activo ?? true
        }));
      } catch (err) {
        setError(err.message || "No se pudo cargar el usuario.");
      }
    };
    load();
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCancel = () => {
    navigate("/admin/usuarios");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.email.trim()) {
      setError("Nombre y email son obligatorios.");
      return;
    }
    if (form.password && form.password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        rolId: form.rolId || roles[0]?.id,
        sucursalId: form.sucursalId || branches[0]?.id,
        activo: form.activo
      };
      if (form.password) {
        payload.password = form.password;
      }
      await updateUser(id, payload);
      navigate("/admin/usuarios");
    } catch (err) {
      setError(err.message || "No se pudo actualizar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Editar usuario
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Actualiza la información del usuario
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-600">
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            placeholder="Nombre completo"
            autoComplete="off"
          />
        </label>
        <label className="text-sm text-slate-600">
          Email
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm"
            placeholder="correo@empresa.com"
            autoComplete="new-email"
          />
        </label>
        <label className="text-sm text-slate-600">
          Teléfono
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm"
            placeholder="Ej: 999888777"
            autoComplete="off"
          />
        </label>
        <label className="text-sm text-slate-600">
          Nueva contraseña (opcional)
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-sm"
            placeholder="Deja en blanco para mantener"
            autoComplete="new-password"
          />
        </label>
        <label className="text-sm text-slate-600">
          Rol
          <select
            name="rolId"
            value={form.rolId}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="">Seleccionar</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Sucursal
          <select
            name="sucursalId"
            value={form.sucursalId}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="">Seleccionar</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            className="h-4 w-4"
          />
          Usuario activo
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
            {loading ? "Guardando..." : "Guardar cambios"}
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

export default AdminUserEdit;
