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
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    try {
      await deleteUser(deleteModal.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar el usuario.");
      setDeleteModal(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
            👥
          </div>

          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
              Usuarios
            </h1>

            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-400 mt-1"></div>

            <p className="text-slate-500 text-sm mt-2">
              Gestión de cuentas y roles del sistema
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={handleNew}
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:scale-105"
        >
          + Nuevo usuario
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* LISTADO */}
      <div className="rounded-3xl bg-white p-8 shadow-lg border border-slate-100">

        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          📋 Listado de usuarios
        </h2>

        <div className="mt-6 space-y-4">

          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 px-6 py-5 shadow-sm transition hover:shadow-md hover:border-green-200 sm:flex-row sm:items-center sm:justify-between"
            >

              {/* INFO */}
              <div>

                <p className="font-semibold text-slate-900 text-lg">
                  {user.nombre}
                </p>

                <p className="text-sm text-slate-500">
                  {user.email}
                </p>

                {user.telefono && (
                  <p className="text-sm text-slate-500">
                    📞 {user.telefono}
                  </p>
                )}

              </div>

              {/* BADGES */}
              <div className="flex flex-wrap items-center gap-3 text-sm">

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {roles.find((r) => r.id === user.rolId)?.nombre || user.rolId}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {branches.find((b) => b.id === user.sucursalId)?.nombre ||
                    user.sucursalId}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    user.activo
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {user.activo ? "Activo" : "Inactivo"}
                </span>

                {/* BOTONES */}
                <div className="flex items-center gap-2 ml-2">

                  <button
                    type="button"
                    onClick={() => handleEdit(user.id)}
                    className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    ✏ Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModal(user)}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    🗑 Eliminar
                  </button>

                </div>

              </div>

            </div>
          ))}

          {users.length === 0 && (
            <p className="text-sm text-slate-500">
              Sin usuarios registrados.
            </p>
          )}

        </div>
      </div>

      {/* MODAL ELIMINAR */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">

            <div className="flex flex-col items-center text-center">

              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 text-2xl">
                ⚠
              </span>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Eliminar usuario
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                ¿Seguro que deseas eliminar a{" "}
                <strong className="text-slate-700">
                  {deleteModal.nombre}
                </strong>?
                <br />
                Esta acción no se puede deshacer.
              </p>

            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Eliminando..." : "Sí, eliminar"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AdminUsers;