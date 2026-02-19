import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import * as memory from "./storage.js";
import * as db from "./storageDb.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 4000;
const useDb = process.env.USE_DB === "true";
if (useDb && !process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está configurado en backend/.env");
  process.exit(1);
}
const repo = useDb ? db : memory;
const call = (fn, ...args) => Promise.resolve(fn(...args));
const adminUser = process.env.ADMIN_USER || "admin";
const adminPass = process.env.ADMIN_PASS || "admin123";
const seedAdminName = process.env.ADMIN_SEED_NAME || "Walter";
const seedAdminEmail =
  process.env.ADMIN_SEED_EMAIL || "wruizmarin21@gmail.com";
const seedAdminPass = process.env.ADMIN_SEED_PASS || "wally21";
const dniApiUrl =
  process.env.DNI_API_URL || "https://api.decolecta.com/v1/reniec/dni";
const dniApiToken = process.env.DNI_API_TOKEN || "";
const authTokens = new Map();

app.use(cors());
app.use(express.json());

const sanitizeUser = (user, roleName) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  rolId: user.rol_id || user.rolId || null,
  roleName: roleName || null,
  sucursalId: user.sucursal_id || user.sucursalId || null,
  activo: user.activo
});

const requireAdmin = (req, res, next) => {
  const roleName = req.authUser?.roleName;
  if (roleName !== "Administrador") {
    return res.status(403).json({ error: "Solo administrador" });
  }
  return next();
};

const isPublicRoute = (req) => {
  if (!req.path.startsWith("/api")) return true;
  if (req.path === "/api/health") return true;
  if (req.path === "/api/auth/login") return true;
  return req.path.startsWith("/api/tracking/");
};

app.use((req, res, next) => {
  if (isPublicRoute(req)) return next();
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token || !authTokens.has(token)) {
    return res.status(401).json({ error: "No autorizado" });
  }
  req.authUser = authTokens.get(token);
  return next();
});

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
    hour12: true
  }).format(date);
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

const PHONE_RULES = {
  PE: { name: "Peru", dialCode: "51", digits: 9 },
  CL: { name: "Chile", dialCode: "56", digits: 9 },
  CO: { name: "Colombia", dialCode: "57", digits: 10 },
  EC: { name: "Ecuador", dialCode: "593", digits: 9 },
  MX: { name: "Mexico", dialCode: "52", digits: 10 },
  US: { name: "Estados Unidos", dialCode: "1", digits: 10 }
};

const textValue = (value) => String(value || "").trim();

const resolvePhone = (payload) => {
  const countryIso = textValue(payload.telefonoPais).toUpperCase();
  const source = textValue(payload.telefonoNumero || payload.telefono);
  if (!countryIso || !source) {
    return { ok: false, error: "telefonoPais y telefonoNumero son requeridos" };
  }
  const rule = PHONE_RULES[countryIso];
  if (!rule) {
    return { ok: false, error: "Pais de telefono no soportado" };
  }
  const digitsOnly = source.replace(/\D/g, "");
  const local =
    digitsOnly.startsWith(rule.dialCode) &&
    digitsOnly.length === rule.dialCode.length + rule.digits
      ? digitsOnly.slice(rule.dialCode.length)
      : digitsOnly;
  if (local.length !== rule.digits) {
    return {
      ok: false,
      error: `El telefono para ${rule.name} debe tener ${rule.digits} digitos`
    };
  }
  return {
    ok: true,
    countryIso,
    local,
    e164: `+${rule.dialCode}${local}`
  };
};

const normalizeDniData = (rawData, dni) => {
  const data = rawData || {};
  const nombres = textValue(data.nombres || data.name || data.first_name);
  const apellidoPaterno = textValue(
    data.apellidoPaterno ||
      data.apellido_paterno ||
      data.father_last_name ||
      data.first_last_name
  );
  const apellidoMaterno = textValue(
    data.apellidoMaterno ||
      data.apellido_materno ||
      data.mother_last_name ||
      data.second_last_name
  );
  const nombreCompleto = textValue(
    data.nombreCompleto ||
      data.nombre_completo ||
      data.full_name ||
      [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ")
  );
  return {
    dni,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto
  };
};

const ensureRoles = async () => {
  if (!repo.listRoles || !repo.createRole) return;
  const required = ["Administrador", "Operador logístico", "Repartidor"];
  const roles = await call(repo.listRoles);
  const existing = new Set(roles.map((role) => role.nombre));
  for (const name of required) {
    if (!existing.has(name)) {
      await call(repo.createRole, name);
    }
  }
};

const ensureAdminUser = async () => {
  try {
    if (!repo.getUserByEmail || !repo.createUser || !repo.listRoles) return;
    await ensureRoles();
    const existing = await call(repo.getUserByEmail, seedAdminEmail);
    if (existing) return;
    let roles = await call(repo.listRoles);
    let adminRole =
      roles.find((role) => role.nombre === "Administrador") || roles[0];
    if (!adminRole && repo.createRole) {
      try {
        await call(repo.createRole, "Administrador");
        roles = await call(repo.listRoles);
        adminRole =
          roles.find((role) => role.nombre === "Administrador") || roles[0];
      } catch (err) {
        console.error("No se pudo crear el rol Administrador:", err.message);
      }
    }
    const passwordHash = await bcrypt.hash(seedAdminPass, 10);
    await call(repo.createUser, {
      nombre: seedAdminName,
      email: seedAdminEmail,
      rolId: adminRole?.id,
      sucursalId: null,
      activo: true,
      passwordHash
    });
  } catch (err) {
    console.error("No se pudo crear el admin inicial:", err.message);
  }
};

app.get("/api/health", async (req, res) => {
  res.json(await call(repo.getHealth));
});

app.post("/api/auth/login", (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }
  if (usuario === adminUser && password === adminPass) {
    const token = crypto.randomUUID();
    authTokens.set(token, {
      id: "admin-env",
      nombre: "Administrador Sistema",
      email: adminUser,
      rolId: null,
      roleName: "Administrador",
      sucursalId: null,
      activo: true
    });
    return res.json({
      token,
      user: {
        id: "admin-env",
        nombre: "Administrador Sistema",
        email: adminUser,
        rolId: null,
        roleName: "Administrador",
        sucursalId: null,
        activo: true
      }
    });
  }
  return call(repo.getUserByEmail, usuario)
    .then(async (user) => {
      if (!user || user.activo === false) {
        throw new Error("Credenciales inválidas");
      }
      const ok = await bcrypt.compare(
        password,
        user.password_hash || user.passwordHash || ""
      );
      if (!ok) {
        throw new Error("Credenciales inválidas");
      }
      const roleId = user.rol_id || user.rolId;
      const role = roleId ? await call(repo.getRoleById, roleId) : null;
      const roleName = role?.nombre || null;
      const token = crypto.randomUUID();
      authTokens.set(token, sanitizeUser(user, roleName));
      return res.json({ token, user: sanitizeUser(user, roleName) });
    })
    .catch(() => res.status(401).json({ error: "Credenciales inválidas" }));
});

app.get("/api/clients", async (req, res) => {
  res.json(await call(repo.listClients));
});

app.post("/api/clients", async (req, res) => {
  const { tipo, nombre, documento, email, direccion } = req.body || {};
  if (
    !textValue(tipo) ||
    !textValue(nombre) ||
    !textValue(documento) ||
    !textValue(email) ||
    !textValue(direccion)
  ) {
    return res.status(400).json({
      error:
        "tipo, nombre, documento, telefonoPais, telefonoNumero, email y direccion son requeridos"
    });
  }
  const phone = resolvePhone(req.body || {});
  if (!phone.ok) return res.status(400).json({ error: phone.error });
  const client = await call(repo.createClient, {
    tipo: textValue(tipo),
    nombre: textValue(nombre),
    documento: textValue(documento),
    telefono: phone.e164,
    email: textValue(email),
    direccion: textValue(direccion)
  });
  res.status(201).json(client);
});

app.get("/api/packages", async (req, res) => {
  const { status } = req.query;
  res.json(await call(repo.listPackages, status));
});

app.get("/api/packages/expanded", async (req, res) => {
  const { status } = req.query;
  if (req.authUser?.roleName === "Repartidor" && repo.listPackagesByCourier) {
    return res.json(await call(repo.listPackagesByCourier, req.authUser.id));
  }
  res.json(await call(repo.listPackagesDetailed, status));
});

app.get("/api/packages/:id", async (req, res) => {
  const pkg = await call(repo.getPackageDetailsById, req.params.id);
  if (!pkg) {
    return res.status(404).json({ error: "Paquete no encontrado" });
  }
  if (
    req.authUser?.roleName === "Repartidor" &&
    pkg.repartidor?.id !== req.authUser.id
  ) {
    return res.status(403).json({ error: "No autorizado" });
  }
  res.json(pkg);
});

