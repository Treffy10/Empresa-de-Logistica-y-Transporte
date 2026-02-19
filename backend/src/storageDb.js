import pg from "pg";

const { Pool } = pg;

let pool;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const useSsl = connectionString?.includes("supabase.co");
    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
};

const statuses = ["En Almacén", "En Tránsito", "Entregado", "Intento fallido"];

const query = (text, params) => getPool().query(text, params);

const toIsoUtc = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    return `${withT}Z`;
  }
  return value;
};

const mapPackageRow = (row) => ({
  id: row.id,
  codigoSeguimiento: row.codigo_seguimiento,
  tipoEnvio: row.tipo_envio || "distribuidora_cliente",
  remitenteId: row.remitente_id,
  remitenteClienteId: row.remitente_cliente_id,
  destinatarioId: row.destinatario_id,
  operadorId: row.operador_id,
  repartidorId: row.repartidor_id,
  sucursalOrigenId: row.sucursal_origen_id,
  sucursalDestinoId: row.sucursal_destino_id,
  destinoTexto: row.destino_texto || "",
  descripcion: row.descripcion,
  estadoActual: row.estado_actual,
  reprogramacionFecha: row.reprogramacion_fecha,
  reprogramacionHoraInicio: row.reprogramacion_hora_inicio,
  reprogramacionHoraFin: row.reprogramacion_hora_fin,
  reprogramacionDireccion: row.reprogramacion_direccion,
  creadoEn: toIsoUtc(row.creado_en)
});

const mapPackageDetailsRow = (row) => ({
  ...mapPackageRow(row),
  remitenteTipo: row.remitente_tipo || "Distribuidora",
  remitente: row.remitente_ref_id
    ? {
        id: row.remitente_ref_id,
        nombre: row.remitente_nombre,
        razonSocial: row.remitente_razon_social,
        documento: row.remitente_documento,
        telefono: row.remitente_telefono,
        direccion: row.remitente_direccion
      }
    : null,
  destinatario: row.destinatario_id
    ? {
        id: row.destinatario_id,
        nombre: row.destinatario_nombre,
        documento: row.destinatario_documento,
        telefono: row.destinatario_telefono,
        email: row.destinatario_email,
        direccion: row.destinatario_direccion
      }
    : null,
  operador: row.operador_id
    ? {
        id: row.operador_id,
        nombre: row.operador_nombre,
        telefono: row.operador_telefono,
        email: row.operador_email
      }
    : null,
  repartidor: row.repartidor_id
    ? {
        id: row.repartidor_id,
        nombre: row.repartidor_nombre,
        telefono: row.repartidor_telefono,
        email: row.repartidor_email
      }
    : null,
  sucursalOrigen: row.suc_origen_id
    ? {
        id: row.suc_origen_id,
        nombre: row.suc_origen_nombre,
        direccion: row.suc_origen_direccion
      }
    : null,
  sucursalDestino: row.suc_destino_id
    ? {
        id: row.suc_destino_id,
        nombre: row.suc_destino_nombre,
        direccion: row.suc_destino_direccion
      }
    : null
});

const generateTrackingCode = () =>
  `TM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

export const getHealth = () => ({
  status: "ok",
  time: new Date().toISOString()
});

export const listClients = async () => {
  const { rows } = await query("SELECT * FROM clientes ORDER BY id DESC");
  return rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    nombre: row.nombre,
    documento: row.documento,
    telefono: row.telefono,
    email: row.email,
    direccion: row.direccion,
    creadoEn: row.creado_en
  }));
};

export const createClient = async (data) => {
  const { rows } = await query(
    `INSERT INTO clientes (tipo, nombre, documento, telefono, email, direccion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.tipo || "persona",
      data.nombre || "Cliente sin nombre",
      data.documento || "",
      data.telefono || "",
      data.email || "",
      data.direccion || ""
    ]
  );
  const row = rows[0];
  return {
    id: row.id,
    tipo: row.tipo,
    nombre: row.nombre,
    documento: row.documento,
    telefono: row.telefono,
    email: row.email,
    direccion: row.direccion,
    creadoEn: row.creado_en
  };
};

export const getClientById = async (id) => {
  const { rows } = await query("SELECT * FROM clientes WHERE id = $1", [id]);
  return rows[0] || null;
};

export const getDistributorById = async (id) => {
  const { rows } = await query(
    "SELECT * FROM distribuidoras WHERE id = $1",
    [id]
  );
  return rows[0] || null;
};

export const listBranches = async () => {
  const { rows } = await query("SELECT * FROM sucursales ORDER BY id");
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion
  }));
};

export const createBranch = async (data) => {
  const { rows } = await query(
    `INSERT INTO sucursales (nombre, direccion)
     VALUES ($1, $2)
     RETURNING *`,
    [data.nombre || "Sucursal", data.direccion || ""]
  );
  const row = rows[0];
  return {
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion
  };
};

export const getBranchById = async (id) => {
  const { rows } = await query("SELECT * FROM sucursales WHERE id = $1", [id]);
  return rows[0] || null;
};

export const listRoles = async () => {
  const { rows } = await query("SELECT * FROM roles ORDER BY id");
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre
  }));
};

export const createRole = async (nombre) => {
  const { rows } = await query(
    "INSERT INTO roles (nombre) VALUES ($1) RETURNING *",
    [nombre]
  );
  return rows[0] || null;
};

export const getRoleById = async (id) => {
  const { rows } = await query("SELECT * FROM roles WHERE id = $1", [id]);
  return rows[0] || null;
};

export const listUsers = async () => {
  const { rows } = await query(
    "SELECT id, nombre, email, telefono, rol_id, sucursal_id, activo, creado_en FROM usuarios ORDER BY id DESC"
  );
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    rolId: row.rol_id,
    sucursalId: row.sucursal_id,
    activo: row.activo,
    creadoEn: row.creado_en
  }));
};

export const getUserById = async (id) => {
  const { rows } = await query("SELECT * FROM usuarios WHERE id = $1", [id]);
  return rows[0] || null;
};

export const getUserByEmail = async (email) => {
  if (!email) return null;
  const { rows } = await query(
    "SELECT * FROM usuarios WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );
  return rows[0] || null;
};

export const getOperatorPhone = async () => {
  const { rows } = await query(
    `SELECT u.telefono
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = $1 AND u.activo = true
     ORDER BY u.id ASC
     LIMIT 1`,
    ["Operador logístico"]
  );
  return rows[0]?.telefono || "";
};

export const listOperators = async () => {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.telefono, u.email
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = $1 AND u.activo = true
     ORDER BY u.id ASC`,
    ["Operador logístico"]
  );
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email
  }));
};

export const listCouriers = async () => {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.telefono, u.email
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = $1 AND u.activo = true
     ORDER BY u.id ASC`,
    ["Repartidor"]
  );
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono,
    email: row.email
  }));
};

export const createUser = async (data) => {
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, email, telefono, rol_id, sucursal_id, activo, password_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.nombre || "Usuario",
      data.email || "",
      data.telefono || "",
      data.rolId,
      data.sucursalId,
      data.activo ?? true,
      data.passwordHash || ""
    ]
  );
  const row = rows[0];
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    telefono: row.telefono,
    rolId: row.rol_id,
    sucursalId: row.sucursal_id,
    activo: row.activo,
    creadoEn: row.creado_en
  };
};

export const updateUser = async (id, data) => {
  const { rows } = await query(
    `UPDATE usuarios
     SET nombre = $1,
         email = $2,
         telefono = $3,
         rol_id = $4,
         sucursal_id = $5,
         activo = $6,
         password_hash = COALESCE($7, password_hash)
     WHERE id = $8
     RETURNING *`,
    [
      data.nombre || "Usuario",
      data.email || "",
      data.telefono || "",
      data.rolId,
      data.sucursalId,
      data.activo ?? true,
      data.passwordHash || null,
      id
    ]
  );
  return rows[0] || null;
};

export const deleteUser = async (id) => {
  const { rows } = await query("DELETE FROM usuarios WHERE id = $1 RETURNING *", [
    id
  ]);
  return rows[0] || null;
};

export const listPackages = async (status) => {
  if (!status) {
    const { rows } = await query("SELECT * FROM paquetes ORDER BY id DESC");
    return rows.map(mapPackageRow);
  }
  const { rows } = await query(
    "SELECT * FROM paquetes WHERE estado_actual = $1 ORDER BY id DESC",
    [status]
  );
  return rows.map(mapPackageRow);
};

export const listPackagesDetailed = async (status) => {
  const baseQuery = `
    SELECT
      p.*,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.id ELSE r.id END as remitente_ref_id,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.nombre ELSE r.nombre END as remitente_nombre,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN NULL ELSE r.razon_social END as remitente_razon_social,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.documento ELSE NULL END as remitente_documento,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.telefono ELSE r.telefono END as remitente_telefono,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.direccion ELSE r.direccion END as remitente_direccion,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN 'Cliente' ELSE 'Distribuidora' END as remitente_tipo,
      d.id as destinatario_id, d.nombre as destinatario_nombre, d.documento as destinatario_documento,
      d.telefono as destinatario_telefono, d.email as destinatario_email, d.direccion as destinatario_direccion,
      u.id as operador_id, u.nombre as operador_nombre, u.telefono as operador_telefono, u.email as operador_email,
      ur.id as repartidor_id, ur.nombre as repartidor_nombre, ur.telefono as repartidor_telefono, ur.email as repartidor_email,
      so.id as suc_origen_id, so.nombre as suc_origen_nombre, so.direccion as suc_origen_direccion,
      sd.id as suc_destino_id, sd.nombre as suc_destino_nombre, sd.direccion as suc_destino_direccion
    FROM paquetes p
    LEFT JOIN distribuidoras r ON r.id = p.remitente_id
    LEFT JOIN clientes rc ON rc.id = p.remitente_cliente_id
    JOIN clientes d ON d.id = p.destinatario_id
    LEFT JOIN usuarios u ON u.id = p.operador_id
    LEFT JOIN usuarios ur ON ur.id = p.repartidor_id
    JOIN sucursales so ON so.id = p.sucursal_origen_id
    LEFT JOIN sucursales sd ON sd.id = p.sucursal_destino_id
  `;

  const { rows } = status
    ? await query(`${baseQuery} WHERE p.estado_actual = $1 ORDER BY p.id DESC`, [
        status
      ])
    : await query(`${baseQuery} ORDER BY p.id DESC`);

  return rows.map(mapPackageDetailsRow);
};

export const listPackagesByCourier = async (courierId) => {
  const baseQuery = `
    SELECT
      p.*,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.id ELSE r.id END as remitente_ref_id,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.nombre ELSE r.nombre END as remitente_nombre,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN NULL ELSE r.razon_social END as remitente_razon_social,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.documento ELSE NULL END as remitente_documento,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.telefono ELSE r.telefono END as remitente_telefono,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.direccion ELSE r.direccion END as remitente_direccion,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN 'Cliente' ELSE 'Distribuidora' END as remitente_tipo,
      d.id as destinatario_id, d.nombre as destinatario_nombre, d.documento as destinatario_documento,
      d.telefono as destinatario_telefono, d.email as destinatario_email, d.direccion as destinatario_direccion,
      u.id as operador_id, u.nombre as operador_nombre, u.telefono as operador_telefono, u.email as operador_email,
      ur.id as repartidor_id, ur.nombre as repartidor_nombre, ur.telefono as repartidor_telefono, ur.email as repartidor_email,
      so.id as suc_origen_id, so.nombre as suc_origen_nombre, so.direccion as suc_origen_direccion,
      sd.id as suc_destino_id, sd.nombre as suc_destino_nombre, sd.direccion as suc_destino_direccion
    FROM paquetes p
    LEFT JOIN distribuidoras r ON r.id = p.remitente_id
    LEFT JOIN clientes rc ON rc.id = p.remitente_cliente_id
    JOIN clientes d ON d.id = p.destinatario_id
    LEFT JOIN usuarios u ON u.id = p.operador_id
    LEFT JOIN usuarios ur ON ur.id = p.repartidor_id
    JOIN sucursales so ON so.id = p.sucursal_origen_id
    LEFT JOIN sucursales sd ON sd.id = p.sucursal_destino_id
    WHERE p.repartidor_id = $1
    ORDER BY p.id DESC
  `;
  const { rows } = await query(baseQuery, [courierId]);
  return rows.map(mapPackageDetailsRow);
};

export const getPackageById = async (id) => {
  const { rows } = await query("SELECT * FROM paquetes WHERE id = $1", [id]);
  return rows[0] || null;
};

