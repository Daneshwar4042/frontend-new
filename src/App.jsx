import { useCallback, useEffect, useState } from "react";
import "./App.css";

const DEFAULT_API_BASE_URL =
  "https://new-test-60069775150.development.catalystserverless.in/server/backend/api/users";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const emptyForm = {
  ROWID: "",
  name: "",
  email: "",
  contact: ""
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Expected JSON from ${url}, but received a non-JSON response.`);
  }

  if (!response.ok || data?.error) {
    throw new Error(data?.details || data?.error || "Request failed");
  }

  return data;
};

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(form.ROWID);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await requestJson(API_BASE_URL);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      contact: form.contact.trim()
    };

    if (isEditing) {
      payload.ROWID = form.ROWID;
    }

    try {
      await requestJson(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify(payload)
      });

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editUser = (user) => {
    setForm({
      ROWID: user.ROWID || "",
      name: user.name || "",
      email: user.email || "",
      contact: user.contact || ""
    });
  };

  const deleteUser = async (rowId) => {
    setError("");

    try {
      await requestJson(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ action: "delete", ROWID: rowId })
      });

      if (form.ROWID === rowId) {
        resetForm();
      }

      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Catalyst Datastore</p>
          <h1>User CRUD</h1>
        </div>
        <button className="secondary-button" type="button" onClick={fetchUsers} disabled={loading}>
          {loading ? "Loading" : "Refresh"}
        </button>
      </section>

      {error && <p className="status error">{error}</p>}

      <form className="user-form" onSubmit={saveUser}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="contact" placeholder="Contact" value={form.contact} onChange={handleChange} required />
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Saving" : isEditing ? "Update User" : "Add User"}
        </button>
        {isEditing && (
          <button className="secondary-button" type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <section className="user-list">
        <h2>Users</h2>

        {loading && <p className="status">Fetching users...</p>}

        {!loading && users.length === 0 ? (
          <p className="status">No users found.</p>
        ) : (
          users.map((user) => (
            <article className="user-row" key={user.ROWID}>
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <p>{user.contact}</p>
              </div>
              <div className="row-actions">
                <button className="secondary-button" type="button" onClick={() => editUser(user)}>
                  Edit
                </button>
                <button className="danger-button" type="button" onClick={() => deleteUser(user.ROWID)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
