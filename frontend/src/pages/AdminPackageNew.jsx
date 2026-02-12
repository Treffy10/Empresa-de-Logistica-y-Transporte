import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPackage,
  getUser,
  listBranches,
  listClients,
  listDistributors,
  listOperators,
  listCouriers
} from "../services/api.js";

const emptyForm = {
  remitenteId: "",
  destinatarioId: "",
  operadorId: "",
  repartidorId: "",
  sucursalOrigenId: "",
  destinoTexto: "",
  descripcion: ""
};

const AdminPackageNew = () => {
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.roleName === "Administrador";
  const [clients, setClients] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [
          clientsData,
          branchesData,
          distributorsData,
          operatorsData,
          couriersData
        ] = await Promise.all([
          listClients(),
          listBranches(),
          listDistributors(),
          listOperators(),
          listCouriers()
        ]);
        setClients(clientsData);
        setBranches(branchesData);
        setDistributors(distributorsData);
        setOperators(operatorsData);
        setCouriers(couriersData);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los datos.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.roleName === "Operador logístico" && user.id) {
      setForm((prev) => ({
        ...prev,
        operadorId: user.id
      }));
    }
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/admin/paquetes");
  };

  const handleCreateBranch = () => {
    navigate("/admin/sucursales/nuevo");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (
      !form.remitenteId ||
      !form.destinatarioId ||
      !form.sucursalOrigenId ||
      !form.destinoTexto
    ) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        operadorId:
          form.operadorId ||
          (user?.roleName === "Operador logístico" ? user.id : "")
      };
      const created = await createPackage(payload);
      navigate(`/admin/paquetes/${created.id}`);
    } catch (err) {
      setError(err.message || "No se pudo registrar el paquete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Registro de nuevo ingreso
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa los datos del paquete recibido
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h10v16H4z" />
                  <path d="M8 4v16" />
                  <path d="M18 8h2l2 2v8h-4z" />
                </svg>
              </span>
              Datos de origen (distribuidora)
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Distribuidora *
              <select
                name="remitenteId"
                value={form.remitenteId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Seleccionar distribuidora</option>
                {distributors.map((distributor) => (
                  <option key={distributor.id} value={distributor.id}>
                    {distributor.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-slate-600">
              Operador asignado
              <select
                name="operadorId"
                value={form.operadorId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                disabled={user?.roleName === "Operador logístico"}
              >
                <option value="">Sin asignar</option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm text-slate-600">
              Repartidor asignado
              <select
                name="repartidorId"
                value={form.repartidorId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Sin asignar</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a7 7 0 0 0-4 12.7V22l4-3 4 3v-7.3A7 7 0 0 0 12 2z" />
                </svg>
              </span>
              Datos del cliente
            </div>
            <label className="mt-4 block text-sm text-slate-600">
              Cliente de destino *
              <select
                name="destinatarioId"
                value={form.destinatarioId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 7v10l9 4 9-4V7" />
              </svg>
            </span>
            Detalles del paquete
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              Sucursal origen *
              <select
                name="sucursalOrigenId"
                value={form.sucursalOrigenId}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                <option value="">Seleccionar sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.nombre}
                  </option>
                ))}
              </select>
              {branches.length === 0 && isAdmin && (
                <button
                  type="button"
                  onClick={handleCreateBranch}
                  className="mt-3 text-xs font-semibold text-brand-700"
                >
                  + Crear sucursal
                </button>
              )}
            </label>
            <label className="text-sm text-slate-600">
              Destino / ubicación de entrega *
              <input
                name="destinoTexto"
                value={form.destinoTexto}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Ej: Jr. Callao 456, Tingo María"
              />
            </label>
            <label className="text-sm text-slate-600 md:col-span-2">
              Descripción del contenido
              <input
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Ej: Medicamentos varios, Antibióticos..."
              />
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-between">
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
            {loading ? "Guardando..." : "Registrar paquete"}
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

export default AdminPackageNew;
