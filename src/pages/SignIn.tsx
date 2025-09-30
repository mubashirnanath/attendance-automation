import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verifyToken } from "../utils/token.util";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);

    if (success) {
      if (email === "admin@gmail.com") {
        navigate("/"); // redirect admin
      } else if (email === "pm@gmail.com") {
        navigate("/update-attendance"); // redirect pm
      }
    } else {
      setError("Invalid credentials");
    }
  };

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    const storedToken = localStorage.getItem("token");

    if (storedRole && storedToken && verifyToken(storedToken, storedRole)) {
      if(storedRole == 'pm'){
        navigate('/update-attendance')
      }else{
        navigate('/')
      }
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    }
  }, [])
  

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-72 bg-gray-100 p-6 rounded-lg shadow"
      >
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
}