app.post("/api/packages", async (req, res) => {
  if (req.authUser?.roleName === "Repartidor") {
    return res.status(403).json({ error: "No autorizado" });
  }
  const {
    tipoEnvio,
    remitenteId,
    remitenteClienteId,
    destinatarioId,
    sucursalOrigenId,
    destinoTexto,
    descripcion,
    operadorId,
    repartidorId
  } = req.body;
  const shippingType = textValue(tipoEnvio || "distribuidora_cliente");
  if (!["distribuidora_cliente", "cliente_cliente"].includes(shippingType)) {
    return res.status(400).json({ error: "tipoEnvio invalido" });
  }
  let operadorFinal = operadorId || null;
  if (!operadorFinal && req.authUser?.roleName === "Operador logístico") {
    operadorFinal = req.authUser.id;
  }
  if (
    !destinatarioId ||
    !sucursalOrigenId ||
    !textValue(destinoTexto) ||
    !textValue(descripcion) ||
    !operadorFinal ||
    !repartidorId
  ) {
    return res.status(400).json({
      error:
        "destinatarioId, sucursalOrigenId, destinoTexto, descripcion, operadorId y repartidorId son requeridos"
    });
  }
  if (shippingType === "distribuidora_cliente" && !remitenteId) {
    return res.status(400).json({ error: "remitenteId es requerido" });
  }
  if (shippingType === "cliente_cliente" && !remitenteClienteId) {
    return res.status(400).json({ error: "remitenteClienteId es requerido" });
  }
  const remitente =
    shippingType === "cliente_cliente"
      ? await call(repo.getClientById, remitenteClienteId)
      : await call(repo.getDistributorById, remitenteId);
  const destinatario = await call(repo.getClientById, destinatarioId);
  if (!remitente || !destinatario) {
    return res.status(400).json({ error: "Remitente o cliente invalido" });
  }
  if (
    shippingType === "cliente_cliente" &&
    String(remitenteClienteId) === String(destinatarioId)
  ) {
    return res.status(400).json({
      error: "Remitente y destinatario no pueden ser el mismo cliente"
    });
  }
  const origen = await call(repo.getBranchById, sucursalOrigenId);
  if (!origen) {
    return res.status(400).json({ error: "Sucursal inválida" });
  }
  if (operadorFinal) {
    const operador = await call(repo.getUserById, operadorFinal);
    if (!operador) {
      return res.status(400).json({ error: "Operador inválido" });
    }
    const role = await call(repo.getRoleById, operador.rol_id || operador.rolId);
    if (role?.nombre !== "Operador logístico") {
      return res.status(400).json({ error: "Operador inválido" });
    }
  }
  if (repartidorId) {
    const repartidor = await call(repo.getUserById, repartidorId);
    if (!repartidor) {
      return res.status(400).json({ error: "Repartidor inválido" });
    }
    const role = await call(
      repo.getRoleById,
      repartidor.rol_id || repartidor.rolId
    );
    if (role?.nombre !== "Repartidor") {
      return res.status(400).json({ error: "Repartidor inválido" });
    }
  }
  const pkg = await call(repo.createPackage, {
    ...req.body,
    tipoEnvio: shippingType,
    remitenteId: shippingType === "distribuidora_cliente" ? remitenteId : null,
    remitenteClienteId:
      shippingType === "cliente_cliente" ? remitenteClienteId : null,
    operadorId: operadorFinal,
    destinoTexto: textValue(destinoTexto),
    descripcion: textValue(descripcion)
  });
  res.status(201).json(pkg);
});

