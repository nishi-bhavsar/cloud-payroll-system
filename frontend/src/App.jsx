
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import Departments from "./pages/admin/Departments";
import SalaryManagement from "./pages/admin/SalaryManagement";
import AttendanceManagement from "./pages/admin/AttendanceManagement";
import PayrollManagement from "./pages/admin/PayrollManagement";
import PayslipManagement from "./pages/admin/PayslipManagement";
import AdminLeaves from "./pages/admin/AdminLeaves";

// Employee pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import MyProfile from "./pages/employee/MyProfile";
import MyAttendance from "./pages/employee/MyAttendance";
import MySalary from "./pages/employee/MySalary";
import MyPayroll from "./pages/employee/MyPayroll";
import MyPayslips from "./pages/employee/MyPayslips";
import MyLeaves from "./pages/employee/MyLeaves";

// Manager pages
import ManagerLeaves from "./pages/manager/ManagerLeaves";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Login />} />

        {/* ADMIN ROUTES */}
        <Route
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AppLayout role="ADMIN" />
            </ProtectedRoute>
          }
        >
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/salaries" element={<SalaryManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/payslips" element={<PayslipManagement />} />
          <Route path="/admin-leaves" element={<AdminLeaves />} />
        </Route>

        {/* MANAGER ROUTES */}
        <Route
          element={
            <ProtectedRoute allowedRole="MANAGER">
              <AppLayout role="MANAGER" />
            </ProtectedRoute>
          }
        >
          <Route path="/manager-dashboard" element={<ManagerLeaves />} />
          <Route path="/manager-leaves" element={<ManagerLeaves />} />
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route
          element={
            <ProtectedRoute allowedRole="EMPLOYEE">
              <AppLayout role="EMPLOYEE" />
            </ProtectedRoute>
          }
        >
          <Route
            path="/employee-dashboard"
            element={<EmployeeDashboard />}
          />

          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
          <Route path="/my-salary" element={<MySalary />} />
          <Route path="/my-payroll" element={<MyPayroll />} />
          <Route path="/my-payslips" element={<MyPayslips />} />
          <Route path="/my-leaves" element={<MyLeaves />} />
        </Route>

        {/* INVALID ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