export const getPackageDetailsById = async (id) => {
  const { rows } = await query(
    `
    SELECT
      p.*,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.id ELSE r.id END as remitente_ref_id,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.nombre ELSE r.nombre END as remitente_nombre,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN NULL ELSE r.razon_social END as remitente_razon_social,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.documento ELSE NULL END as remitente_documento,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.telefono ELSE r.telefono END as remitente_telefono,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.direccion ELSE r.direccion END as remitente_direccion,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN 'Cliente' ELSE 'Distribuidora' END as remitente_tipo,
      d.id as destinatario_id, d.nombre as destinatario_nombre, d.documento as destinatario_documento,
      d.telefono as destinatario_telefono, d.email as destinatario_email, d.direccion as destinatario_direccion,
      u.id as operador_id, u.nombre as operador_nombre, u.telefono as operador_telefono, u.email as operador_email,
      ur.id as repartidor_id, ur.nombre as repartidor_nombre, ur.telefono as repartidor_telefono, ur.email as repartidor_email,
      so.id as suc_origen_id, so.nombre as suc_origen_nombre, so.direccion as suc_origen_direccion,
      sd.id as suc_destino_id, sd.nombre as suc_destino_nombre, sd.direccion as suc_destino_direccion
    FROM paquetes p
    LEFT JOIN distribuidoras r ON r.id = p.remitente_id
    LEFT JOIN clientes rc ON rc.id = p.remitente_cliente_id
    JOIN clientes d ON d.id = p.destinatario_id
    LEFT JOIN usuarios u ON u.id = p.operador_id
    LEFT JOIN usuarios ur ON ur.id = p.repartidor_id
    JOIN sucursales so ON so.id = p.sucursal_origen_id
    LEFT JOIN sucursales sd ON sd.id = p.sucursal_destino_id
    WHERE p.id = $1
    `,
    [id]
  );

  if (!rows[0]) return null;
  const pkg = mapPackageDetailsRow(rows[0]);
  const history = await query(
    "SELECT estado, fecha_hora, observacion FROM historial_estados WHERE paquete_id = $1 ORDER BY fecha_hora ASC",
    [id]
  );
  return {
    ...pkg,
    historial: history.rows.map((row) => ({
      estado: row.estado,
      fechaHora: toIsoUtc(row.fecha_hora),
      observacion: row.observacion
    }))
  };
};

