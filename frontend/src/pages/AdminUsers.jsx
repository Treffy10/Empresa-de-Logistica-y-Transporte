import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteUser,
  listBranches,
  listRoles,
  listUsers
} from "../services/api.js";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [usersData, rolesData, branchesData] = await Promise.all([
        listUsers(),
        listRoles(),
        listBranches()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    navigate("/admin/usuarios/nuevo");
  };

  const handleEdit = (id) => {
    navigate(`/admin/usuarios/${id}/editar`);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("¿Eliminar este usuario?");
    if (!ok) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500">Gestión de cuentas y roles</p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          + Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Listado</h2>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{user.nombre}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                {user.telefono && (
                  <p className="text-sm text-slate-500">{user.telefono}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  {roles.find((r) => r.id === user.rolId)?.nombre || user.rolId}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                  {branches.find((b) => b.id === user.sucursalId)?.nombre ||
                    user.sucursalId}
                </span>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {user.activo ? "Activo" : "Inactivo"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(user.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-slate-500">Sin usuarios registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
