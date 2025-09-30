  // Verify token
  const USERS = [
    { email: "admin@gmail.com", password: "admin", role: "admin" },
    { email: "pm@gmail.com", password: "pm", role: "pm" },
  ];
  export const verifyToken = (token: string, role: string | null) => {
    try {
      const decoded = atob(token); // base64 decode
      const [email, userRole] = decoded.split(":");

      const validUser = USERS.find(
        (u) => u.email === email && u.role === userRole
      );

      if (validUser && userRole === role) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };