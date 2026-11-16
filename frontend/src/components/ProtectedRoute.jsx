
import { Navigate } from "react-router-dom";

const DASHBOARD_ROUTES = {
  ADMIN: "/admin-dashboard",
  HR: "/admin-dashboard",
  MANAGER: "/manager-dashboard",
  EMPLOYEE: "/employee-dashboard",
};

function ProtectedRoute({ allowedRole, children }) {
  const token = localStorage.getItem("access");
  const storedRole = localStorage.getItem("role");

  const role = String(storedRole || "")
    .trim()
    .toUpperCase();

  // No login token: return to login page.
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // No valid role: do not allow access.
  if (!DASHBOARD_ROUTES[role]) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // User is logged in but does not have permission.
  if (role !== allowedRole) {
    return (
      <Navigate
        to={DASHBOARD_ROUTES[role]}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
