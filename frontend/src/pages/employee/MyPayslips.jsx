import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

function MyPayslips() {
  const navigate = useNavigate();

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        const response = await api.get("/payslips/");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setPayslips(data);
      } catch (error) {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        setError(
          error.response?.data?.detail ||
            "Unable to load payslips."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayslips();
  }, [navigate]);

  const openPayslip = (url) => {
    if (!url) {
      return;
    }

    // Backend returns "/media/..." so add the backend address
    const fullUrl = url.startsWith("http")
      ? url
      : `${BACKEND_ORIGIN}${url}`;

    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1>My Payslips</h1>
          <p>View and download your payslips.</p>
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
          <h2>Loading payslips...</h2>
        </div>
      )}

      {!loading && error && (
        <div className="error-message">{error}</div>
      )}

      {!loading && !error && (
        <div className="module-card">
          <h2>Payslip History</h2>

          {payslips.length === 0 ? (
            <div className="empty-state">
              <p>No payslips found.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payslip ID</th>
                    <th>Payroll</th>
                    <th>Generated At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {payslips.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{item.id || "—"}</td>

                      <td>
                        {typeof item.payroll === "object"
                          ? item.payroll?.id || "—"
                          : item.payroll || "—"}
                      </td>

                      <td>
                        {item.generated_at
                          ? new Date(
                              item.generated_at
                            ).toLocaleString("en-IN")
                          : "—"}
                      </td>

                      <td>
                        <button
                          className="action-button"
                          onClick={() =>
                            openPayslip(item.file_url)
                          }
                          disabled={!item.file_url}
                        >
                          View Payslip
                        </button>
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

export default MyPayslips;