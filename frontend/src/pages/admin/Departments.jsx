
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Departments() {
  const navigate = useNavigate();

  const initialForm = {
    name: "",
    code: "",
    description: "",
    manager: "",
    status: "ACTIVE",
  };

  const [departments, setDepartments] = useState([]);
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

      const [departmentResponse, employeeResponse] =
        await Promise.all([
          api.get("/departments/"),
          api.get("/employees/"),
        ]);

      const departmentData = Array.isArray(departmentResponse.data)
        ? departmentResponse.data
        : departmentResponse.data.results || [];

      const employeeData = Array.isArray(employeeResponse.data)
        ? employeeResponse.data
        : employeeResponse.data.results || [];

      setDepartments(departmentData);
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
        "Unable to load departments."
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
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description,
        manager: form.manager ? Number(form.manager) : null,
        status: form.status,
      };

      if (editingId !== null) {
        await api.put(`/departments/${editingId}/`, payload);
        setMessage("Department updated successfully.");
      } else {
        await api.post("/departments/", payload);
        setMessage("Department added successfully.");
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
          : "Unable to save department."
      );
    } finally {
      setWorking(false);
    }
  };

  const handleEdit = (department) => {
    setEditingId(department.id);

    setForm({
      name: department.name || "",
      code: department.code || "",
      description: department.description || "",
      manager: department.manager
        ? String(department.manager)
        : "",
      status: department.status || "ACTIVE",
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${department.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/departments/${department.id}/`);

      setMessage("Department deleted successfully.");

      if (editingId === department.id) {
        resetForm();
      }

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete department."
      );
    }
  };

  const getManagerName = (managerId) => {
    if (!managerId) return "Not Assigned";

    const manager = employees.find(
      (employee) => employee.id === Number(managerId)
    );

    if (!manager) return "Manager not found";

    return `${manager.first_name || ""} ${manager.last_name || ""}`.trim();
  };

  return (
    <div className="module-page">

      {/* HEADER */}

      <div className="module-header">
        <div>
          <h1>Department Management</h1>
          <p>Add, edit and manage company departments.</p>
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
            ? "Edit Department"
            : "Add New Department"}
        </h2>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Department Name</label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter department name"
              required
            />
          </div>

          <div className="form-group">
            <label>Department Code</label>

            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Example: HR, IT, FIN"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter department description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Department Manager</label>

            <select
              name="manager"
              value={form.manager}
              onChange={handleChange}
            >
              <option value="">No Manager Assigned</option>

              {employees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.first_name} {employee.last_name}
                  {" - "}
                  {employee.employee_code}
                </option>
              ))}
            </select>
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

          <button
            type="submit"
            className="action-button"
            disabled={working}
          >
            {working
              ? "Saving..."
              : editingId !== null
                ? "Update Department"
                : "Add Department"}
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

      {/* DEPARTMENT TABLE */}

      <div
        className="module-card"
        style={{ marginTop: "20px" }}
      >

        <h2>Department List</h2>

        {loading ? (
          <p>Loading departments...</p>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <p>No departments found.</p>
          </div>
        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {departments.map((item) => (
                  <tr key={item.id}>

                    <td>{item.name}</td>

                    <td>{item.code}</td>

                    <td>{getManagerName(item.manager)}</td>

                    <td>{item.status}</td>

                    <td>{item.description || "—"}</td>

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

export default Departments;
