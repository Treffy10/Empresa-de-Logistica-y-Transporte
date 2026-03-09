import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listClients } from "../services/api.js";

const emptyForm = {
  tipo: "persona",
  nombre: "",
  documento: "",
  telefono: "",
  email: "",
  direccion: ""
};

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await listClients();
      setClients(data);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los clientes.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => {
    navigate("/admin/clientes/nuevo");
  };

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
              👤
            </span>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
                Clientes
              </h1>

              <div className="mt-1 h-1 w-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-400"></div>
            </div>

          </div>

          <p className="mt-3 text-slate-500">
            Gestión de clientes registrados
          </p>

        </div>

        <button
          onClick={handleNew}
          className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-green-700 hover:scale-105"
        >
          ➕ Nuevo Cliente
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* GRID CLIENTES */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {clients.map((client) => (
          <div
            key={client.id}
            className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 transition group-hover:bg-green-600 group-hover:text-white">

                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2a7 7 0 0 0-4 12.7V22l4-3 4 3v-7.3A7 7 0 0 0 12 2z" />
                </svg>

              </div>

              <div className="flex-1">

                <p className="font-semibold text-slate-900 text-lg">
                  {client.nombre}
                </p>

                <p className="text-sm text-slate-500">
                  {client.direccion}
                </p>

                <div className="mt-4 flex items-center gap-2 text-sm text-green-700 font-medium">
                  📞 {client.telefono}
                </div>

              </div>

            </div>

          </div>
        ))}

        {clients.length === 0 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-100 text-center text-slate-500">

            <div className="text-3xl mb-3">👤</div>

            <p>No hay clientes registrados.</p>

          </div>
        )}

      </div>

    </div>
  );
};

export default AdminClients;