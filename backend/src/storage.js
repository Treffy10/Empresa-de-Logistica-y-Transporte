import { v4 as uuid } from "uuid";

const now = () => new Date().toISOString();

const roles = [
  { id: "r1", nombre: "Administrador" },
  { id: "r2", nombre: "Operador logístico" },
  { id: "r3", nombre: "Repartidor" }
];

const statuses = ["En Almacén", "En Tránsito", "Entregado", "Intento fallido"];

const branches = [
  { id: "b1", nombre: "Tingo María - Centro", direccion: "Av. Principal 123" },
  { id: "b2", nombre: "Tingo María - Norte", direccion: "Jr. Logística 456" }
];

const clients = [
  {
    id: "c1",
    tipo: "persona",
    nombre: "Carlos Rojas",
    documento: "DNI 12345678",
    telefono: "987654321",
    email: "carlos@correo.com",
    direccion: "Jr. Perú 123"
  },
  {
    id: "c2",
    tipo: "empresa",
    nombre: "Botica San José",
    documento: "RUC 20123456789",
    telefono: "065-123456",
    email: "contacto@boticasanjose.pe",
    direccion: "Av. Amazonas 456"
  }
];

const distributors = [
  {
    id: "d1",
    nombre: "DIMEXA",
    razonSocial: "Distribuidora de Medicamentos S.A.",
    telefono: "064-562100",
    direccion: "Av. Ejemplo 123, Tingo María"
  },
  {
    id: "d2",
    nombre: "ALFARO",
    razonSocial: "Droguería Alfaro S.A.C.",
    telefono: "064-562234",
    direccion: "Jr. Ucayali 789, Tingo María"
  }
];

const packages = [
  {
    id: "p1",
    codigoSeguimiento: "TM-2026-0001",
    remitenteId: "d1",
    destinatarioId: "c1",
    sucursalOrigenId: "b1",
    sucursalDestinoId: null,
    destinoTexto: "Jr. Callao 456, Tingo María",
    descripcion: "Medicinas",
    estadoActual: "En Tránsito",
    creadoEn: now(),
    historial: [
      { estado: "En Almacén", fechaHora: now() },
      { estado: "En Tránsito", fechaHora: now() }
    ]
  }
];

const users = [
  {
    id: "u1",
    nombre: "Ana Pérez",
    email: "ana@logistica.pe",
    telefono: "999888777",
    rolId: "r1",
    sucursalId: "b1",
    activo: true,
    passwordHash: "",
    creadoEn: now()
  }
];

const buildTracking = (pkg) => {
  const remitente = distributors.find((d) => d.id === pkg.remitenteId);
  const destinatario = clients.find((c) => c.id === pkg.destinatarioId);
  const operador = users.find((u) => u.id === pkg.operadorId);
  const repartidor = users.find((u) => u.id === pkg.repartidorId);
  const origen = branches.find((b) => b.id === pkg.sucursalOrigenId);
  const destino = branches.find((b) => b.id === pkg.sucursalDestinoId);

  return {
    codigoSeguimiento: pkg.codigoSeguimiento,
    estadoActual: pkg.estadoActual,
    descripcion: pkg.descripcion,
    destinoTexto: pkg.destinoTexto || "",
    remitente,
    destinatario,
    operador,
    repartidor,
    sucursalOrigen: origen,
    sucursalDestino: destino,
    historial: pkg.historial
  };
};

const buildPackageDetails = (pkg) => ({
  ...pkg,
  remitente: distributors.find((d) => d.id === pkg.remitenteId) || null,
  destinatario: clients.find((c) => c.id === pkg.destinatarioId) || null,
  operador: users.find((u) => u.id === pkg.operadorId) || null,
  repartidor: users.find((u) => u.id === pkg.repartidorId) || null,
  sucursalOrigen: branches.find((b) => b.id === pkg.sucursalOrigenId) || null,
  sucursalDestino: branches.find((b) => b.id === pkg.sucursalDestinoId) || null
});

export const getHealth = () => ({
  status: "ok",
  time: now()
});

export const listClients = () => clients;

export const createClient = (data) => {
  const client = {
    id: uuid(),
    tipo: data.tipo || "persona",
    nombre: data.nombre || "Cliente sin nombre",
    documento: data.documento || "",
    telefono: data.telefono || "",
    email: data.email || "",
    direccion: data.direccion || ""
  };
  clients.push(client);
  return client;
};

export const listPackages = (status) => {
  if (!status) return packages;
  return packages.filter((p) => p.estadoActual === status);
};

export const listPackagesDetailed = (status) =>
  listPackages(status).map(buildPackageDetails);

export const listPackagesByCourier = (courierId) =>
  packages
    .filter((pkg) => pkg.repartidorId === courierId)
    .map(buildPackageDetails);

