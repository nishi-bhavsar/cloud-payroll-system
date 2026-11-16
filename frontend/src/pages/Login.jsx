
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // 1. Authenticate and receive JWT tokens.
      const loginResponse = await api.post("/auth/login/", {
        username: username.trim(),
        password,
      });

      const { access, refresh } = loginResponse.data || {};

      if (!access) {
        setError("Login failed. No access token was received.");
        return;
      }

      localStorage.setItem("access", access);

      if (refresh) {
        localStorage.setItem("refresh", refresh);
      }

      // 2. Fetch authenticated user details.
      const meResponse = await api.get("/auth/me/");
      const data = meResponse.data;

      const role = String(data?.role || "")
        .trim()
        .toUpperCase();

      // 3. Support all three roles.
      const dashboardRoutes = {
        ADMIN: "/admin-dashboard",
        MANAGER: "/manager-dashboard",
        EMPLOYEE: "/employee-dashboard",
      };

      if (!dashboardRoutes[role]) {
        localStorage.clear();

        setError(
          "Your account does not have a recognized application role."
        );

        return;
      }

      // 4. Save user information.
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(data));

      // 5. Redirect to the correct dashboard.
      navigate(dashboardRoutes[role], {
        replace: true,
      });

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      localStorage.clear();

      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid username or password.");
        } else if (err.response.data?.detail) {
          setError(err.response.data.detail);
        } else {
          setError("Login failed. Please try again.");
        }
      } else {
        setError(
          "Cannot reach the server. Please check that the backend is running."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <aside className="login-brand">
        <div className="login-brand-logo">💼</div>

        <h1>Cloud Payroll System</h1>

        <p>
          Manage employees, attendance, salaries and payslips
          from one secure place.
        </p>

        <ul className="login-features">
          <li>Role-based access for Admin, Manager and Employee</li>
          <li>Automatic payroll calculation</li>
          <li>Downloadable PDF payslips</li>
          <li>Complete Leave Management</li>
        </ul>
      </aside>

      <main className="login-panel">
        <div className="login-card">

          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to your account
          </p>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label htmlFor="username">Username</label>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
