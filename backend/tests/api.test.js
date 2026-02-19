import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const jsonHeaders = { "Content-Type": "application/json" };

const request = async (baseUrl, path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const bodyText = await response.text();
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = bodyText;
  }
  return { status: response.status, body, headers: response.headers };
};

describe("API logística", () => {
  let app;
  let server;
  let baseUrl;
  let token;
  let operatorToken;
  let courierToken;
  let operatorUser;
  let courierUser;
  let packageIdForCourier;

  before(async () => {
    process.env.USE_DB = "false";
    process.env.ADMIN_USER = "admin";
    process.env.ADMIN_PASS = "admin123";
    const module = await import("../src/server.js");
    app = module.app;
    server = app.listen(0);
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      server.close();
    }
  });

  it("login con admin env retorna token", async () => {
    const res = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ usuario: "admin", password: "admin123" })
    });
    assert.equal(res.status, 200);
    assert.ok(res.body?.token);
    token = res.body.token;
  });

  it("login inválido retorna 401", async () => {
    const res = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ usuario: "admin", password: "badpass" })
    });
    assert.equal(res.status, 401);
  });

  it("tracking público retorna historial", async () => {
    const res = await request(baseUrl, "/api/tracking/TM-2026-0001");
    assert.equal(res.status, 200);
    assert.equal(res.body?.codigoSeguimiento, "TM-2026-0001");
    assert.ok(Array.isArray(res.body?.historial));
  });

  it("requiere auth para listar paquetes", async () => {
    const res = await request(baseUrl, "/api/packages/expanded");
    assert.equal(res.status, 401);
  });

  it("lista paquetes con token", async () => {
    const res = await request(baseUrl, "/api/packages/expanded", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  it("crea usuarios operador y repartidor", async () => {
    const roles = await request(baseUrl, "/api/roles", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const branches = await request(baseUrl, "/api/branches", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.ok(Array.isArray(roles.body));
    assert.ok(Array.isArray(branches.body));

    const operatorRole = roles.body.find((r) => r.nombre === "Operador logístico");
    const courierRole = roles.body.find((r) => r.nombre === "Repartidor");
    assert.ok(operatorRole?.id);
    assert.ok(courierRole?.id);

    const resOperator = await request(baseUrl, "/api/users", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: "Operador Test",
        email: "operador@test.com",
        telefono: "999888777",
        telefonoPais: "PE",
        telefonoNumero: "999888777",
        rolId: operatorRole.id,
        sucursalId: branches.body[0]?.id,
        password: "operador123",
        activo: true
      })
    });
    assert.equal(resOperator.status, 201);
    operatorUser = resOperator.body;
    assert.ok(operatorUser?.id);

    const resCourier = await request(baseUrl, "/api/users", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: "Repartidor Test",
        email: "repartidor@test.com",
        telefono: "988776655",
        telefonoPais: "PE",
        telefonoNumero: "988776655",
        rolId: courierRole.id,
        sucursalId: branches.body[0]?.id,
        password: "repartidor123",
        activo: true
      })
    });
    assert.equal(resCourier.status, 201);
    courierUser = resCourier.body;
    assert.ok(courierUser?.id);
  });

  it("login de operador y repartidor", async () => {
    const resOperator = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        usuario: "operador@test.com",
        password: "operador123"
      })
    });
    assert.equal(resOperator.status, 200);
    operatorToken = resOperator.body?.token;
    assert.ok(operatorToken);

    const resCourier = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        usuario: "repartidor@test.com",
        password: "repartidor123"
      })
    });
    assert.equal(resCourier.status, 200);
    courierToken = resCourier.body?.token;
    assert.ok(courierToken);
  });

  it("crea cliente y distribuidora", async () => {
    const resClient = await request(baseUrl, "/api/clients", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tipo: "persona",
        nombre: "Cliente Test",
        documento: "12345678",
        telefono: "900111222",
        telefonoPais: "PE",
        telefonoNumero: "900111222",
        email: "cliente@test.com",
        direccion: "Jr. Test 123"
      })
    });
    assert.equal(resClient.status, 201);

    const resDistributor = await request(baseUrl, "/api/distributors", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: "Distribuidora Test",
        razonSocial: "Distribuidora Test SAC",
        telefono: "901222333",
        telefonoPais: "PE",
        telefonoNumero: "901222333",
        direccion: "Av. Test 456"
      })
    });
    assert.equal(resDistributor.status, 201);
  });

  it("crear paquete asigna operador automáticamente", async () => {
    const res = await request(baseUrl, "/api/packages", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${operatorToken}` },
      body: JSON.stringify({
        remitenteId: "d1",
        destinatarioId: "c1",
        sucursalOrigenId: "b1",
        destinoTexto: "Jr. Test 123",
        descripcion: "Caja prueba",
        repartidorId: courierUser.id
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body?.operadorId, operatorUser.id);
  });

  it("crear paquete con repartidor asignado", async () => {
    const res = await request(baseUrl, "/api/packages", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        remitenteId: "d1",
        destinatarioId: "c1",
        sucursalOrigenId: "b1",
        destinoTexto: "Jr. Courier 456",
        descripcion: "Caja courier",
        operadorId: operatorUser.id,
        repartidorId: courierUser.id
      })
    });
    assert.equal(res.status, 201);
    packageIdForCourier = res.body?.id;
    assert.ok(packageIdForCourier);
  });

  it("crear paquete cliente a cliente", async () => {
    const res = await request(baseUrl, "/api/packages", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tipoEnvio: "cliente_cliente",
        remitenteClienteId: "c2",
        destinatarioId: "c1",
        operadorId: operatorUser.id,
        repartidorId: courierUser.id,
        sucursalOrigenId: "b1",
        destinoTexto: "Jr. Cliente a Cliente 789",
        descripcion: "Sobre de documentos"
      })
    });
    assert.equal(res.status, 201);
    assert.equal(res.body?.tipoEnvio, "cliente_cliente");
    assert.equal(res.body?.remitenteClienteId, "c2");
  });

  it("repartidor ve solo sus entregas", async () => {
    const res = await request(baseUrl, "/api/couriers/me/packages", {
      headers: { Authorization: `Bearer ${courierToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.every((pkg) => pkg.repartidor?.id === courierUser.id));
  });

  it("repartidor no puede crear paquetes", async () => {
    const res = await request(baseUrl, "/api/packages", {
      method: "POST",
      headers: { ...jsonHeaders, Authorization: `Bearer ${courierToken}` },
      body: JSON.stringify({
        remitenteId: "d1",
        destinatarioId: "c1",
        sucursalOrigenId: "b1",
        destinoTexto: "Jr. No permitido"
      })
    });
    assert.equal(res.status, 403);
  });

  it("repartidor puede marcar entrega y no puede En Tránsito", async () => {
    const resDenied = await request(
      baseUrl,
      `/api/packages/${packageIdForCourier}/status`,
      {
        method: "PATCH",
        headers: { ...jsonHeaders, Authorization: `Bearer ${courierToken}` },
        body: JSON.stringify({ estado: "En Tránsito", observacion: "" })
      }
    );
    assert.equal(resDenied.status, 403);

    const resOk = await request(
      baseUrl,
      `/api/packages/${packageIdForCourier}/status`,
      {
        method: "PATCH",
        headers: { ...jsonHeaders, Authorization: `Bearer ${courierToken}` },
        body: JSON.stringify({ estado: "Entregado", observacion: "OK" })
      }
    );
    assert.equal(resOk.status, 200);
  });

  it("lista roles, sucursales y operadores/repartidores", async () => {
    const roles = await request(baseUrl, "/api/roles", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(roles.status, 200);

    const branches = await request(baseUrl, "/api/branches", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(branches.status, 200);

    const operators = await request(baseUrl, "/api/operators", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(operators.status, 200);

    const couriers = await request(baseUrl, "/api/couriers", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(couriers.status, 200);
  });

  it("descarga reportes CSV y XLSX", async () => {
    const resCsv = await request(
      baseUrl,
      "/api/reports/packages?format=csv",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    assert.equal(resCsv.status, 200);

    const resXlsx = await request(
      baseUrl,
      "/api/reports/packages?format=xlsx",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    assert.equal(resXlsx.status, 200);
  });

  it("edita y elimina usuario", async () => {
    const resUpdate = await request(baseUrl, `/api/users/${operatorUser.id}`, {
      method: "PUT",
      headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: "Operador Editado",
        email: "operador@test.com",
        telefono: "900000000",
        telefonoPais: "PE",
        telefonoNumero: "900000000",
        rolId: operatorUser.rolId,
        sucursalId: operatorUser.sucursalId,
        activo: true
      })
    });
    assert.equal(resUpdate.status, 200);

    const del = await request(baseUrl, `/api/users/${operatorUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(del.status, 200);
    assert.equal(del.body?.ok, true);
  });

  it("elimina repartidor de prueba", async () => {
    const del = await request(baseUrl, `/api/users/${courierUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(del.status, 200);
    assert.equal(del.body?.ok, true);
  });
});
