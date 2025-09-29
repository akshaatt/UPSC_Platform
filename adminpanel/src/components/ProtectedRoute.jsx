import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthed = localStorage.getItem("admin_auth") === "true";
  return isAuthed ? children : <Navigate to="/login" replace />;
}
