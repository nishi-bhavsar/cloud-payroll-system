
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function MyPayroll() {
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const response = await api.get("/payroll/");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setPayroll(data);
      } catch (error) {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        setError(
          error.response?.data?.detail ||
          "Unable to load payroll records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [navigate]);

  const formatAmount = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>My Payroll</h1>
          <p>View your monthly payroll history.</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/employee-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {loading && (
        <div className="module-card">
          <h2>Loading payroll...</h2>
        </div>
      )}

      {!loading && error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="module-card">
          <h2>Payroll History</h2>

          {payroll.length === 0 ? (
            <div className="empty-state">
              <p>No payroll records found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Basic Salary</th>
                    <th>Allowance</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Gross Salary</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {payroll.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.month || "—"}</td>
                      <td>{item.year || "—"}</td>
                      <td>{formatAmount(item.basic_salary)}</td>
                      <td>{formatAmount(item.allowance)}</td>
                      <td>{formatAmount(item.bonus)}</td>
                      <td>{formatAmount(item.deduction)}</td>
                      <td>{formatAmount(item.gross_salary)}</td>
                      <td>
                        <strong>
                          {formatAmount(item.net_salary)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${String(
                            item.status || ""
                          ).toLowerCase()}`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
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

export default MyPayroll;
