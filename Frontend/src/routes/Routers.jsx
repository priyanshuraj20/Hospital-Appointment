import { Routes, Route, Navigate } from "react-router-dom";
import Doctors from "../pages/Doctors/Doctors";
import DoctorDetails from "../pages/Doctors/DoctorDetails";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import MyAppointments from "../Dashboard/user-account/MyBookings.jsx";
import DoctorDashboard from "../Dashboard/doctor-account/Dashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/doctors" replace />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute allowedRoles={["PATIENT", "patient"]}>
            <MyAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["DOCTOR", "doctor"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/doctors" replace />} />
    </Routes>
  );
};

export default Routers;