export const createPackage = async (data) => {
  let code = data.codigoSeguimiento || generateTrackingCode();
  let pkgRow = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const { rows } = await query(
        `INSERT INTO paquetes (
          codigo_seguimiento,
          tipo_envio,
          remitente_id,
          remitente_cliente_id,
          destinatario_id,
          operador_id,
          repartidor_id,
          sucursal_origen_id,
          sucursal_destino_id,
          destino_texto,
          descripcion,
          estado_actual
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          code,
          data.tipoEnvio || "distribuidora_cliente",
          data.remitenteId || null,
          data.remitenteClienteId || null,
          data.destinatarioId,
          data.operadorId || null,
          data.repartidorId || null,
          data.sucursalOrigenId,
          data.sucursalDestinoId || null,
          data.destinoTexto || "",
          data.descripcion || "",
          "En Almacén"
        ]
      );
      pkgRow = rows[0];
      break;
    } catch (err) {
      if (err.code === "23505") {
        code = generateTrackingCode();
      } else {
        throw err;
      }
    }
  }

  if (!pkgRow) {
    throw new Error("No se pudo generar el código de seguimiento");
  }

  await query(
    "INSERT INTO historial_estados (paquete_id, estado) VALUES ($1, $2)",
    [pkgRow.id, "En Almacén"]
  );

  return mapPackageRow(pkgRow);
};

export const updatePackageStatus = async (id, estado, observacion = "") => {
  const { rows } = await query(
    "UPDATE paquetes SET estado_actual = $1 WHERE id = $2 RETURNING *",
    [estado, id]
  );
  await query(
    "INSERT INTO historial_estados (paquete_id, estado, observacion) VALUES ($1, $2, $3)",
    [id, estado, observacion]
  );
  return rows[0] ? mapPackageRow(rows[0]) : null;
};

export const updatePackageReprogramar = async (
  id,
  { fecha, horaInicio, horaFin, direccion }
) => {
  const updates = [
    "reprogramacion_fecha = $1",
    "reprogramacion_hora_inicio = $2",
    "reprogramacion_hora_fin = $3",
    "reprogramacion_direccion = $4",
    "estado_actual = $5"
  ];
  const params = [fecha, horaInicio, horaFin, direccion || null, "En Tránsito"];
  if (direccion && String(direccion).trim()) {
    updates.push("destino_texto = $6");
    params.push(direccion.trim());
  }
  params.push(id);
  const { rows } = await query(
    `UPDATE paquetes SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  await query(
    "INSERT INTO historial_estados (paquete_id, estado, observacion) VALUES ($1, $2, $3)",
    [id, "En Tránsito", "Reprogramado para entrega"]
  );
  return rows[0] ? mapPackageRow(rows[0]) : null;
};

export const getTrackingByCode = async (code) => {
  const { rows } = await query(
    `
    SELECT
      p.*,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.id ELSE r.id END as remitente_ref_id,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.nombre ELSE r.nombre END as remitente_nombre,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN NULL ELSE r.razon_social END as remitente_razon_social,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.documento ELSE NULL END as remitente_documento,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.telefono ELSE r.telefono END as remitente_telefono,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN rc.direccion ELSE r.direccion END as remitente_direccion,
      CASE WHEN p.tipo_envio = 'cliente_cliente' THEN 'Cliente' ELSE 'Distribuidora' END as remitente_tipo,
      d.id as destinatario_id, d.nombre as destinatario_nombre, d.documento as destinatario_documento,
      d.telefono as destinatario_telefono, d.email as destinatario_email, d.direccion as destinatario_direccion,
      u.id as operador_id, u.nombre as operador_nombre, u.telefono as operador_telefono, u.email as operador_email,
      ur.id as repartidor_id, ur.nombre as repartidor_nombre, ur.telefono as repartidor_telefono, ur.email as repartidor_email,
      so.id as suc_origen_id, so.nombre as suc_origen_nombre, so.direccion as suc_origen_direccion,
      sd.id as suc_destino_id, sd.nombre as suc_destino_nombre, sd.direccion as suc_destino_direccion
    FROM paquetes p
    LEFT JOIN distribuidoras r ON r.id = p.remitente_id
    LEFT JOIN clientes rc ON rc.id = p.remitente_cliente_id
    JOIN clientes d ON d.id = p.destinatario_id
    LEFT JOIN usuarios u ON u.id = p.operador_id
    LEFT JOIN usuarios ur ON ur.id = p.repartidor_id
    JOIN sucursales so ON so.id = p.sucursal_origen_id
    LEFT JOIN sucursales sd ON sd.id = p.sucursal_destino_id
    WHERE p.codigo_seguimiento = $1
    `,
    [code]
  );

  if (!rows[0]) return null;
  const pkg = mapPackageDetailsRow(rows[0]);
  const history = await query(
    "SELECT estado, fecha_hora, observacion FROM historial_estados WHERE paquete_id = $1 ORDER BY fecha_hora ASC",
    [pkg.id]
  );
  return {
    id: pkg.id,
    codigoSeguimiento: pkg.codigoSeguimiento,
    estadoActual: pkg.estadoActual,
    descripcion: pkg.descripcion,
    destinoTexto: pkg.destinoTexto || "",
    tipoEnvio: pkg.tipoEnvio,
    remitenteTipo: pkg.remitenteTipo,
    remitente: pkg.remitente,
    destinatario: pkg.destinatario,
    operador: pkg.operador,
    repartidor: pkg.repartidor,
    sucursalOrigen: pkg.sucursalOrigen,
    sucursalDestino: pkg.sucursalDestino,
    reprogramacionFecha: pkg.reprogramacionFecha,
    reprogramacionHoraInicio: pkg.reprogramacionHoraInicio,
    reprogramacionHoraFin: pkg.reprogramacionHoraFin,
    reprogramacionDireccion: pkg.reprogramacionDireccion,
    historial: history.rows.map((row) => ({
      estado: row.estado,
      fechaHora: toIsoUtc(row.fecha_hora),
      observacion: row.observacion
    }))
  };
};

export const listDistributors = async () => {
  const { rows } = await query("SELECT * FROM distribuidoras ORDER BY id DESC");
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    razonSocial: row.razon_social,
    telefono: row.telefono,
    direccion: row.direccion,
    creadoEn: row.creado_en
  }));
};

export const createDistributor = async (data) => {
  const { rows } = await query(
    `INSERT INTO distribuidoras (nombre, razon_social, telefono, direccion)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      data.nombre || "Distribuidora",
      data.razonSocial || "",
      data.telefono || "",
      data.direccion || ""
    ]
  );
  const row = rows[0];
  return {
    id: row.id,
    nombre: row.nombre,
    razonSocial: row.razon_social,
    telefono: row.telefono,
    direccion: row.direccion,
    creadoEn: row.creado_en
  };
};

export const listStatuses = () => statuses;
