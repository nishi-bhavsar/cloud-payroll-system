
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function MyAttendance() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = new Date().toLocaleDateString("en-CA");

  const todayRecord = attendance.find(
    (item) => item.date === today
  );

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await api.get("/attendance/");

      if (Array.isArray(response.data)) {
        setAttendance(response.data);
      } else if (Array.isArray(response.data.results)) {
        setAttendance(response.data.results);
      } else {
        setAttendance([]);
      }
    } catch (err) {
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
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePunch = async (type) => {
    setError("");
    setSuccess("");
    setActionLoading(true);

    try {
      const endpoint =
        type === "in"
          ? "/attendance/punch-in/"
          : "/attendance/punch-out/";

      const response = await api.post(endpoint, {});

      setSuccess(
        response.data.message ||
        `Punch ${type} successful!`
      );

      await fetchAttendance();

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Something went wrong. Please try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getWorkingHours = (item) => {
    if (!item?.check_in || !item?.check_out) {
      return "In Progress";
    }

    const seconds =
      (
        new Date(item.check_out) -
        new Date(item.check_in)
      ) / 1000;

    if (seconds < 0) return "Invalid";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
  };

  const isPunchedIn = Boolean(
    todayRecord?.check_in
  );

  const isPunchedOut = Boolean(
    todayRecord?.check_out
  );

  if (loading) {
    return (
      <div className="module-page">
        <div className="module-card">
          <h2>Loading attendance...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">

      <div className="module-header">
        <div>
          <h1>My Attendance</h1>
          <p>
            Manage your daily punch in and punch out.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/employee-dashboard")}
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

      {/* Today's Attendance */}

      <div className="module-card">

        <h2>Today's Attendance</h2>

        <p>
          Date: {today}
        </p>

        <div className="attendance-action-card">

          <div>
            <h3>Current Status</h3>

            <span
              className={`status-badge ${
                isPunchedOut
                  ? "status-present"
                  : isPunchedIn
                  ? "status-present"
                  : "status-absent"
              }`}
            >
              {isPunchedOut
                ? "COMPLETED"
                : isPunchedIn
                ? "PUNCHED IN"
                : "NOT PUNCHED IN"}
            </span>
          </div>

          <div className="attendance-times">

            <div>
              <strong>Check In</strong>
              <p>
                {formatTime(todayRecord?.check_in)}
              </p>
            </div>

            <div>
              <strong>Check Out</strong>
              <p>
                {formatTime(todayRecord?.check_out)}
              </p>
            </div>

            <div>
              <strong>Working Hours</strong>
              <p>
                {todayRecord
                  ? getWorkingHours(todayRecord)
                  : "0h 0m"}
              </p>
            </div>

          </div>

          <div className="attendance-buttons">

            <button
              className="punch-in-button"
              disabled={actionLoading || isPunchedIn}
              onClick={() => handlePunch("in")}
            >
              {actionLoading
                ? "Please wait..."
                : "Punch In"}
            </button>

            <button
              className="punch-out-button"
              disabled={
                actionLoading ||
                !isPunchedIn ||
                isPunchedOut
              }
              onClick={() => handlePunch("out")}
            >
              {actionLoading
                ? "Please wait..."
                : "Punch Out"}
            </button>

          </div>

          {isPunchedOut && (
            <p className="success-message">
              Your attendance for today is completed.
            </p>
          )}

        </div>
      </div>

      {/* Attendance History */}

      <div className="module-card">

        <h2>Attendance History</h2>

        {attendance.length === 0 ? (
          <div className="empty-state">
            <p>No attendance records found.</p>
          </div>
        ) : (

          <div className="table-container">

            <table className="data-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {attendance.map((item) => (

                  <tr key={item.id}>

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

export default MyAttendance;
