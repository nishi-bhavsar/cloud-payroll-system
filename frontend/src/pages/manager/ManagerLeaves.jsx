
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "./ManagerLeaves.css";

function ManagerLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLeaves = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/leaves/manager-requests/");

      setLeaves(response.data?.results || []);
    } catch (err) {
      console.error("Manager leave loading failed:", err);

      setError(
        err.response?.data?.error ||
        "Unable to load team leave requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const reviewLeave = async (leaveId, action) => {
    const actionLabel =
      action === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this leave application?`
    );

    if (!confirmed) return;

    const comments = window.prompt(
      "Enter review comments (optional):",
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
        `Leave ${actionLabel}d successfully.`
      );

      await loadLeaves();
    } catch (err) {
      console.error("Leave review failed:", err);

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
      <main className="manager-leave-page">
        Loading team leave requests...
      </main>
    );
  }

  return (
    <main className="manager-leave-page">

      <div className="manager-leave-heading">
        <div>
          <h1>Team Leave Requests</h1>
          <p>Review and manage leave applications from your team.</p>
        </div>

        <button
          className="manager-refresh-button"
          onClick={loadLeaves}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="manager-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="manager-alert error">
          {error}
        </div>
      )}

      <section className="manager-leave-summary">
        <div>
          <span>Pending Applications</span>
          <h2>{leaves.length}</h2>
        </div>
      </section>

      <section className="manager-leave-section">

        <h2>Pending Applications</h2>

        {leaves.length === 0 ? (
          <div className="manager-empty">
            <h3>No pending leave requests</h3>
            <p>
              Your team currently has no applications awaiting review.
            </p>
          </div>
        ) : (
          <div className="manager-leave-table-wrapper">

            <table className="manager-leave-table">

              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Document</th>
                  <th>Action</th>
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

                    <td className="manager-reason">
                      {leave.reason}
                    </td>

                    <td>
                      {leave.attachment ? (
                        <a
                          href={leave.attachment}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View document
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      <div className="manager-action-buttons">

                        <button
                          className="manager-approve-button"
                          disabled={processingId === leave.id}
                          onClick={() =>
                            reviewLeave(leave.id, "APPROVED")
                          }
                        >
                          Approve
                        </button>

                        <button
                          className="manager-reject-button"
                          disabled={processingId === leave.id}
                          onClick={() =>
                            reviewLeave(leave.id, "REJECTED")
                          }
                        >
                          Reject
                        </button>

                      </div>

                      {processingId === leave.id && (
                        <small>Processing...</small>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </section>

    </main>
  );
}

export default ManagerLeaves;
