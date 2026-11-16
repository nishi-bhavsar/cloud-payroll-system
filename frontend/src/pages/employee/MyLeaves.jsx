
import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "./MyLeaves.css";

const INITIAL_FORM = {
  leave_type: "",
  start_date: "",
  end_date: "",
  reason: "",
};

const LEAVE_NAMES = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  EARNED: "Earned Leave",
  UNPAID: "Unpaid Leave",
};

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function MyLeaves() {
  const [types, setTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [attachment, setAttachment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [typesResponse, balanceResponse, historyResponse] =
        await Promise.all([
          api.get("/leaves/types/"),
          api.get("/leaves/balance/"),
          api.get("/leaves/history/"),
        ]);

      setTypes(typesResponse.data || []);
      setBalances(balanceResponse.data?.balances || []);
      setHistory(
        Array.isArray(historyResponse.data)
          ? historyResponse.data
          : []
      );

    } catch (err) {
      console.error("Leave data loading failed:", err);

      setError(
        err.response?.data?.error ||
        "Unable to load leave information. Please refresh."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.leave_type || !form.start_date ||
        !form.end_date || !form.reason.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.end_date < form.start_date) {
      setError("End date cannot be before start date.");
      return;
    }

    if (
      form.start_date.slice(0, 4) !==
      form.end_date.slice(0, 4)
    ) {
      setError("Submit separate applications for different years.");
      return;
    }

    const formData = new FormData();

    formData.append("leave_type", form.leave_type);
    formData.append("start_date", form.start_date);
    formData.append("end_date", form.end_date);
    formData.append("reason", form.reason.trim());

    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        "/leaves/apply/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(
        response.data?.message ||
        "Leave application submitted successfully."
      );

      setForm(INITIAL_FORM);
      setAttachment(null);
      event.target.reset();

      await loadData();

    } catch (err) {
      console.error("Leave application failed:", err);

      const detail =
        err.response?.data?.error ||
        err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : detail
            ? JSON.stringify(detail)
            : "Unable to submit leave application."
      );

    } finally {
      setSubmitting(false);
    }
  };

  const cancelLeave = async (leaveId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.post(`/leaves/cancel/${leaveId}/`, {});

      setMessage("Leave request cancelled successfully.");

      await loadData();

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Unable to cancel leave request."
      );
    }
  };

  if (loading) {
    return (
      <div className="leave-page">
        <p>Loading leave information...</p>
      </div>
    );
  }

  return (
    <main className="leave-page">

      <div className="leave-heading">
        <div>
          <h1>My Leave Management</h1>
          <p>Apply for leave and manage your leave requests.</p>
        </div>
      </div>

      {message && (
        <div className="leave-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="leave-alert error">
          {error}
        </div>
      )}

      {/* Leave Balances */}
      <section className="leave-section">
        <h2>My Leave Balance</h2>

        <div className="leave-balance-grid">

          {balances.map((balance, index) => (
            <div
              className="leave-balance-card"
              key={`${balance.leave_type}-${index}`}
            >
              <span className="leave-card-name">
                {balance.leave_type}
              </span>

              <h3>{balance.available_days}</h3>

              <span className="leave-card-caption">
                Available days
              </span>

              <div className="leave-card-footer">
                <span>
                  Used: {balance.used_days}
                </span>

                <span>
                  Allocated: {balance.allocated_days}
                </span>
              </div>

              <span className={
                balance.is_paid
                  ? "leave-type-paid"
                  : "leave-type-unpaid"
              }>
                {balance.is_paid ? "Paid Leave" : "Unpaid Leave"}
              </span>
            </div>
          ))}

        </div>

        {balances.length === 0 && (
          <p>No leave balances configured for this year.</p>
        )}
      </section>

      {/* Apply for Leave */}
      <section className="leave-section">
        <h2>Apply for Leave</h2>

        <form
          className="leave-form"
          onSubmit={handleSubmit}
        >

          <div className="leave-form-grid">

            <div className="leave-field">
              <label>Leave Type *</label>

              <select
                name="leave_type"
                value={form.leave_type}
                onChange={handleChange}
                required
              >
                <option value="">Select leave type</option>

                {types.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                  >
                    {LEAVE_NAMES[type.code] || type.code}
                    {type.is_paid ? " (Paid)" : " (Unpaid)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="leave-field">
              <label>Start Date *</label>

              <input
                type="date"
                name="start_date"
                min={getToday()}
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="leave-field">
              <label>End Date *</label>

              <input
                type="date"
                name="end_date"
                min={form.start_date || getToday()}
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="leave-field">
              <label>Supporting Document</label>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => {
                  const file = event.target.files[0];

                  if (file && file.size > 5 * 1024 * 1024) {
                    setError("File size must not exceed 5 MB.");
                    event.target.value = "";
                    setAttachment(null);
                    return;
                  }

                  setError("");
                  setAttachment(file || null);
                }}
              />

              <small>PDF, JPG or PNG. Maximum 5 MB.</small>
            </div>

          </div>

          <div className="leave-field">
            <label>Reason for Leave *</label>

            <textarea
              name="reason"
              rows="4"
              placeholder="Enter your reason for requesting leave..."
              value={form.reason}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="leave-submit-button"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Leave Application"}
          </button>

        </form>
      </section>

      {/* Leave History */}
      <section className="leave-section">
        <h2>My Leave History</h2>

        <div className="leave-table-wrapper">
          <table className="leave-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Document</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {history.map((leave) => {

                const canCancel =
                  leave.status === "PENDING" ||
                  (
                    leave.status === "APPROVED" &&
                    leave.start_date > getToday()
                  );

                return (
                  <tr key={leave.id}>

                    <td>#{leave.id}</td>

                    <td>{leave.leave_type}</td>

                    <td>{leave.start_date}</td>

                    <td>{leave.end_date}</td>

                    <td>{leave.total_days}</td>

                    <td>
                      <span
                        className={`leave-status ${leave.status.toLowerCase()}`}
                      >
                        {leave.status}
                      </span>
                    </td>

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
                      {canCancel ? (
                        <button
                          className="leave-cancel-button"
                          onClick={() => cancelLeave(leave.id)}
                        >
                          Cancel
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

          {history.length === 0 && (
            <p className="leave-empty">
              You have not submitted any leave applications yet.
            </p>
          )}
        </div>
      </section>

    </main>
  );
}

export default MyLeaves;
