
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const MODULES = [
  {
    path: "/employees",
    icon: "👥",
    title: "Employees",
    text: "Add, update and manage employees.",
  },
  {
    path: "/departments",
    icon: "🏢",
    title: "Departments",
    text: "Manage company departments.",
  },
  {
    path: "/salaries",
    icon: "💰",
    title: "Salary",
    text: "Manage employee salary information.",
  },
  {
    path: "/attendance",
    icon: "📅",
    title: "Attendance",
    text: "Manage employee attendance.",
  },
  {
    path: "/admin-leaves",
    icon: "🏖️",
    title: "Leave Management",
    text: "View, approve and reject employee leave applications.",
  },
  {
    path: "/payroll",
    icon: "🧾",
    title: "Payroll",
    text: "Process monthly employee payroll.",
  },
  {
    path: "/payslips",
    icon: "📄",
    title: "Payslips",
    text: "View and manage generated payslips.",
  },
];

const STAT_CARDS = [
  { key: "total_employees", icon: "👥", label: "Total Employees" },
  { key: "total_departments", icon: "🏢", label: "Departments" },
  { key: "payroll_this_month", icon: "🧾", label: "Payroll This Month" },
  { key: "payslips_generated", icon: "📄", label: "Payslips Generated" },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get("/dashboard/stats/");
        setStats(response.data);
      } catch (error) {
        console.error("Unable to load dashboard stats:", error);
      }
    };

    loadStats();
  }, []);

  const username = user?.username || "Admin";

  return (
    <main className="page-content">

      <div className="welcome-banner">
        <h2>Welcome, {username}</h2>

        <p>
          Manage employees, departments, salary, attendance,
          leave applications, payroll and payslips.
        </p>
      </div>

      <div className="stats-grid">

        {STAT_CARDS.map((card) => (
          <div key={card.key} className="stat-card">

            <div className="stat-icon">
              {card.icon}
            </div>

            <div>
              <div className="stat-number">
                {stats ? stats[card.key] : "-"}
              </div>

              <div className="stat-label">
                {card.label}
              </div>
            </div>

          </div>
        ))}

      </div>

      <h3 className="section-title">
        Modules
      </h3>

      <div className="dashboard-grid">

        {MODULES.map((module) => (
          <div
            key={module.path}
            className="dashboard-card"
            onClick={() => navigate(module.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                navigate(module.path);
              }
            }}
          >
            <div className="card-icon">
              {module.icon}
            </div>

            <h3>{module.title}</h3>

            <p>{module.text}</p>
          </div>
        ))}

      </div>

    </main>
  );
}

export default AdminDashboard;
