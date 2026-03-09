import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Timeline from "../components/Timeline.jsx";
import {
  getPackageById,
  getUser,
  updatePackageStatus,
  reprogramarPackage,
  updatePackagePrecio,
  updatePackageOperador,
  updatePackageRepartidor,
  listOperators,
  listCouriers,
  registrarPagoDestino
} from "../services/api.js";

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return new Date(trimmed);
    }
    const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    return new Date(`${withT}Z`);
  }
  return new Date(value);
};

const formatDate = (value) => {
  const date = normalizeDate(value);
  if (!date || Number.isNaN(date.getTime())) return value || "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
    hour12: true
  }).format(date);
};

const statusTone = (status) => {
  if (status === "Entregado") return "bg-brand-50 text-brand-700";
  if (status === "En Tránsito") return "bg-accent-50 text-accent-500";
  return "bg-warning-50 text-warning-500";
};

const AdminPackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const roleName = user?.roleName;
  const canMarkSalida =
    roleName === "Administrador" || roleName === "Operador logístico";
  const canConfirmEntrega = canMarkSalida || roleName === "Repartidor";
  const canMarkFailed = canConfirmEntrega;
  const canCallOperator =
    roleName === "Administrador" || roleName === "Repartidor";
  const canCallCourier =
    roleName === "Administrador" || roleName === "Operador logístico";
  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [failedAttemptModalOpen, setFailedAttemptModalOpen] = useState(false);
  const [failedAttemptObservacion, setFailedAttemptObservacion] = useState("");
  const [reprogramarModalOpen, setReprogramarModalOpen] = useState(false);
  const [reprogramarForm, setReprogramarForm] = useState({
    direccion: "",
    fecha: "",
    horaInicio: "09:00"
  });
  const [precioForm, setPrecioForm] = useState("");
  const [precioLoading, setPrecioLoading] = useState(false);
  const [operators, setOperators] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const canSetPrecio =
    (roleName === "Administrador" || roleName === "Operador logístico") &&
    pkg?.pesoKg > 2 &&
    (!pkg?.precioEnvio || pkg.precioEnvio <= 0);

  const loadPackage = async () => {
    try {
      const data = await getPackageById(id);
      setPkg(data);
    } catch (err) {
      setError(err.message || "No se pudo cargar el paquete.");
    }
  };

  useEffect(() => {
    loadPackage();
  }, [id]);

  useEffect(() => {
    if (roleName === "Administrador" || roleName === "Operador logístico") {
      Promise.all([listOperators(), listCouriers()])
        .then(([ops, coups]) => {
          setOperators(ops);
          setCouriers(coups);
        })
        .catch(() => {});
    }
  }, [roleName]);

  useEffect(() => {
    if (pkg?.pesoKg > 2 && (!pkg?.precioEnvio || pkg.precioEnvio <= 0)) {
      setPrecioForm("");
    } else if (pkg?.precioEnvio) {
      setPrecioForm(String(pkg.precioEnvio));
    }
  }, [pkg?.pesoKg, pkg?.precioEnvio]);


  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleWhatsApp = () => {
    setNotice("");
    const phoneRaw =
      pkg?.destinatario?.telefono || pkg?.remitente?.telefono || "";
    const phone = phoneRaw.replace(/[^\d]/g, "");
    if (!phone) {
      setNotice("No hay teléfono registrado para WhatsApp.");
      return;
    }
    const nombre = pkg?.destinatario?.nombre || pkg?.remitente?.nombre || "cliente";
    const codigo = pkg?.codigoSeguimiento || "";
    const estado = pkg?.estadoActual || "En Almacén";
    let texto = "";
    if (estado === "En Almacén") {
      texto = `Hola ${nombre}, tu paquete con código ${codigo} se encuentra actualmente en nuestro almacén y pronto saldrá en camino. Puedes rastrear su estado en cualquier momento ingresando este código en nuestra página de seguimiento.`;
    } else if (estado === "En Tránsito") {
      texto = `Hola ${nombre}, tu paquete con código ${codigo} está en camino hacia ti. Puedes rastrear su estado en cualquier momento ingresando este código en nuestra página de seguimiento.`;
    } else if (estado === "Entregado") {
      texto = `Hola ${nombre}, tu paquete con código ${codigo} fue entregado correctamente. Gracias por confiar en nosotros.`;
    } else if (estado === "Intento fallido") {
      texto = `Hola ${nombre}, hubo un intento de entrega de tu paquete con código ${codigo}. Por favor contáctanos para reprogramar la entrega.`;
    } else {
      texto = `Hola ${nombre}, consulta sobre tu paquete con código ${codigo}. Puedes rastrear su estado ingresando este código en nuestra página de seguimiento.`;
    }
    const message = encodeURIComponent(texto);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleCall = (rawPhone) => {
    const phone = (rawPhone || "").replace(/[^\d+]/g, "");
    if (!phone) {
      setNotice("No hay teléfono registrado.");
      return;
    }
    window.open(`tel:${phone}`, "_self");
  };

  const operatorPhone = pkg?.operador?.telefono || "";
  const courierPhone = pkg?.repartidor?.telefono || "";
  const clientPhone = pkg?.destinatario?.telefono || "";

  const handleAction = async () => {
    if (!pkg) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      if (pkg.estadoActual === "En Almacén") {
        await updatePackageStatus(pkg.id, {
          estado: "En Tránsito",
          observacion: "Salida registrada"
        });
        setNotice("Salida registrada");
      } else if (pkg.estadoActual === "En Tránsito") {
        await updatePackageStatus(pkg.id, {
          estado: "Entregado",
          observacion: "Entrega registrada"
        });
        setNotice("Entrega registrada");
      }
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (estado, observacionDefault) => {
    if (!pkg) return;
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await updatePackageStatus(pkg.id, {
        estado,
        observacion: observacionDefault || ""
      });
      setNotice(
        estado === "Entregado" ? "Entrega registrada" : "Intento fallido"
      );
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setActionLoading(false);
    }
  };

  const openFailedAttemptModal = () => {
    setFailedAttemptObservacion("");
    setFailedAttemptModalOpen(true);
  };

  const closeFailedAttemptModal = () => {
    setFailedAttemptModalOpen(false);
    setFailedAttemptObservacion("");
  };

  const confirmFailedAttempt = async () => {
    await handleStatusChange(
      "Intento fallido",
      failedAttemptObservacion.trim() || ""
    );
    closeFailedAttemptModal();
  };

  const horaFinFromInicio = (horaInicio) => {
    const [h, m] = horaInicio.split(":").map(Number);
    const end = h + 3;
    return `${String(end).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const openReprogramarModal = () => {
    setReprogramarForm({
      direccion: pkg?.destinoTexto || "",
      fecha: "",
      horaInicio: "09:00"
    });
    setReprogramarModalOpen(true);
  };

  const closeReprogramarModal = () => {
    setReprogramarModalOpen(false);
  };

  const handleReprogramarChange = (e) => {
    const { name, value } = e.target;
    setReprogramarForm((prev) => ({ ...prev, [name]: value }));
  };

  const isOperadorDelPaquete =
    pkg?.operador?.id && String(pkg.operador.id) === String(user?.id);

  const handleAssignOperador = async (operadorId) => {
    setAssignLoading(true);
    setError("");
    setNotice("");
    try {
      await updatePackageOperador(pkg.id, operadorId || null);
      setNotice("Operador asignado.");
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo asignar.");
    } finally {
      setAssignLoading(false);
    }
  };

  const canRegistrarPago =
    (roleName === "Repartidor" ||
      roleName === "Operador logístico" ||
      roleName === "Administrador") &&
    !pkg?.pagado &&
    (pkg?.precioEnvio || 0) > 0 &&
    (roleName !== "Repartidor" ||
      String(pkg?.repartidor?.id) === String(user?.id));

  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [pagoMetodo, setPagoMetodo] = useState(null);
  const [pagoLoading, setPagoLoading] = useState(false);

  const METODOS_PAGO = [
    { id: "tarjeta", label: "Tarjeta de crédito/débito", icon: "💳" },
    { id: "yape", label: "Yape", icon: "📱" },
    { id: "efectivo", label: "Efectivo", icon: "💵" }
  ];

  const handleConfirmarPago = async () => {
    if (!pagoMetodo) return;
    setPagoLoading(true);
    setError("");
    setNotice("");
    try {
      await registrarPagoDestino(pkg.id, pagoMetodo);
      setNotice(`Pago registrado (${pagoMetodo}).`);
      setPagoModalOpen(false);
      setPagoMetodo(null);
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo registrar el pago.");
    } finally {
      setPagoLoading(false);
    }
  };

  const handleAssignRepartidor = async (repartidorId) => {
    setAssignLoading(true);
    setError("");
    setNotice("");
    try {
      await updatePackageRepartidor(pkg.id, repartidorId || null);
      setNotice("Repartidor asignado.");
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo asignar.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSetPrecio = async () => {
    const precio = parseFloat(precioForm);
    if (Number.isNaN(precio) || precio < 0) {
      setNotice("Ingresa un precio válido.");
      return;
    }
    setPrecioLoading(true);
    setError("");
    setNotice("");
    try {
      await updatePackagePrecio(pkg.id, precio);
      setNotice("Precio asignado correctamente.");
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo asignar el precio.");
    } finally {
      setPrecioLoading(false);
    }
  };

  const confirmReprogramar = async () => {
    const { direccion, fecha, horaInicio } = reprogramarForm;
    if (!fecha || !horaInicio) {
      setNotice("Ingresa la fecha y la hora.");
      return;
    }
    setActionLoading(true);
    setError("");
    setNotice("");
    try {
      await reprogramarPackage(pkg.id, {
        fecha,
        horaInicio,
        horaFin: horaFinFromInicio(horaInicio),
        direccion: direccion?.trim() || null
      });
      setNotice("Envío reprogramado correctamente.");
      closeReprogramarModal();
      await loadPackage();
    } catch (err) {
      setError(err.message || "No se pudo reprogramar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenMap = () => {
    const address =
      pkg?.destinoTexto ||
      pkg?.destinatario?.direccion ||
      pkg?.sucursalDestino?.direccion ||
      "";
    if (!address) {
      setNotice("No hay dirección registrada.");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
    window.open(url, "_blank");
  };

  if (!pkg && !error) {
    return <div className="text-slate-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">

      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">

          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7h11v10H3z" />
            <path d="M14 10h4l3 3v4h-7z" />
            <circle cx="7" cy="19" r="1.5" />
            <circle cx="18" cy="19" r="1.5" />
          </svg>

        </div>

        <div>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent tracking-wide">
            {pkg?.codigoSeguimiento}
          </h1>

          <p className="text-sm text-slate-500">
            Registrado el {formatDate(pkg?.creadoEn)}
          </p>

        </div>

  </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-4 py-1 text-sm font-semibold ${statusTone(
              pkg?.estadoActual
            )}`}
          >
            {pkg?.estadoActual}
          </span>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Notificar WhatsApp
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
          {notice}
        </div>
      )}

      {pkg && (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Remitente ({pkg.remitenteTipo || "Distribuidora"})
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {pkg.remitente?.nombre || "Sin remitente"}
              </p>
              {pkg.remitente?.documento && (
                <p className="mt-2 text-sm text-slate-500">
                  Documento: {pkg.remitente.documento}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Operador asignado
              </p>
              {roleName === "Administrador" ? (
                <div className="mt-2">
                  <select
                    value={pkg.operador?.id || ""}
                    onChange={(e) => handleAssignOperador(e.target.value || null)}
                    disabled={assignLoading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                  {pkg.operador && (
                    <p className="mt-2 text-xs text-slate-500">
                      {pkg.operador.telefono || ""} {pkg.operador.email || ""}
                    </p>
                  )}
                </div>
              ) : roleName === "Operador logístico" && !pkg.operador?.id ? (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleAssignOperador(user.id)}
                    disabled={assignLoading}
                    className="w-full rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    {assignLoading ? "Asignando..." : "Asignarme a este paquete"}
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {pkg.operador?.nombre || "Sin asignar"}
                  </p>
                  <div className="mt-3 text-sm text-slate-500">
                    <p>{pkg.operador?.telefono || "Teléfono no registrado"}</p>
                    {pkg.operador?.email && <p>{pkg.operador.email}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Repartidor asignado
              </p>
              {(roleName === "Administrador" || (roleName === "Operador logístico" && isOperadorDelPaquete)) ? (
                <div className="mt-2">
                  <select
                    value={pkg.repartidor?.id || ""}
                    onChange={(e) => handleAssignRepartidor(e.target.value || null)}
                    disabled={assignLoading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="">Sin asignar</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  {pkg.repartidor && (
                    <p className="mt-2 text-xs text-slate-500">
                      {pkg.repartidor.telefono || ""} {pkg.repartidor.email || ""}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {pkg.repartidor?.nombre || "Sin asignar"}
                  </p>
                  <div className="mt-3 text-sm text-slate-500">
                    <p>{pkg.repartidor?.telefono || "Teléfono no registrado"}</p>
                    {pkg.repartidor?.email && <p>{pkg.repartidor.email}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Cliente destino
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {pkg.destinatario?.nombre || "Sin destinatario"}
              </p>
              <div className="mt-3 text-sm text-slate-500">
                <p>{pkg.destinatario?.direccion || "Dirección no registrada"}</p>
                <p>{pkg.destinatario?.telefono || "Teléfono no registrado"}</p>
                {pkg.destinoTexto && (
                  <p>Destino: {pkg.destinoTexto}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleOpenMap}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Ver ubicación en mapa
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Detalles</p>
              {(pkg.pesoKg || 0) > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  Peso: {pkg.pesoKg} kg • Precio: {pkg.precioEnvio ?? 0} soles
                  {pkg.quienPaga && (
                    <span className="text-slate-500"> • Paga: {pkg.quienPaga === "remitente" ? "Remitente" : "Destinatario"}</span>
                  )}
                  {pkg.pagado && <span className="text-brand-600 font-semibold"> • Pagado</span>}
                </p>
              )}
              <p className="mt-3 text-sm text-slate-500">Descripción</p>
              <p className="text-slate-800">
                {pkg.descripcion || "Sin descripción"}
              </p>
              {pkg.reprogramacionFecha && (
                <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3">
                  <p className="text-xs font-semibold text-brand-700">Próxima entrega programada</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {new Date(pkg.reprogramacionFecha + "T12:00:00").toLocaleDateString("es-PE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}{" "}
                    • {pkg.reprogramacionHoraInicio} — {pkg.reprogramacionHoraFin}
                  </p>
                  {pkg.reprogramacionDireccion && (
                    <p className="mt-1 text-xs text-slate-600">{pkg.reprogramacionDireccion}</p>
                  )}
                </div>
              )}
              <p className="mt-3 text-sm text-slate-500">Observaciones</p>
              <p className="text-slate-800">
                {pkg.historial?.[pkg.historial.length - 1]?.observacion ||
                  "Sin observaciones"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {canSetPrecio && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                <p className="text-sm font-semibold text-slate-700">Asignar precio (paquete &gt; 2 kg)</p>
                <p className="mt-1 text-xs text-slate-500">
                  El operador debe asignar el precio antes de que el cliente pueda pagar.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioForm}
                    onChange={(e) => setPrecioForm(e.target.value)}
                    placeholder="Precio en soles"
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSetPrecio}
                    disabled={precioLoading}
                    className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {precioLoading ? "Guardando..." : "Asignar"}
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-center">
              <p className="text-sm font-semibold text-slate-700">Acciones</p>
              <div className="mt-4 flex flex-col gap-2">
                {canCallOperator && operatorPhone && (
                  <button
                    type="button"
                    onClick={() => handleCall(operatorPhone)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Llamar operador
                  </button>
                )}
                {canCallCourier && courierPhone && (
                  <button
                    type="button"
                    onClick={() => handleCall(courierPhone)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Llamar repartidor
                  </button>
                )}
                {clientPhone && (
                  <button
                    type="button"
                    onClick={() => handleCall(clientPhone)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Llamar cliente
                  </button>
                )}
              </div>
              {pkg.estadoActual === "En Almacén" && (
                canMarkSalida && (
                  <button
                    type="button"
                    onClick={handleAction}
                    disabled={actionLoading}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h11v10H3z" />
                      <path d="M14 10h4l3 3v4h-7z" />
                      <circle cx="7" cy="19" r="1.5" />
                      <circle cx="18" cy="19" r="1.5" />
                    </svg>
                    {actionLoading ? "Procesando..." : "Marcar Salida"}
                  </button>
                )
              )}
              {pkg?.pagado && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-semibold text-center">
                  Pagado{pkg?.metodoPago ? ` (${pkg.metodoPago})` : ""} — {pkg?.precioEnvio || 0} soles
                </div>
              )}
              {canRegistrarPago && (
                <button
                  type="button"
                  onClick={() => { setPagoMetodo(null); setPagoModalOpen(true); }}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  💰 Registrar pago ({pkg?.precioEnvio || 0} soles)
                </button>
              )}
              {pkg.estadoActual === "En Tránsito" && (
                canConfirmEntrega && (
                  <button
                    type="button"
                    onClick={handleAction}
                    disabled={actionLoading}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12l2.5 2.5L16 9" />
                    </svg>
                    {actionLoading ? "Procesando..." : "Confirmar Entrega"}
                  </button>
                )
              )}
              {pkg.estadoActual === "En Tránsito" && canMarkFailed && (
                <button
                  type="button"
                  onClick={openFailedAttemptModal}
                  disabled={actionLoading}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-6 py-3 text-sm font-semibold text-red-600"
                >
                  Registrar intento fallido
                </button>
              )}
              {pkg.estadoActual === "Entregado" && (
                <div className="mt-6 flex flex-col items-center gap-3 text-brand-700">
                  <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12l2.5 2.5L16 9" />
                  </svg>
                  <p className="font-semibold">Paquete Entregado</p>
                </div>
              )}
              {pkg.estadoActual === "Intento fallido" && canConfirmEntrega && (
                <button
                  type="button"
                  onClick={openReprogramarModal}
                  disabled={actionLoading}
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Reprogramar envío
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/admin/paquetes")}
                className="mt-6 w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
              >
                Volver a paquetes
              </button>
            </div>

            <Timeline items={pkg.historial || []} title="Línea de tiempo" />
          </div>
        </div>
      )}

      {reprogramarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5">
              <div className="flex items-center gap-3 text-white">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-xl font-bold">Reprogramar envío</h3>
                  <p className="text-sm text-white/90">Define la nueva fecha y horario de entrega</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Dirección (opcional)</span>
                <input
                  type="text"
                  name="direccion"
                  value={reprogramarForm.direccion}
                  onChange={handleReprogramarChange}
                  placeholder="Ej: Jr. Callao 456, Tingo María"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Fecha de entrega *</span>
                  <input
                    type="date"
                    name="fecha"
                    value={reprogramarForm.fecha}
                    onChange={handleReprogramarChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Disponible desde *</span>
                  <select
                    name="horaInicio"
                    value={reprogramarForm.horaInicio}
                    onChange={handleReprogramarChange}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 6).map((h) => {
                      const val = `${String(h).padStart(2, "0")}:00`;
                      return (
                        <option key={val} value={val}>
                          {val} - {horaFinFromInicio(val)}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">Ventana de entrega (3 horas)</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {reprogramarForm.horaInicio} — {horaFinFromInicio(reprogramarForm.horaInicio)}
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 pb-6 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={closeReprogramarModal}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmReprogramar}
                disabled={actionLoading}
                className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 disabled:opacity-60"
              >
                {actionLoading ? "Guardando..." : "Reprogramar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {failedAttemptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-slate-900">
                Registrar intento fallido
              </h3>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Indica el motivo del intento fallido (opcional). El cliente podrá ver esta información en el historial.
            </p>
            <textarea
              value={failedAttemptObservacion}
              onChange={(e) => setFailedAttemptObservacion(e.target.value)}
              placeholder="Ej: Cliente no se encontraba, dirección incorrecta..."
              rows={3}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeFailedAttemptModal}
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmFailedAttempt}
                disabled={actionLoading}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionLoading ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pagoModalOpen && canRegistrarPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Registrar pago</h3>
              <p className="mt-1 text-sm text-slate-500">
                Monto: <strong>{pkg?.precioEnvio || 0} soles</strong>
                {pkg?.quienPaga && (
                  <span> — Paga: {pkg.quienPaga === "remitente" ? "Remitente" : "Destinatario"}</span>
                )}
              </p>
            </div>
            <div className="p-6">
              {!pagoMetodo ? (
                <div className="space-y-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPagoMetodo(m.id)}
                      className="flex w-full items-center gap-4 rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span className="text-2xl">{m.icon}</span>
                      <span className="font-medium text-slate-800">{m.label}</span>
                    </button>
                  ))}
                </div>
              ) : pagoMetodo === "tarjeta" ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Simulación de pago con tarjeta</p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                    <span className="text-3xl">💳</span>
                    <p className="mt-2 text-sm text-slate-700">
                      Se registrará el pago de <strong>{pkg?.precioEnvio || 0} soles</strong> con tarjeta.
                    </p>
                  </div>
                </div>
              ) : pagoMetodo === "yape" ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8">
                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
                      📱
                    </div>
                    <p className="mt-4 text-center text-sm font-medium text-slate-700">
                      Abre Yape y escanea el código
                    </p>
                    <p className="mt-1 text-center text-xs text-slate-500">
                      Monto: {pkg?.precioEnvio || 0} soles
                    </p>
                  </div>
                  <p className="text-center text-xs text-slate-500">
                    Simulación: haz clic en confirmar para registrar el pago
                  </p>
                </div>
              ) : pagoMetodo === "efectivo" ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-700">
                      Se registrará el pago en efectivo por{" "}
                      <strong>{pkg?.precioEnvio || 0} soles</strong>.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  if (pagoMetodo) setPagoMetodo(null);
                  else setPagoModalOpen(false);
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
              >
                {pagoMetodo ? "Volver" : "Cancelar"}
              </button>
              {pagoMetodo && (
                <button
                  type="button"
                  onClick={handleConfirmarPago}
                  disabled={pagoLoading}
                  className="flex-1 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {pagoLoading ? "Procesando..." : "Confirmar pago"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackageDetail;
