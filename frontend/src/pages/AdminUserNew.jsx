import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, getDniData, listBranches, listRoles } from "../services/api.js";
import PhoneField from "../components/PhoneField.jsx";
import {
  buildPhoneValue,
  DEFAULT_PHONE_COUNTRY,
  onlyDigits
} from "../utils/phone.js";

const emptyForm = {
  documento: "",
  nombre: "",
  email: "",
  telefonoPais: DEFAULT_PHONE_COUNTRY,
  telefonoNumero: "",
  password: "",
  rolId: "",
  sucursalId: "",
  activo: true,
  placa: "",
  vehiculo: ""
};

const AdminUserNew = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dniLoading, setDniLoading] = useState(false);
  const [dniError, setDniError] = useState("");
  const lastDniRef = useRef("");

  useEffect(() => {
    const load = async () => {
      try {
        const [rolesData, branchesData] = await Promise.all([
          listRoles(),
          listBranches()
        ]);
        setRoles(rolesData);
        setBranches(branchesData);
      } catch (err) {
        setError(err.message || "No se pudieron cargar los datos.");
      }
    };
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "documento") setDniError("");

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "telefonoNumero" || name === "documento"
          ? onlyDigits(value)
          : value
    }));
  };

  const handleDocumentoKeyDown = (event) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  };

  useEffect(() => {
    const dni = onlyDigits(form.documento);

    if (dni.length < 8) {
      lastDniRef.current = "";
      return;
    }

    if (dni === lastDniRef.current) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      setDniLoading(true);
      setDniError("");

      try {
        const result = await getDniData(dni);

        if (cancelled) return;

        const fullName =
          String(result.nombreCompleto || "").trim() ||
          [
            String(result.nombres || "").trim(),
            String(result.apellidoPaterno || "").trim(),
            String(result.apellidoMaterno || "").trim()
          ]
            .filter(Boolean)
            .join(" ");

        if (fullName) {
          setForm((prev) => ({ ...prev, documento: dni, nombre: fullName }));
        }

      } catch (err) {
        if (!cancelled) {
          setDniError(err.message || "No se pudo consultar DNI.");
        }
      } finally {
        if (!cancelled) {
          lastDniRef.current = dni;
          setDniLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.documento]);

  const handleCancel = () => {
    navigate("/admin/usuarios");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio.";
    if (!form.email.trim()) nextErrors.email = "El email es obligatorio.";
    if (!form.password.trim()) nextErrors.password = "La contraseña es obligatoria.";
    if (!form.rolId) nextErrors.rolId = "Selecciona un rol.";
    if (!form.sucursalId) nextErrors.sucursalId = "Selecciona una sucursal.";

    const phone = buildPhoneValue(form.telefonoPais, form.telefonoNumero);
    if (!phone.ok) nextErrors.telefonoNumero = phone.error;

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Revisa los campos marcados.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        telefonoPais: form.telefonoPais,
        telefonoNumero: phone.local,
        telefono: phone.e164
      };

      if (roles.find((r) => String(r.id) === String(form.rolId))?.nombre === "Repartidor") {
        payload.placa = form.placa?.trim() || null;
        payload.vehiculo = form.vehiculo?.trim() || null;
      }

      await createUser(payload);

      setSuccess("Usuario creado con éxito.");

      setTimeout(() => navigate("/admin/usuarios"), 900);

    } catch (err) {
      setError(err.message || "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-lg">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 shadow-sm">
          👤
        </div>

        <div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 bg-clip-text text-transparent">
            Registrar Usuario
          </h2>

          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-green-600 to-emerald-400 mt-1"></div>

          <p className="text-sm text-slate-500 mt-2">
            Completa la información del usuario
          </p>
        </div>

      </div>

      <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">

        {/* DNI */}
        <label className="text-sm text-slate-600">
          DNI
          <input
            name="documento"
            value={form.documento}
            onChange={handleChange}
            onKeyDown={handleDocumentoKeyDown}
            maxLength={8}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        {/* NOMBRE */}
        <label className="text-sm text-slate-600">
          Nombre *
          <input
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        {/* EMAIL */}
        <label className="text-sm text-slate-600">
          Email *
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        <PhoneField
          countryValue={form.telefonoPais}
          numberValue={form.telefonoNumero}
          onChange={handleChange}
        />

        {/* PASSWORD */}
        <label className="text-sm text-slate-600">
          Contraseña *
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          />
        </label>

        {/* ROL */}
        <label className="text-sm text-slate-600">
          Rol *
          <select
            name="rolId"
            value={form.rolId}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          >
            <option value="">Seleccionar rol</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* SUCURSAL */}
        <label className="text-sm text-slate-600">
          Sucursal *
          <select
            name="sucursalId"
            value={form.sucursalId}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
          >
            <option value="">Seleccionar sucursal</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.nombre}
              </option>
            ))}
          </select>
        </label>

        {/* BOTONES */}
        <div className="md:col-span-2 flex justify-between mt-6">

          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700 hover:scale-105"
          >
            {loading ? "Guardando..." : "Guardar usuario"}
          </button>

        </div>

      </form>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

    </div>
  );
};

export default AdminUserNew;