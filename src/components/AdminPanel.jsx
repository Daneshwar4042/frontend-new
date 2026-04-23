import { useCallback, useEffect, useState } from "react";
import "./AdminPanel.css";

const AdminPanel = ({ API_ROOT, getStoredToken, handleSessionExpired }) => {
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Form state for adding user
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "User"
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_ROOT}/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response format");
        }
      }

      if (!response.ok) {
        const requestError = new Error(data?.details || data?.error || "Failed to fetch users");
        requestError.status = response.status;
        throw requestError;
      }

      const usersArray = data?.data || [];
      setUsers(usersArray);
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [getStoredToken, API_ROOT, handleSessionExpired]);

  // Fetch activity logs
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_ROOT}/admin/activity-logs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response format");
        }
      }

      if (!response.ok) {
        const requestError = new Error(data?.message || data?.error || "Failed to fetch activities");
        requestError.status = response.status;
        throw requestError;
      }

      const activitiesData = data?.data || [];
      setActivities(activitiesData);
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  }, [getStoredToken, API_ROOT, handleSessionExpired]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "activities") {
      fetchActivities();
    }
  }, [activeTab, fetchUsers, fetchActivities]);

  const handleAddUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_ROOT}/admin/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newUser)
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response format");
        }
      }

      if (!response.ok) {
        const requestError = new Error(data?.message || data?.error || "Failed to create user");
        requestError.status = response.status;
        throw requestError;
      }

      setStatus("User created successfully!");
      setNewUser({ name: "", email: "", password: "", role: "User" });
      await fetchUsers();
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setError("");
    setStatus("");
    setLoading(true);

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_ROOT}/admin/delete-user/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const text = await response.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Invalid response format");
        }
      }

      if (!response.ok) {
        const requestError = new Error(data?.message || data?.error || "Failed to delete user");
        requestError.status = response.status;
        throw requestError;
      }

      setStatus("User deleted successfully!");
      await fetchUsers();
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
        <button
          className={`tab-button ${activeTab === "activities" ? "active" : ""}`}
          onClick={() => setActiveTab("activities")}
        >
          User Activity
        </button>
      </div>

      {error && <p className="status error">{error}</p>}
      {status && <p className="status success">{status}</p>}

      {activeTab === "users" && (
        <div className="admin-content">
          <div className="panel add-user-panel">
            <div className="panel-heading">
              <h2>Add New User</h2>
              <p>Create a new user account with specified role.</p>
            </div>

            <form onSubmit={handleAddUser}>
              <label>
                  <span>Username</span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Secure password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Role</span>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                </select>
              </label>

              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Add User"}
              </button>
            </form>
          </div>

          <div className="panel users-list-panel">
            <div className="panel-heading">
              <h2>User List</h2>
              <p>{users.length} user{users.length !== 1 ? "s" : ""} total</p>
            </div>

            {loading ? (
              <p className="status">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="status">No users found.</p>
            ) : (
              <div className="users-table">
                <div className="table-header">
                  <div className="col-username">Username</div>
                  <div className="col-email">Email</div>
                  <div className="col-role">Role</div>
                  <div className="col-actions">Actions</div>
                </div>
                {users.map((user) => (
                  <div className="table-row" key={user.ROWID}>
                    <div className="col-username">{user.name}</div>
                    <div className="col-email">{user.email}</div>
                    <div className="col-role">
                      <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                        {user.role || "User"}
                      </span>
                    </div>
                    <div className="col-actions">
                      <button
                        className="danger-button"
                        onClick={() => handleDeleteUser(user.ROWID)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activities" && (
        <div className="admin-content">
          <div className="panel activity-panel">
            <div className="panel-heading">
              <h2>User Activity Logs</h2>
              <p>{activities.length} login session{activities.length !== 1 ? "s" : ""} recorded</p>
            </div>

            {loading ? (
              <p className="status">Loading activity logs...</p>
            ) : activities.length === 0 ? (
              <p className="status">No activity logs found.</p>
            ) : (
              <div className="activity-table">
                <div className="table-header">
                  <div className="col-username">Username</div>
                  <div className="col-email">Email</div>
                  <div className="col-login">Login Time</div>
                  <div className="col-logout">Logout Time</div>
                  <div className="col-active">Last Active</div>
                  <div className="col-meta">Role / Created By</div>
                </div>
                {activities.map((activity, idx) => (
                  <div className="table-row" key={activity.ROWID || idx}>
                    <div className="col-username">{activity.username}</div>
                    <div className="col-email">{activity.email}</div>
                    <div className="col-login">{formatDate(activity.login_time)}</div>
                    <div className="col-logout">{formatDate(activity.logout_time)}</div>
                    <div className="col-active">{formatDate(activity.last_active)}</div>
                    <div className="col-meta">
                      <strong>{activity.role_name || "User"}</strong>
                      <span>{activity.created_by || "System"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
