
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function MySalary() {
  const navigate = useNavigate();

  const [salary, setSalary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const response = await api.get("/salaries/");

        console.log("Salary response:", response.data);

        if (Array.isArray(response.data)) {
          setSalary(response.data);
        } else if (Array.isArray(response.data.results)) {
          setSalary(response.data.results);
        } else {
          setSalary([]);
        }

      } catch (error) {
        console.error("Salary error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        setError(
          error.response?.data?.detail ||
          "Unable to load salary information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSalary();
  }, [navigate]);

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getEmployee = (item) => {
    if (typeof item.employee === "object" && item.employee !== null) {
      return (
        item.employee.username ||
        item.employee.name ||
        item.employee.id ||
        "—"
      );
    }

    return item.employee || "—";
  };

  return (
    <div className="module-page">

      <div className="module-header">

        <div>
          <h1>My Salary</h1>

          <p>
            View your salary information.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/employee-dashboard")}
        >
          Back to Dashboard
        </button>

      </div>

      {loading && (
        <div className="module-card">
          <h2>Loading salary information...</h2>
        </div>
      )}

      {!loading && error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="module-card">

          <h2>Salary Records</h2>

          {salary.length === 0 ? (
            <div className="empty-state">
              <p>
                No salary records found.
              </p>
            </div>
          ) : (
            <div className="table-container">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic Salary</th>
                    <th>Allowance</th>
                    <th>Deduction</th>
                    <th>Net Salary</th>
                  </tr>
                </thead>

                <tbody>

                  {salary.map((item, index) => {

                    const basicSalary =
                      Number(item.basic_salary || 0);

                    const allowance =
                      Number(item.allowance || 0);

                    const deduction =
                      Number(
                        item.deduction ||
                        item.deductions ||
                        0
                      );

                    const netSalary =
                      item.net_salary !== undefined &&
                      item.net_salary !== null
                        ? Number(item.net_salary)
                        : basicSalary +
                          allowance -
                          deduction;

                    return (
                      <tr key={item.id || index}>

                        <td>
                          {getEmployee(item)}
                        </td>

                        <td>
                          {formatAmount(basicSalary)}
                        </td>

                        <td>
                          {formatAmount(allowance)}
                        </td>

                        <td>
                          {formatAmount(deduction)}
                        </td>

                        <td>
                          <strong>
                            {formatAmount(netSalary)}
                          </strong>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default MySalary;
