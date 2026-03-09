import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBranches } from "../services/api.js";

const AdminBranches = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await listBranches();
      setBranches(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar las sucursales.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
            🏢
          </div>

          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
              Sucursales
            </h1>

            <div className="h-1 w-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-400 mt-1"></div>

            <p className="text-slate-500 text-sm mt-2">
              Gestión de sucursales de la empresa
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/sucursales/nuevo")}
          className="rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:scale-105"
        >
          + Nueva sucursal
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* GRID */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {branches.map((branch) => (

          <div
            key={branch.id}
            className="rounded-3xl bg-white p-6 shadow-md border border-slate-100 transition hover:shadow-lg hover:border-green-200 hover:-translate-y-1"
          >

            <div className="flex items-start gap-4">

              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3h18v18H3z" />
                  <path d="M7 7h3v3H7z" />
                  <path d="M14 7h3v3h-3z" />
                  <path d="M7 14h3v3H7z" />
                  <path d="M14 14h3v3h-3z" />
                </svg>
              </span>

              <div>

                <p className="font-semibold text-lg text-slate-900">
                  {branch.nombre}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  📍 {branch.direccion}
                </p>

              </div>

            </div>

          </div>

        ))}

        {branches.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 text-slate-500">
            Sin sucursales registradas.
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminBranches;