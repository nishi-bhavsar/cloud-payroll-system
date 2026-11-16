
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LINKS = [
  {
    path: "/my-profile",
    icon: "👤",
    title: "My Profile",
    text: "View your employee profile.",
  },
  {
    path: "/my-attendance",
    icon: "📅",
    title: "My Attendance",
    text: "View your attendance records.",
  },
  {
    path: "/my-leaves",
    icon: "🏖️",
    title: "Apply for Leave",
    text: "Apply for leave, check your balance and track requests.",
  },
  {
    path: "/my-salary",
    icon: "💰",
    title: "My Salary",
    text: "View salary information.",
  },
  {
    path: "/my-payroll",
    icon: "🧾",
    title: "My Payroll",
    text: "View monthly payroll history.",
  },
  {
    path: "/my-payslips",
    icon: "📄",
    title: "My Payslips",
    text: "View and download payslips.",
  },
];

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Unable to read stored user:", error);
      }
    }
  }, []);

  const username = user?.username || "Employee";

  return (
    <main className="page-content">

      <div className="welcome-banner">
        <h2>Welcome, {username}</h2>

        <p>
          Manage your profile, attendance, leave applications,
          salary, payroll and payslips.
        </p>
      </div>

      <h3 className="section-title">
        Quick Access
      </h3>

      <div className="dashboard-grid">

        {LINKS.map((link) => (
          <div
            key={link.path}
            className="dashboard-card"
            onClick={() => navigate(link.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                navigate(link.path);
              }
            }}
          >
            <div className="card-icon">
              {link.icon}
            </div>

            <h3>{link.title}</h3>

            <p>{link.text}</p>
          </div>
        ))}

      </div>

    </main>
  );
}

export default EmployeeDashboard;
