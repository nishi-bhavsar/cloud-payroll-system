
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

const NAV = {
  ADMIN: {
    home: "/admin-dashboard",
    section: "Management",
    roleLabel: "Administrator",
    items: [
      { path: "/employees", icon: "👥", title: "Employees" },
      { path: "/departments", icon: "🏢", title: "Departments" },
      { path: "/salaries", icon: "💰", title: "Salary" },
      { path: "/attendance", icon: "📅", title: "Attendance" },
      { path: "/payroll", icon: "🧾", title: "Payroll" },
      { path: "/payslips", icon: "📄", title: "Payslips" },
      { path: "/admin-leaves", icon: "🏖️", title: "Leave Management" },
    ],
  },

  MANAGER: {
    home: "/manager-dashboard",
    section: "Team Management",
    roleLabel: "Manager",
    items: [
      { path: "/manager-leaves", icon: "🏖️", title: "Team Leave Requests" },
    ],
  },

  EMPLOYEE: {
    home: "/employee-dashboard",
    section: "My Account",
    roleLabel: "Employee",
    items: [
      { path: "/my-profile", icon: "👤", title: "My Profile" },
      { path: "/my-attendance", icon: "📅", title: "My Attendance" },
      { path: "/my-leaves", icon: "🏖️", title: "Apply for Leave" },
      { path: "/my-salary", icon: "💰", title: "My Salary" },
      { path: "/my-payroll", icon: "🧾", title: "My Payroll" },
      { path: "/my-payslips", icon: "📄", title: "My Payslips" },
    ],
  },
};

function AppLayout({ role = "ADMIN" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const config = NAV[role] || NAV.EMPLOYEE;

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const username = user?.username || config.roleLabel;

  const currentItem = config.items.find(
    (item) => item.path === location.pathname
  );

  const pageTitle = currentItem
    ? currentItem.title
    : "Dashboard";

  const linkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>

        <div className="sidebar-brand">
          <span className="sidebar-brand-logo">💼</span>
          Cloud Payroll
        </div>

        <nav className="sidebar-nav">

          <NavLink to={config.home} end className={linkClass}>
            <span className="sidebar-link-icon">🏠</span>
            Dashboard
          </NavLink>

          <div className="sidebar-section">
            {config.section}
          </div>

          {config.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={linkClass}
            >
              <span className="sidebar-link-icon">
                {item.icon}
              </span>
              {item.title}
            </NavLink>
          ))}

        </nav>
      </aside>

      <div className="app-main">

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="menu-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            <span className="topbar-title">
              {pageTitle}
            </span>

          </div>

          <div className="topbar-right">

            <div className="topbar-user">

              <span className="avatar">
                {username.charAt(0).toUpperCase()}
              </span>

              <div className="topbar-user-text">
                <div className="topbar-user-name">
                  {username}
                </div>

                <div className="topbar-user-role">
                  {config.roleLabel}
                </div>
              </div>

            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>

          </div>

        </header>

        <Outlet />

      </div>

    </div>
  );
}

export default AppLayout;
