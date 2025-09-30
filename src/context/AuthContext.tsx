import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { verifyToken } from "../utils/token.util";

type Role = "admin" | "pm";

type AuthContextType = {
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USERS = [
  { email: "admin@gmail.com", password: "admin", role: "admin" as Role },
  { email: "pm@gmail.com", password: "pm", role: "pm" as Role },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);



  useEffect(() => {
    const storedRole = localStorage.getItem("role") as Role | null;
    const storedToken = localStorage.getItem("token");

    if (storedRole && storedToken && verifyToken(storedToken, storedRole)) {
      setIsAuthenticated(true);
      setRole(storedRole);
    } else {
      logout();
    }
  }, []);

  const login = (email: string, password: string) => {
    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!user) return false;

    const token = btoa(`${user.email}:${user.role}`); // encode
    localStorage.setItem("role", user.role);
    localStorage.setItem("token", token);

    setIsAuthenticated(true);
    setRole(user.role);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(null);
    localStorage.removeItem("role");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
