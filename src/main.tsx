import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import App from "./App.tsx";

import "./index.css";
import ProtectedRoute from "./pages/ProtectedRoute.tsx";
import SignIn from "./pages/SignIn.tsx";
import NotAuthorized from "./pages/NotAuthorized.tsx";
import TimesheetForm from "./components/TimeSheetForm.tsx";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />

          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <App />
               </ProtectedRoute>
            }
          />

          <Route
            path="/update-attendance"
            element={
              <ProtectedRoute allowedRoles={["admin", "pm"]}>
                <TimesheetForm />
               </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