app.patch("/api/packages/:id/status", async (req, res) => {
  const { id } = req.params;
  const { estado, observacion } = req.body;
  const statuses = await call(repo.listStatuses);
  if (!estado || !statuses.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  const existing = await call(repo.getPackageById, id);
  if (!existing) {
    return res.status(404).json({ error: "Paquete no encontrado" });
  }
  if (req.authUser?.roleName === "Repartidor") {
    const repartidorId = existing.repartidor_id || existing.repartidorId;
    if (repartidorId !== req.authUser.id) {
      return res.status(403).json({ error: "No autorizado" });
    }
    if (estado !== "Entregado" && estado !== "Intento fallido") {
      return res.status(403).json({ error: "Acción no permitida" });
    }
  }
  const pkg = await call(repo.updatePackageStatus, id, estado, observacion);
  res.json(pkg);
});

app.get("/api/tracking/:code", async (req, res) => {
  const tracking = await call(repo.getTrackingByCode, req.params.code);
  if (!tracking) {
    return res.status(404).json({ error: "Código no encontrado" });
  }
  res.json(tracking);
});

app.get("/api/dni/:dni", async (req, res) => {
  const dni = textValue(req.params.dni).replace(/\D/g, "");
  if (!/^\d{8}$/.test(dni)) {
    return res.status(400).json({ error: "DNI invalido. Debe tener 8 digitos" });
  }
  if (!dniApiToken) {
    return res.status(503).json({
      error:
        "Consulta DNI no configurada. Define DNI_API_TOKEN en backend/.env"
    });
  }
  try {
    const response = await fetch(
      `${dniApiUrl}?numero=${encodeURIComponent(dni)}`,
      {
        headers: {
          Authorization: `Bearer ${dniApiToken}`,
          Accept: "application/json"
        }
      }
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(502).json({
        error: data?.message || data?.error || "No se pudo consultar el DNI"
      });
    }
    const normalized = normalizeDniData(data, dni);
    if (!normalized.nombreCompleto) {
      return res
        .status(404)
        .json({ error: "No se encontraron datos para el DNI consultado" });
    }
    return res.json(normalized);
  } catch (err) {
    return res
      .status(500)
      .json({ error: err.message || "Error consultando API de DNI" });
  }
});

app.get("/api/operators/phone", async (req, res) => {
  if (!repo.getOperatorPhone) {
    return res.json({ telefono: "" });
  }
  const telefono = await call(repo.getOperatorPhone);
  res.json({ telefono: telefono || "" });
});

app.get("/api/operators", async (req, res) => {
  if (!repo.listOperators) {
    return res.json([]);
  }
  res.json(await call(repo.listOperators));
});

app.get("/api/couriers", async (req, res) => {
  if (!repo.listCouriers) {
    return res.json([]);
  }
  res.json(await call(repo.listCouriers));
});

app.get("/api/couriers/me/packages", async (req, res) => {
  if (req.authUser?.roleName !== "Repartidor") {
    return res.status(403).json({ error: "No autorizado" });
  }
  if (!repo.listPackagesByCourier) {
    return res.json([]);
  }
  res.json(await call(repo.listPackagesByCourier, req.authUser.id));
});

app.get("/api/users", requireAdmin, async (req, res) => {
  res.json(await call(repo.listUsers));
});

app.get("/api/users/:id", requireAdmin, async (req, res) => {
  const user = await call(repo.getUserById, req.params.id);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    telefono: user.telefono || "",
    rolId: user.rol_id || user.rolId || null,
    sucursalId: user.sucursal_id || user.sucursalId || null,
    activo: user.activo
  });
});

app.post("/api/users", requireAdmin, async (req, res) => {
  const { nombre, email, rolId, sucursalId, password } = req.body || {};
  if (
    !textValue(nombre) ||
    !textValue(email) ||
    !textValue(password) ||
    !rolId ||
    !sucursalId
  ) {
    return res
      .status(400)
      .json({
        error:
          "nombre, email, telefonoPais, telefonoNumero, contraseña, rolId y sucursalId son requeridos"
      });
  }
  if (rolId && !(await call(repo.getRoleById, rolId))) {
    return res.status(400).json({ error: "Rol inválido" });
  }
  if (sucursalId && !(await call(repo.getBranchById, sucursalId))) {
    return res.status(400).json({ error: "Sucursal inválida" });
  }
  const phone = resolvePhone(req.body || {});
  if (!phone.ok) return res.status(400).json({ error: phone.error });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await call(repo.createUser, {
    ...req.body,
    nombre: textValue(nombre),
    email: textValue(email),
    telefono: phone.e164,
    passwordHash
  });
  res.status(201).json(user);
});

app.put("/api/users/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rolId, sucursalId, activo, password } =
    req.body;
  const existing = await call(repo.getUserById, id);
  if (!existing) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  if (rolId && !(await call(repo.getRoleById, rolId))) {
    return res.status(400).json({ error: "Rol inválido" });
  }
  if (sucursalId && !(await call(repo.getBranchById, sucursalId))) {
    return res.status(400).json({ error: "Sucursal inválida" });
  }
  if (!textValue(nombre) || !textValue(email) || !rolId || !sucursalId) {
    return res.status(400).json({
      error:
        "nombre, email, telefonoPais, telefonoNumero, rolId y sucursalId son requeridos"
    });
  }
  const phone = resolvePhone(req.body || {});
  if (!phone.ok) return res.status(400).json({ error: phone.error });
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const updated = await call(repo.updateUser, id, {
    nombre: textValue(nombre),
    email: textValue(email),
    telefono: phone.e164,
    rolId,
    sucursalId,
    activo,
    passwordHash
  });
  if (!updated) {
    return res.status(400).json({ error: "No se pudo actualizar" });
  }
  res.json(updated);
});

