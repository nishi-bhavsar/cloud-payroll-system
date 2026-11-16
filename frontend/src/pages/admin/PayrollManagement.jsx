
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const rupees = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function PayrollManagement() {
  const navigate = useNavigate();

  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [payrolls, setPayrolls] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    basic_salary: "",
    allowance: "0",
    bonus: "0",
    deduction: "0",
  });

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const years = [
    today.getFullYear() - 2,
    today.getFullYear() - 1,
    today.getFullYear(),
    today.getFullYear() + 1,
  ];

  const loadData = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/payroll/", {
        params: { month, year },
      });

      setPayrolls(toList(response.data));
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load payroll."
      );
    } finally {
      setLoading(false);
    }
  }, [month, year, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetEdit = () => {
    setEditingId(null);

    setForm({
      basic_salary: "",
      allowance: "0",
      bonus: "0",
      deduction: "0",
    });
  };

  const startEdit = (item) => {
    if (item.status === "PROCESSED") {
      setError(
        "Processed payroll cannot be edited from this screen. Handle corrections through an authorized payroll adjustment."
      );
      return;
    }

    setEditingId(item.id);

    setForm({
      basic_salary: String(item.basic_salary),
      allowance: String(item.allowance ?? 0),
      bonus: String(item.bonus ?? 0),
      deduction: String(item.deduction ?? 0),
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const updatePayroll = async (e) => {
    e.preventDefault();

    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const payload = {
        basic_salary: form.basic_salary,
        allowance: form.allowance || "0",
        bonus: form.bonus || "0",
        deduction: form.deduction || "0",
      };

      await api.patch(`/payroll/${editingId}/`, payload);

      setSuccess(
        "Payroll updated successfully. Gross and net salary recalculated."
      );

      resetEdit();

      await loadData();
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      setError(
        typeof data === "object"
          ? Object.entries(data)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join(" | ")
          : "Unable to update payroll."
      );
    } finally {
      setWorking(false);
    }
  };

  const generatePayroll = async () => {
    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const response = await api.post("/payroll/generate/", {
        month,
        year,
      });

      const { created, skipped_existing, skipped_no_salary } =
        response.data;

      let message = `${created} payroll record(s) created for ${MONTHS[month - 1]} ${year}.`;

      if (skipped_existing?.length > 0) {
        message += ` ${skipped_existing.length} already existed.`;
      }

      if (skipped_no_salary?.length > 0) {
        message += ` No salary found for: ${skipped_no_salary.join(", ")}.`;
      }

      setSuccess(message);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data || "Payroll generation failed.")
      );
    } finally {
      setWorking(false);
    }
  };

  const deletePayroll = async (item) => {
    const warning =
      item.status === "PROCESSED"
        ? "This payroll's payslip may also be deleted. Continue?"
        : "Are you sure you want to delete this payroll record?";

    if (!window.confirm(warning)) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/payroll/${item.id}/`);

      if (editingId === item.id) {
        resetEdit();
      }

      setSuccess("Payroll deleted successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Payroll deletion failed."
      );
    }
  };

  const totalNet = payrolls.reduce(
    (sum, item) => sum + Number(item.net_salary || 0),
    0
  );

  return (
    <div className="module-page">

      <div className="module-header">
        <div>
          <h1>Payroll Management</h1>
          <p>Generate and manage monthly employee payroll.</p>
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

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* EDIT PAYROLL FORM */}

      {editingId !== null && (
        <div className="module-card">

          <h2>Edit Payroll</h2>

          <p>
            Update salary components. Gross and net salary
            will be calculated by the backend.
          </p>

          <form onSubmit={updatePayroll}>

            <div className="form-group">
              <label>Basic Salary (₹)</label>

              <input
                type="number"
                name="basic_salary"
                value={form.basic_salary}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Allowance (₹)</label>

              <input
                type="number"
                name="allowance"
                value={form.allowance}
                onChange={handleFormChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Bonus (₹)</label>

              <input
                type="number"
                name="bonus"
                value={form.bonus}
                onChange={handleFormChange}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Deduction (₹)</label>

              <input
                type="number"
                name="deduction"
                value={form.deduction}
                onChange={handleFormChange}
                min="0"
                step="0.01"
              />
            </div>

            <button
              type="submit"
              className="action-button"
              disabled={working}
            >
              {working ? "Updating..." : "Update Payroll"}
            </button>

            <button
              type="button"
              className="back-button"
              onClick={resetEdit}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>

          </form>
        </div>
      )}

      {/* MONTH SELECTION */}

      <div className="module-card" style={{ marginTop: 20 }}>

        <h2>Select Month</h2>

        <div className="inline-form">

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            className="action-button"
            onClick={generatePayroll}
            disabled={working}
          >
            {working ? "Generating..." : "Generate Payroll"}
          </button>

        </div>
      </div>

      {/* PAYROLL TABLE */}

      <div className="module-card" style={{ marginTop: 20 }}>

        <h2>
          Payroll — {MONTHS[month - 1]} {year}
        </h2>

        {loading ? (
          <p>Loading payroll...</p>
        ) : payrolls.length === 0 ? (
          <div className="empty-state">
            <p>No payroll records found for this month.</p>
          </div>
        ) : (
          <>
            <p>
              Total employees: <strong>{payrolls.length}</strong>
              {" | "}
              Total net payout: <strong>{rupees(totalNet)}</strong>
            </p>

            <div className="table-container">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic</th>
                    <th>Allowance</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>Gross</th>
                    <th>Net</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {payrolls.map((item) => (
                    <tr key={item.id}>

                      <td>
                        {item.employee_name}
                        <br />
                        <small>{item.employee_code}</small>
                      </td>

                      <td>{rupees(item.basic_salary)}</td>
                      <td>{rupees(item.allowance)}</td>
                      <td>{rupees(item.bonus)}</td>
                      <td>{rupees(item.deduction)}</td>
                      <td>{rupees(item.gross_salary)}</td>

                      <td>
                        <strong>{rupees(item.net_salary)}</strong>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            item.status === "PROCESSED"
                              ? "status-done"
                              : "status-pending"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="action-button"
                          disabled={item.status === "PROCESSED"}
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => deletePayroll(item)}
                          style={{ marginLeft: "8px" }}
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          </>
        )}

      </div>

    </div>
  );
}

export default PayrollManagement;
