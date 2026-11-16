
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function SalaryManagement() {
  const navigate = useNavigate();

  const initialForm = {
    employee: "",
    basic_salary: "",
    allowance: "0",
    bonus: "0",
    deduction: "0",
    effective_from: "",
  };

  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [salaryResponse, employeeResponse] =
        await Promise.all([
          api.get("/salaries/"),
          api.get("/employees/"),
        ]);

      const salaryData = Array.isArray(salaryResponse.data)
        ? salaryResponse.data
        : salaryResponse.data.results || [];

      const employeeData = Array.isArray(employeeResponse.data)
        ? employeeResponse.data
        : employeeResponse.data.results || [];

      setSalaries(salaryData);
      setEmployees(employeeData);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load salary records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setWorking(true);
      setError("");
      setMessage("");

      const payload = {
        employee: Number(form.employee),
        basic_salary: form.basic_salary,
        allowance: form.allowance || "0",
        bonus: form.bonus || "0",
        deduction: form.deduction || "0",
        effective_from: form.effective_from,
      };

      if (editingId !== null) {
        await api.put(`/salaries/${editingId}/`, payload);
        setMessage("Salary updated successfully.");
      } else {
        await api.post("/salaries/", payload);
        setMessage("Salary added successfully.");
      }

      resetForm();
      await fetchData();
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
          : "Unable to save salary."
      );
    } finally {
      setWorking(false);
    }
  };

  const handleEdit = (salary) => {
    setEditingId(salary.id);

    setForm({
      employee: String(salary.employee),
      basic_salary: String(salary.basic_salary),
      allowance: String(salary.allowance ?? 0),
      bonus: String(salary.bonus ?? 0),
      deduction: String(salary.deduction ?? 0),
      effective_from: salary.effective_from || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (salary) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this salary record?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/salaries/${salary.id}/`);

      setMessage("Salary deleted successfully.");

      if (editingId === salary.id) {
        resetForm();
      }

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete salary record."
      );
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(
      (item) => item.id === Number(employeeId)
    );

    if (!employee) return `Employee #${employeeId}`;

    return `${employee.first_name} ${employee.last_name}`;
  };

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="module-header">
        <div>
          <h1>Salary Management</h1>
          <p>Add, edit and delete employee salary records.</p>
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

      {/* ADD / EDIT FORM */}

      <div className="module-card">

        <h2>
          {editingId !== null
            ? "Edit Salary"
            : "Add New Salary"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Employee</label>

            <select
              name="employee"
              value={form.employee}
              onChange={handleChange}
              required
            >
              <option value="">Select Employee</option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.employee_code} - {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Basic Salary (₹)</label>

            <input
              type="number"
              name="basic_salary"
              value={form.basic_salary}
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Effective From</label>

            <input
              type="date"
              name="effective_from"
              value={form.effective_from}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="action-button"
            disabled={working}
          >
            {working
              ? "Saving..."
              : editingId !== null
                ? "Update Salary"
                : "Add Salary"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="back-button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          )}

        </form>
      </div>

      {/* SALARY TABLE */}

      <div
        className="module-card"
        style={{ marginTop: "20px" }}
      >

        <h2>Salary Records</h2>

        {loading ? (
          <p>Loading salaries...</p>
        ) : salaries.length === 0 ? (
          <div className="empty-state">
            <p>No salary records found.</p>
          </div>
        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic Salary</th>
                  <th>Allowance</th>
                  <th>Bonus</th>
                  <th>Deduction</th>
                  <th>Effective From</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {salaries.map((item) => (
                  <tr key={item.id}>

                    <td>
                      {getEmployeeName(item.employee)}
                    </td>

                    <td>₹ {formatMoney(item.basic_salary)}</td>

                    <td>₹ {formatMoney(item.allowance)}</td>

                    <td>₹ {formatMoney(item.bonus)}</td>

                    <td>₹ {formatMoney(item.deduction)}</td>

                    <td>{item.effective_from || "—"}</td>

                    <td>
                      <button
                        type="button"
                        className="action-button"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => handleDelete(item)}
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
        )}

      </div>

    </div>
  );
}

export default SalaryManagement;
