
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const fullUrl = (url) => {
  if (!url) return "";
  return url.startsWith("http")
    ? url
    : `${BACKEND_ORIGIN}${url}`;
};

const toList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

function PayslipManagement() {
  const navigate = useNavigate();

  const [payrolls, setPayrolls] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [payrollResponse, payslipResponse] =
        await Promise.all([
          api.get("/payroll/"),
          api.get("/payslips/"),
        ]);

      setPayrolls(toList(payrollResponse.data));
      setPayslips(toList(payslipResponse.data));

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load payslip records."
      );

    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const payslipFor = (payrollId) =>
    payslips.find(
      (item) => Number(item.payroll) === Number(payrollId)
    );

  // GENERATE PAYSLIP

  const handleGenerate = async (payrollId) => {
    try {
      setWorkingId(payrollId);
      setError("");
      setMessage("");

      await api.post("/payslips/", {
        payroll: payrollId,
      });

      setMessage("Payslip generated successfully.");

      await fetchData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data || "Unable to generate payslip.")
      );

    } finally {
      setWorkingId(null);
    }
  };

  // VIEW PAYSLIP

  const handleView = (slip) => {
    if (!slip.file_url) {
      setError("Payslip PDF file is not available.");
      return;
    }

    window.open(
      fullUrl(slip.file_url),
      "_blank",
      "noopener,noreferrer"
    );
  };

  // DOWNLOAD PAYSLIP

  const handleDownload = (slip) => {
    if (!slip.file_url) {
      setError("Payslip PDF file is not available.");
      return;
    }

    const link = document.createElement("a");

    link.href = fullUrl(slip.file_url);
    link.download = `Payslip_${slip.employee_code}_${slip.month}_${slip.year}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DELETE PAYSLIP

  const handleDelete = async (slip) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the payslip for ${slip.employee_name}?`
    );

    if (!confirmed) return;

    try {
      setWorkingId(slip.payroll);
      setError("");
      setMessage("");

      await api.delete(`/payslips/${slip.id}/`);

      setMessage("Payslip deleted successfully.");

      await fetchData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete payslip."
      );

    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="module-header">
        <div>
          <h1>Payslip Management</h1>

          <p>
            Generate, view, download and manage employee payslips.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/admin-dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* PAYROLL RECORDS */}

      <div className="module-card">

        <h2>Payroll Records</h2>

        {loading ? (
          <p>Loading payslips...</p>
        ) : payrolls.length === 0 ? (
          <div className="empty-state">
            <p>No payroll records found. Generate payroll first.</p>
          </div>
        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Net Salary</th>
                  <th>Payslip Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {payrolls.map((item) => {
                  const slip = payslipFor(item.id);

                  const isWorking = workingId === item.id;

                  return (
                    <tr key={item.id}>

                      <td>
                        {item.employee_name || item.employee}
                      </td>

                      <td>{item.employee_code || "—"}</td>

                      <td>{item.month}</td>

                      <td>{item.year}</td>

                      <td>
                        ₹ {Number(
                          item.net_salary || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        {slip ? (
                          <span className="status-badge status-done">
                            Generated
                          </span>
                        ) : (
                          <span className="status-badge status-pending">
                            Not Generated
                          </span>
                        )}
                      </td>

                      <td>

                        {slip ? (
                          <>
                            <button
                              type="button"
                              className="action-button"
                              onClick={() => handleView(slip)}
                              disabled={isWorking}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className="action-button"
                              onClick={() => handleDownload(slip)}
                              disabled={isWorking}
                              style={{ marginLeft: "6px" }}
                            >
                              Download
                            </button>

                            <button
                              type="button"
                              className="danger-button"
                              onClick={() => handleDelete(slip)}
                              disabled={isWorking}
                              style={{ marginLeft: "6px" }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => handleGenerate(item.id)}
                            disabled={workingId !== null}
                          >
                            {isWorking
                              ? "Generating..."
                              : "Generate Payslip"}
                          </button>
                        )}

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default PayslipManagement;