app.delete("/api/users/:id", requireAdmin, async (req, res) => {
  const removed = await call(repo.deleteUser, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({ ok: true });
});

app.get("/api/roles", async (req, res) => {
  res.json(await call(repo.listRoles));
});

app.get("/api/branches", async (req, res) => {
  res.json(await call(repo.listBranches));
});

app.post("/api/branches", async (req, res) => {
  const { nombre, direccion } = req.body;
  if (!textValue(nombre) || !textValue(direccion)) {
    return res.status(400).json({ error: "nombre y direccion son requeridos" });
  }
  const branch = await call(repo.createBranch, {
    nombre: textValue(nombre),
    direccion: textValue(direccion)
  });
  res.status(201).json(branch);
});

app.get("/api/statuses", async (req, res) => {
  res.json(await call(repo.listStatuses));
});

app.get("/api/distributors", async (req, res) => {
  res.json(await call(repo.listDistributors));
});

app.post("/api/distributors", async (req, res) => {
  const { nombre, razonSocial, direccion } = req.body || {};
  if (!textValue(nombre) || !textValue(razonSocial) || !textValue(direccion)) {
    return res.status(400).json({
      error:
        "nombre, razonSocial, telefonoPais, telefonoNumero y direccion son requeridos"
    });
  }
  const phone = resolvePhone(req.body || {});
  if (!phone.ok) return res.status(400).json({ error: phone.error });
  const distributor = await call(repo.createDistributor, {
    nombre: textValue(nombre),
    razonSocial: textValue(razonSocial),
    telefono: phone.e164,
    direccion: textValue(direccion)
  });
  res.status(201).json(distributor);
});

app.get("/api/reports/packages", async (req, res) => {
  const format = String(req.query.format || "csv").toLowerCase();
  if (!["csv", "xlsx"].includes(format)) {
    return res.status(400).json({ error: "Formato no soportado" });
  }
  const packages = await call(repo.listPackagesDetailed);
  const packagesWithHistory = await Promise.all(
    packages.map(async (pkg) => {
      if (repo.getPackageDetailsById) {
        const full = await call(repo.getPackageDetailsById, pkg.id);
        return full || pkg;
      }
      return pkg;
    })
  );
  const headers = [
    "ID",
    "Codigo",
    "Tipo Envio",
    "Tipo Remitente",
    "Estado",
    "Descripcion",
    "Destino",
    "Distribuidora",
    "Razon Social Distribuidora",
    "Telefono Distribuidora",
    "Direccion Distribuidora",
    "Cliente",
    "Documento Cliente",
    "Telefono Cliente",
    "Email Cliente",
    "Direccion Cliente",
    "Sucursal Origen",
    "Direccion Sucursal Origen",
    "Sucursal Destino",
    "Direccion Sucursal Destino",
    "Creado En",
    "Ultima Actualizacion",
    "Ultima Observacion",
    "Historial Estados"
  ];
  const rows = packagesWithHistory.map((pkg) => {
    const history = Array.isArray(pkg.historial) ? pkg.historial : [];
    const lastEntry = history.length ? history[history.length - 1] : null;
    const historyText = history
      .map(
        (item) =>
          `${item.estado} (${formatDate(item.fechaHora) || "sin fecha"})${
            item.observacion ? ` - ${item.observacion}` : ""
          }`
      )
      .join(" | ");
    return [
      pkg.id,
      pkg.codigoSeguimiento,
      pkg.tipoEnvio || "",
      pkg.remitenteTipo || "",
      pkg.estadoActual,
      pkg.descripcion,
      pkg.destinoTexto,
      pkg.remitente?.nombre || "",
      pkg.remitente?.razonSocial || "",
      pkg.remitente?.telefono || "",
      pkg.remitente?.direccion || "",
      pkg.destinatario?.nombre || "",
      pkg.destinatario?.documento || "",
      pkg.destinatario?.telefono || "",
      pkg.destinatario?.email || "",
      pkg.destinatario?.direccion || "",
      pkg.sucursalOrigen?.nombre || "",
      pkg.sucursalOrigen?.direccion || "",
      pkg.sucursalDestino?.nombre || "",
      pkg.sucursalDestino?.direccion || "",
      formatDate(pkg.creadoEn),
      formatDate(lastEntry?.fechaHora),
      lastEntry?.observacion || "",
      historyText
    ];
  });
  if (format === "xlsx") {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Paquetes");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="reporte-paquetes.xlsx"'
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.send(buffer);
    return;
  }

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="reporte-paquetes.csv"'
  );
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.send(`\uFEFF${csv}`);
});

const startServer = () => {
  app.listen(port, () => {
    console.log(`API logística en http://localhost:${port}`);
    ensureAdminUser();
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, startServer };
