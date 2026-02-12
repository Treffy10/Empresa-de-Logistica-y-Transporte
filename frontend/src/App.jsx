import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Tracking from "./pages/Tracking.jsx";
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminPackages from "./pages/AdminPackages.jsx";
import AdminPackageNew from "./pages/AdminPackageNew.jsx";
import AdminPackageDetail from "./pages/AdminPackageDetail.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminClients from "./pages/AdminClients.jsx";
import AdminClientNew from "./pages/AdminClientNew.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminUserNew from "./pages/AdminUserNew.jsx";
import AdminUserEdit from "./pages/AdminUserEdit.jsx";
import AdminDistributors from "./pages/AdminDistributors.jsx";
import AdminDistributorNew from "./pages/AdminDistributorNew.jsx";
import AdminBranches from "./pages/AdminBranches.jsx";
import AdminBranchNew from "./pages/AdminBranchNew.jsx";
import { getToken, getUser } from "./services/api.js";

const RequireAuth = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const RequireRole = ({ roles, children }) => {
  const user = getUser();
  const roleName = user?.roleName;
  if (!roleName || !roles.includes(roleName)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

const App = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/seguimiento" element={<Tracking />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/clientes/nuevo"
            element={
              <RequireAuth>
                <RequireRole roles={["Administrador", "Operador logístico"]}>
                  <AdminLayout>
                    <AdminClientNew />
                  </AdminLayout>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/usuarios/nuevo"
            element={
              <RequireAuth>
                <RequireRole roles={["Administrador"]}>
                  <AdminLayout>
                    <AdminUserNew />
                  </AdminLayout>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/usuarios/:id/editar"
            element={
              <RequireAuth>
                <RequireRole roles={["Administrador"]}>
                  <AdminLayout>
                    <AdminUserEdit />
                  </AdminLayout>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/distribuidoras/nuevo"
            element={
              <RequireAuth>
                <RequireRole roles={["Administrador"]}>
                  <AdminLayout>
                    <AdminDistributorNew />
                  </AdminLayout>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin/sucursales/nuevo"
            element={
              <RequireAuth>
                <RequireRole roles={["Administrador"]}>
                  <AdminLayout>
                    <AdminBranchNew />
                  </AdminLayout>
                </RequireRole>
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route
              index
              element={
                <RequireRole roles={["Administrador", "Operador logístico"]}>
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route path="paquetes" element={<AdminPackages />} />
            <Route
              path="paquetes/nuevo"
              element={
                <RequireRole roles={["Administrador", "Operador logístico"]}>
                  <AdminPackageNew />
                </RequireRole>
              }
            />
            <Route path="paquetes/:id" element={<AdminPackageDetail />} />
            <Route
              path="clientes"
              element={
                <RequireRole roles={["Administrador", "Operador logístico"]}>
                  <AdminClients />
                </RequireRole>
              }
            />
            <Route
              path="usuarios"
              element={
                <RequireRole roles={["Administrador"]}>
                  <AdminUsers />
                </RequireRole>
              }
            />
            <Route
              path="distribuidoras"
              element={
                <RequireRole roles={["Administrador", "Operador logístico"]}>
                  <AdminDistributors />
                </RequireRole>
              }
            />
            <Route
              path="sucursales"
              element={
                <RequireRole roles={["Administrador"]}>
                  <AdminBranches />
                </RequireRole>
              }
            />
          </Route>
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
};

export default App;
