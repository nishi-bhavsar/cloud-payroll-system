
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Employees() {
  const navigate = useNavigate();

  const initialForm = {
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    joining_date: "",
    status: "ACTIVE",
    username: "",
    password: "",
    confirmPassword: "",
  };

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, departmentResponse] =
        await Promise.all([
          api.get("/employees/"),
          api.get("/departments/"),
        ]);

      const employeeData = Array.isArray(employeeResponse.data)
        ? employeeResponse.data
        : employeeResponse.data.results || [];

      const departmentData = Array.isArray(departmentResponse.data)
        ? departmentResponse.data
        : departmentResponse.data.results || [];

      setEmployees(employeeData);
      setDepartments(departmentData);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load employee records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

      if (editingId === null) {
        if (!form.username.trim()) {
          setError("Please enter a login username.");
          return;
        }

        if (!form.password) {
          setError("Please enter a login password.");
          return;
        }

        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
      }

      const payload = {
        employee_code: form.employee_code,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        department: form.department
          ? Number(form.department)
          : null,
        designation: form.designation,
        joining_date: form.joining_date,
        status: form.status,
      };

      if (editingId !== null) {
        await api.put(`/employees/${editingId}/`, payload);
        setMessage("Employee updated successfully.");
      } else {
        payload.username = form.username.trim();
        payload.password = form.password;

        await api.post("/employees/", payload);

        setMessage(
          "Employee and login account created successfully!"
        );
      }

      setForm(initialForm);
      setEditingId(null);

      await fetchEmployees();
    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      if (typeof data === "object" && data !== null) {
        setError(
          Object.entries(data)
            .map(([key, value]) =>
              `${key}: ${
                Array.isArray(value)
                  ? value.join(", ")
                  : typeof value === "object"
                    ? JSON.stringify(value)
                    : value
              }`
            )
            .join(" | ")
        );
      } else {
        setError("Unable to save employee.");
      }
    } finally {
      setWorking(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);

    setForm({
      ...initialForm,
      employee_code: employee.employee_code || "",
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department
        ? String(employee.department)
        : "",
      designation: employee.designation || "",
      joining_date: employee.joining_date || "",
      status: employee.status || "ACTIVE",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/employees/${employee.id}/`);

      setMessage("Employee deleted successfully.");

      if (editingId === employee.id) {
        resetForm();
      }

      await fetchEmployees();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete employee."
      );
    }
  };

  return (
    <div className="module-page">

      <div className="module-header">
        <div>
          <h1>Employee Management</h1>
          <p>
            Add, edit, delete and manage employee accounts.
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

      <div className="module-card">

        <h2>
          {editingId !== null
            ? "Edit Employee"
            : "Add New Employee"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Employee Code</label>
            <input
              type="text"
              name="employee_code"
              value={form.employee_code}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department</label>

            <select
              name="department"
              value={form.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Joining Date</label>
            <input
              type="date"
              name="joining_date"
              value={form.joining_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {editingId === null && (
            <>
              <hr />

              <h3>Employee Login Credentials</h3>

              <p>
                Create login details for this employee.
              </p>

              <div className="form-group">
                <label>Login Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label>Login Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="action-button"
            disabled={working}
          >
            {working
              ? "Saving..."
              : editingId !== null
                ? "Update Employee"
                : "Create Employee & Login"}
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

      <div
        className="module-card"
        style={{ marginTop: "20px" }}
      >

        <h2>Employee List</h2>

        {loading ? (
          <p>Loading employees...</p>
        ) : employees.length === 0 ? (
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((item) => (
                  <tr key={item.id}>

                    <td>{item.employee_code || "—"}</td>

                    <td>
                      {`${item.first_name || ""} ${item.last_name || ""}`.trim()}
                    </td>

                    <td>{item.email || "—"}</td>

                    <td>{item.phone || "—"}</td>

                    <td>{item.department_name || "—"}</td>

                    <td>{item.designation || "—"}</td>

                    <td>{item.joining_date || "—"}</td>

                    <td>{item.status || "—"}</td>

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

export default Employees;
