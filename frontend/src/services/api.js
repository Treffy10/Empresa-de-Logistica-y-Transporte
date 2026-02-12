const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const TOKEN_KEY = "adminToken";
const USER_KEY = "adminUser";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const getUser = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(message?.error || "Error al comunicarse con la API");
  }
  return response.json();
};

export const getTracking = (code) => apiFetch(`/api/tracking/${code}`);
export const getHealth = () => apiFetch("/api/health");

export const login = (payload) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const listClients = () => apiFetch("/api/clients");
export const createClient = (payload) =>
  apiFetch("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const listPackages = () => apiFetch("/api/packages/expanded");
export const listCourierPackages = () => apiFetch("/api/couriers/me/packages");
export const getPackageById = (id) => apiFetch(`/api/packages/${id}`);
export const createPackage = (payload) =>
  apiFetch("/api/packages", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const updatePackageStatus = (id, payload) =>
  apiFetch(`/api/packages/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const getOperatorPhone = () => apiFetch("/api/operators/phone");
export const listOperators = () => apiFetch("/api/operators");
export const listCouriers = () => apiFetch("/api/couriers");

export const listUsers = () => apiFetch("/api/users");
export const getUserById = (id) => apiFetch(`/api/users/${id}`);
export const createUser = (payload) =>
  apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
export const updateUser = (id, payload) =>
  apiFetch(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
export const deleteUser = (id) =>
  apiFetch(`/api/users/${id}`, {
    method: "DELETE"
  });

export const listRoles = () => apiFetch("/api/roles");
export const listBranches = () => apiFetch("/api/branches");
export const listStatuses = () => apiFetch("/api/statuses");
export const createBranch = (payload) =>
  apiFetch("/api/branches", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const listDistributors = () => apiFetch("/api/distributors");
export const createDistributor = (payload) =>
  apiFetch("/api/distributors", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const downloadPackagesReport = async (format = "csv") => {
  const token = getToken();
  const response = await fetch(
    `${API_BASE}/api/reports/packages?format=${format}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
  if (!response.ok) {
    const message = await response.json().catch(() => null);
    throw new Error(message?.error || "No se pudo generar el reporte");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="(.+)"/);
  return {
    blob,
    filename: match?.[1]
  };
};
