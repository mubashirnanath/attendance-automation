import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: JSX.Element;
  allowedRoles?: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role!)) {
    localStorage.clear()
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}
