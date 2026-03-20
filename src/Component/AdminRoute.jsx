import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const isAuth = sessionStorage.getItem("bnc_admin_auth") === "true";
  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
