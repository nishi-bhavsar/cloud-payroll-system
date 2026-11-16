
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/employees/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.value || response.data.results || [];

      setEmployees(data);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [navigate]);

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>Employees</h1>
          <p>Manage company employees.</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/admin-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {loading && (
        <div className="module-card">
          <h2>Loading employees...</h2>
        </div>
      )}

      {!loading && error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="module-card">
          <h2>Employee List</h2>

          {employees.length === 0 ? (
            <div className="empty-state">
              <p>No employees found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Joining Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((item) => (
                    <tr key={item.id}>
                      <td>{item.employee_code || "—"}</td>

                      <td>
                        {`${item.first_name || ""} ${
                          item.last_name || ""
                        }`.trim() || "—"}
                      </td>

                      <td>{item.email || "—"}</td>

                      <td>{item.phone || "—"}</td>

                      <td>{item.department_name || "—"}</td>

                      <td>{item.designation || "—"}</td>

                      <td>{item.joining_date || "—"}</td>

                      <td>{item.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Employees;