const generateTrackingCode = () =>
  `TM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

export const createPackage = (data) => {
  let code = data.codigoSeguimiento || generateTrackingCode();
  while (packages.some((p) => p.codigoSeguimiento === code)) {
    code = generateTrackingCode();
  }
  const pkg = {
    id: uuid(),
    codigoSeguimiento: code,
    remitenteId: data.remitenteId,
    destinatarioId: data.destinatarioId,
    operadorId: data.operadorId || null,
    repartidorId: data.repartidorId || null,
    sucursalOrigenId: data.sucursalOrigenId,
    sucursalDestinoId: data.sucursalDestinoId || null,
    destinoTexto: data.destinoTexto || "",
    descripcion: data.descripcion || "",
    estadoActual: "En Almacén",
    creadoEn: now(),
    historial: [{ estado: "En Almacén", fechaHora: now() }]
  };
  packages.push(pkg);
  return pkg;
};

export const updatePackageStatus = (id, estado, observacion = "") => {
  const pkg = packages.find((p) => p.id === id);
  if (!pkg) return null;
  pkg.estadoActual = estado;
  pkg.historial.push({ estado, fechaHora: now(), observacion });
  return pkg;
};

export const getPackageById = (id) => packages.find((p) => p.id === id) || null;

export const getPackageDetailsById = (id) => {
  const pkg = getPackageById(id);
  if (!pkg) return null;
  return buildPackageDetails(pkg);
};

export const getTrackingByCode = (code) => {
  const pkg = packages.find((p) => p.codigoSeguimiento === code);
  if (!pkg) return null;
  return buildTracking(pkg);
};

export const listUsers = () =>
  users.map(({ passwordHash, ...rest }) => rest);

export const getUserByEmail = (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase();
  return users.find((user) => user.email.toLowerCase() === normalized) || null;
};

export const getOperatorPhone = () => {
  const operatorRole = roles.find((role) => role.nombre === "Operador logístico");
  if (!operatorRole) return "";
  const operator = users.find(
    (user) => user.rolId === operatorRole.id && user.activo
  );
  return operator?.telefono || "";
};

export const listOperators = () => {
  const operatorRole = roles.find((role) => role.nombre === "Operador logístico");
  if (!operatorRole) return [];
  return users
    .filter((user) => user.rolId === operatorRole.id && user.activo)
    .map(({ passwordHash, ...rest }) => rest);
};

export const listCouriers = () => {
  const courierRole = roles.find((role) => role.nombre === "Repartidor");
  if (!courierRole) return [];
  return users
    .filter((user) => user.rolId === courierRole.id && user.activo)
    .map(({ passwordHash, ...rest }) => rest);
};

export const getUserById = (id) => users.find((user) => user.id === id) || null;

export const createUser = (data) => {
  const user = {
    id: uuid(),
    nombre: data.nombre || "Usuario",
    email: data.email || "",
    telefono: data.telefono || "",
    rolId: data.rolId || roles[0].id,
    sucursalId: data.sucursalId || branches[0].id,
    activo: data.activo ?? true,
    passwordHash: data.passwordHash || "",
    creadoEn: now()
  };
  users.push(user);
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const updateUser = (id, data) => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  const existing = users[index];
  const updated = {
    ...existing,
    nombre: data.nombre ?? existing.nombre,
    email: data.email ?? existing.email,
    telefono: data.telefono ?? existing.telefono,
    rolId: data.rolId ?? existing.rolId,
    sucursalId: data.sucursalId ?? existing.sucursalId,
    activo: data.activo ?? existing.activo,
    passwordHash: data.passwordHash || existing.passwordHash
  };
  users[index] = updated;
  const { passwordHash, ...safeUser } = updated;
  return safeUser;
};

export const deleteUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;
  const [removed] = users.splice(index, 1);
  const { passwordHash, ...safeUser } = removed;
  return safeUser;
};

export const listRoles = () => roles;

export const createRole = (nombre) => {
  const role = { id: uuid(), nombre };
  roles.push(role);
  return role;
};

export const listBranches = () => branches;

export const createBranch = (data) => {
  const branch = {
    id: uuid(),
    nombre: data.nombre || "Sucursal",
    direccion: data.direccion || ""
  };
  branches.push(branch);
  return branch;
};

export const listStatuses = () => statuses;

export const listDistributors = () => distributors;

export const createDistributor = (data) => {
  const distributor = {
    id: uuid(),
    nombre: data.nombre || "Distribuidora",
    razonSocial: data.razonSocial || "",
    telefono: data.telefono || "",
    direccion: data.direccion || ""
  };
  distributors.push(distributor);
  return distributor;
};

export const getDistributorById = (id) =>
  distributors.find((distributor) => distributor.id === id) || null;

export const getClientById = (id) =>
  clients.find((client) => client.id === id) || null;

export const getBranchById = (id) =>
  branches.find((branch) => branch.id === id) || null;

export const getRoleById = (id) =>
  roles.find((role) => role.id === id) || null;
