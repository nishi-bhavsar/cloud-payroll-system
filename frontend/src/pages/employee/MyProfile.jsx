
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

function MyProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/me/");

        console.log("Profile response:", response.data);

        setUser(response.data);
      } catch (error) {
        console.error("Profile error:", error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        setError(
          error.response?.data?.detail ||
          "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="module-page">
        <div className="module-card">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page">

      <div className="module-header">

        <div>
          <h1>My Profile</h1>
          <p>View your employee profile information.</p>
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

      {!error && user && (
        <div className="module-card">

          <h2>Personal Information</h2>

          <div className="profile-grid">

            <div className="profile-item">
              <span>Username</span>
              <strong>
                {user.username || "N/A"}
              </strong>
            </div>

            <div className="profile-item">
              <span>Email</span>
              <strong>
                {user.email || "N/A"}
              </strong>
            </div>

            <div className="profile-item">
              <span>First Name</span>
              <strong>
                {user.first_name || "N/A"}
              </strong>
            </div>

            <div className="profile-item">
              <span>Last Name</span>
              <strong>
                {user.last_name || "N/A"}
              </strong>
            </div>

            <div className="profile-item">
              <span>Role</span>
              <strong>
                {user.role ||
                  user.profile?.role ||
                  user.user_profile?.role ||
                  "N/A"}
              </strong>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default MyProfile;
