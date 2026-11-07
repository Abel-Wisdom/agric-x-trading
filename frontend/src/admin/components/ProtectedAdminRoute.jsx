
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedAdminRoute() {
  const token = localStorage.getItem("agric_admin_token");

  // No saved admin token: require login.
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render immediately.
  // The backend remains responsible for validating the JWT
  // on every protected API request.
  return <Outlet />;
}
