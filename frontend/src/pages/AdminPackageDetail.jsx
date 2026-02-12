import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Timeline from "../components/Timeline.jsx";
import { getPackageById, getUser, updatePackageStatus } from "../services/api.js";

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
    const message = encodeURIComponent(
      `Hola, consulta de envío ${pkg?.codigoSeguimiento}.`
    );
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

  const handleFailedAttempt = async () => {
    const observacion =
      window.prompt("Motivo del intento fallido (opcional):") || "";
    await handleStatusChange("Intento fallido", observacion);
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {pkg?.codigoSeguimiento}
          </h1>
          <p className="text-sm text-slate-500">
            Registrado el {formatDate(pkg?.creadoEn)}
          </p>
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
              <p className="text-sm font-semibold text-slate-700">Distribuidora</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {pkg.remitente?.nombre || "Sin remitente"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Operador asignado
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {pkg.operador?.nombre || "Sin asignar"}
              </p>
              <div className="mt-3 text-sm text-slate-500">
                <p>{pkg.operador?.telefono || "Teléfono no registrado"}</p>
                {pkg.operador?.email && <p>{pkg.operador.email}</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Repartidor asignado
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {pkg.repartidor?.nombre || "Sin asignar"}
              </p>
              <div className="mt-3 text-sm text-slate-500">
                <p>{pkg.repartidor?.telefono || "Teléfono no registrado"}</p>
                {pkg.repartidor?.email && <p>{pkg.repartidor.email}</p>}
              </div>
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
              <p className="mt-3 text-sm text-slate-500">Descripción</p>
              <p className="text-slate-800">
                {pkg.descripcion || "Sin descripción"}
              </p>
              <p className="mt-3 text-sm text-slate-500">Observaciones</p>
              <p className="text-slate-800">
                {pkg.historial?.[pkg.historial.length - 1]?.observacion ||
                  "Sin observaciones"}
              </p>
            </div>
          </div>

          <div className="space-y-6">
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
                  onClick={handleFailedAttempt}
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
    </div>
  );
};

export default AdminPackageDetail;
