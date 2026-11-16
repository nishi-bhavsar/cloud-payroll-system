
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function AttendanceManagement() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    employee: "",
    date: "",
    status: "PRESENT",
  };

  const [form, setForm] = useState(initialForm);

  // Fetch attendance and employees
  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [attendanceResponse, employeeResponse] =
        await Promise.all([
          api.get("/attendance/"),
          api.get("/employees/"),
        ]);

      const attendanceData = Array.isArray(attendanceResponse.data)
        ? attendanceResponse.data
        : attendanceResponse.data.results || [];

      const employeeData = Array.isArray(employeeResponse.data)
        ? employeeResponse.data
        : employeeResponse.data.results || [];

      setAttendance(attendanceData);
      setEmployees(employeeData);

      setError("");

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/", { replace: true });
        return;
      }

      setError(
        err.response?.data?.detail ||
        "Unable to load attendance records."
      );

    } finally {
      if (showLoader) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();

    // Automatically refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Format date and time
  const formatTime = (value) => {
    if (!value) return "Not punched";

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate working hours
  const getWorkingHours = (item) => {
    if (!item.check_in || !item.check_out) {
      return item.check_in ? "In Progress" : "—";
    }

    const seconds = Math.floor(
      (
        new Date(item.check_out) -
        new Date(item.check_in)
      ) / 1000
    );

    if (seconds < 0) return "Invalid";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setMessage("");
  };

  // Add or update attendance
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.employee || !form.date || !form.status) {
      setError("Please fill all attendance fields.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      setMessage("");

      const payload = {
        employee: Number(form.employee),
        date: form.date,
        status: form.status,
      };

      if (editingId) {
        await api.put(`/attendance/${editingId}/`, payload);
        setMessage("Attendance updated successfully.");
      } else {
        await api.post("/attendance/", payload);
        setMessage("Attendance added successfully.");
      }

      resetForm();
      await fetchData(false);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        "Unable to save attendance."
      );

    } finally {
      setWorking(false);
    }
  };

  // Edit attendance
  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      employee: String(item.employee),
      date: item.date,
      status: item.status,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete attendance
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/attendance/${item.id}/`);

      setMessage("Attendance deleted successfully.");

      if (editingId === item.id) {
        resetForm();
      }

      await fetchData(false);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete attendance."
      );
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(
      (emp) => emp.id === Number(employeeId)
    );

    if (!employee) return `Employee #${employeeId}`;

    return `${employee.first_name} ${employee.last_name}`;
  };

  // Dashboard statistics
  const today = new Date().toLocaleDateString("en-CA");

  const todayAttendance = attendance.filter(
    (item) => item.date === today
  );

  const presentCount = todayAttendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const completedCount = todayAttendance.filter(
    (item) => item.check_in && item.check_out
  ).length;

  const inProgressCount = todayAttendance.filter(
    (item) => item.check_in && !item.check_out
  ).length;

  return (
    <div className="module-page">

      <div className="module-header">
        <div>
          <h1>Attendance Management</h1>
          <p>
            Monitor employee attendance and working hours.
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
        <div className="error-message">{error}</div>
      )}

      {message && (
        <div className="success-message">{message}</div>
      )}

      {/* TODAY'S STATISTICS */}

      <div className="module-card">

        <h2>Today's Attendance Overview</h2>

        <p>Date: {today}</p>

        <div className="attendance-admin-stats">

          <div className="attendance-stat">
            <h3>{employees.length}</h3>
            <p>Total Employees</p>
          </div>

          <div className="attendance-stat">
            <h3>{presentCount}</h3>
            <p>Present</p>
          </div>

          <div className="attendance-stat">
            <h3>{inProgressCount}</h3>
            <p>Currently Working</p>
          </div>

          <div className="attendance-stat">
            <h3>{completedCount}</h3>
            <p>Completed</p>
          </div>

        </div>

        <p className="attendance-refresh-note">
          <span className="live-dot"></span>
          Automatically refreshing every 30 seconds
        </p>

      </div>

      {/* ADD / EDIT FORM */}

      <div className="module-card">

        <h2>
          {editingId ? "Edit Attendance" : "Add New Attendance"}
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

              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} - {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date</label>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Attendance Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>

          <button
            type="submit"
            className="action-button"
            disabled={working}
          >
            {working
              ? "Saving..."
              : editingId
                ? "Update Attendance"
                : "Add Attendance"}
          </button>

          {editingId && (
            <button
              type="button"
              className="back-button"
              onClick={resetForm}
              style={{ marginLeft: "10px" }}
            >
              Cancel Edit
            </button>
          )}

        </form>
      </div>

      {/* ATTENDANCE TABLE */}

      <div className="module-card" style={{ marginTop: "20px" }}>

        <h2>Employee Attendance Records</h2>

        {loading ? (
          <p>Loading attendance...</p>
        ) : attendance.length === 0 ? (
          <div className="empty-state">
            <p>No attendance records found.</p>
          </div>
        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {attendance.map((item) => (
                  <tr key={item.id}>

                    <td>
                      {getEmployeeName(item.employee)}
                    </td>

                    <td>{item.date}</td>

                    <td>
                      {formatTime(item.check_in)}
                    </td>

                    <td>
                      {formatTime(item.check_out)}
                    </td>

                    <td>
                      {getWorkingHours(item)}
                    </td>

                    <td>
                      <span
                        className={`status-badge status-${String(
                          item.status
                        ).toLowerCase()}`}
                      >
                        {item.status}
                      </span>
                    </td>

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

export default AttendanceManagement;
