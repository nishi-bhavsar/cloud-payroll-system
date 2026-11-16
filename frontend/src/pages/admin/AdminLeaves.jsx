
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "./AdminLeaves.css";

function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = useCallback(async () => {
    try {
      setError("");

      const params =
        filter === "ALL" ? {} : { status: filter };

      const response = await api.get(
        "/leaves/admin-requests/",
        { params }
      );

      setLeaves(response.data?.results || []);
    } catch (err) {
      console.error("Admin leave loading failed:", err);

      setError(
        err.response?.data?.error ||
        "Unable to load leave applications."
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadLeaves();
  }, [loadLeaves]);

  const reviewLeave = async (leaveId, action) => {
    const label = action === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${label} this leave application?`
    );

    if (!confirmed) return;

    const comments = window.prompt(
      "Enter Admin review comments:",
      ""
    );

    if (comments === null) return;

    try {
      setProcessingId(leaveId);
      setError("");
      setMessage("");

      const response = await api.post(
        `/leaves/manage/${leaveId}/`,
        {
          action,
          comments,
        }
      );

      setMessage(
        response.data?.message ||
        `Leave ${label}d successfully.`
      );

      await loadLeaves();
    } catch (err) {
      console.error("Admin leave review failed:", err);

      setError(
        err.response?.data?.error ||
        "Unable to process this leave application."
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <main className="admin-leave-page">
        Loading leave applications...
      </main>
    );
  }

  return (
    <main className="admin-leave-page">

      <div className="admin-leave-heading">
        <div>
          <h1>Leave Management</h1>
          <p>View and manage leave applications from all employees.</p>
        </div>

        <button
          className="admin-leave-refresh"
          onClick={() => {
            setLoading(true);
            loadLeaves();
          }}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="admin-leave-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-leave-alert error">
          {error}
        </div>
      )}

      <section className="admin-leave-section">

        <div className="admin-leave-toolbar">
          <div>
            <h2>Employee Leave Applications</h2>
            <p>{leaves.length} applications found</p>
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="ALL">All Applications</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="admin-leave-table-wrapper">
          <table className="admin-leave-table">

            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave) => (

                <tr key={leave.id}>

                  <td>
                    <strong>{leave.employee_name}</strong>
                    <small>{leave.employee_code}</small>
                  </td>

                  <td>
                    {leave.leave_type}
                    <small>
                      {leave.is_paid ? "Paid" : "Unpaid"}
                    </small>
                  </td>

                  <td>
                    {leave.start_date}
                    <small>to {leave.end_date}</small>
                  </td>

                  <td>{leave.total_days}</td>

                  <td className="admin-leave-reason">
                    {leave.reason}
                  </td>

                  <td>
                    <span
                      className={`admin-leave-status ${leave.status.toLowerCase()}`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  <td>{leave.reviewed_by || "—"}</td>

                  <td>
                    {leave.attachment ? (
                      <a
                        href={leave.attachment}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    {leave.status === "PENDING" ? (
                      <div className="admin-leave-actions">

                        <button
                          className="admin-leave-approve"
                          disabled={processingId === leave.id}
                          onClick={() =>
                            reviewLeave(leave.id, "APPROVED")
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="admin-leave-reject"
                          disabled={processingId === leave.id}
                          onClick={() =>
                            reviewLeave(leave.id, "REJECTED")
                          }
                        >
                          Reject
                        </button>

                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                </tr>

              ))}
            </tbody>

          </table>

          {leaves.length === 0 && (
            <div className="admin-leave-empty">
              No leave applications found.
            </div>
          )}
        </div>

      </section>
    </main>
  );
}

export default AdminLeaves;
