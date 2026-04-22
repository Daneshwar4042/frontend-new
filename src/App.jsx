import { useCallback, useEffect, useState } from "react";
import "./App.css";

const emptyForm = {
  ROWID: "",
  name: "",
  email: "",
  contact: ""
};

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/server/backend").trim();
const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");
const API_ROOT = API_BASE_URL.replace(/\/api\/users\/?$/, "");
const USERS_API_URL = /\/api\/users\/?$/.test(API_BASE_URL) ? API_BASE_URL : `${API_ROOT}/api/users`;
const AUTH_ME_URL = `${API_ROOT}/api/auth/me`;
const AUTH_TOKEN_URL = `${API_ROOT}/api/auth/token`;
const TOKEN_STORAGE_KEY = "crud_auth_token";
const TOKEN_EXPIRY_STORAGE_KEY = "crud_auth_token_expires_at";
const USERS_STORAGE_KEY = "crud_users_data";

const isCrossOriginApi = () => {
  try {
    return new URL(API_ROOT, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const parseRequestPayload = (body) => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return typeof body === "object" ? body : {};
};

const getStoredToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const storeToken = (token) => {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token || "");
  } catch {
    // localStorage can be unavailable in private or embedded browser contexts.
  }
};

const getStoredTokenExpiry = () => {
  try {
    return Number(window.localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY) || 0);
  } catch {
    return 0;
  }
};

const storeTokenExpiry = (expiresAt) => {
  try {
    if (expiresAt) {
      window.localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt));
    } else {
      window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
    }
  } catch {
    // localStorage can be unavailable in private or embedded browser contexts.
  }
};

const getTokenSecondsRemaining = () => {
  const expiresAt = getStoredTokenExpiry();
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
};

const formatTimeRemaining = (totalSeconds) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const getStoredUsers = () => {
  try {
    const stored = window.localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const storeUsers = (users) => {
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users || []));
  } catch {
    // localStorage can be unavailable in private or embedded browser contexts.
  }
};

const requestJson = async (url, options = {}) => {
  const token = getStoredToken();
  const useSimpleCors = isCrossOriginApi();
  const payload = parseRequestPayload(options.body);
  const body = options.body && useSimpleCors
    ? JSON.stringify(token ? { ...payload, access_token: token } : payload)
    : options.body;

  const response = await fetch(url, {
    mode: 'cors',
    credentials: useSimpleCors ? "omit" : "include",
    ...options,
    headers: useSimpleCors
      ? { "Content-Type": "text/plain" }
      : {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        },
    body
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON from ${url}, but received a non-JSON response.`);
    }
  }

  if (!response.ok) {
    const requestError = new Error(data?.details || data?.error || "Request failed");
    requestError.status = response.status;
    throw requestError;
  }

  return data;
};

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailForToken, setEmailForToken] = useState("");
  const [passwordForToken, setPasswordForToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenSecondsRemaining, setTokenSecondsRemaining] = useState(getTokenSecondsRemaining);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const isEditing = Boolean(form.ROWID);

  const handleSessionExpired = useCallback((requestError) => {
    if (requestError?.status === 401) {
      setCurrentUser(null);
      setUsers([]);
      setStatus("");
      storeToken("");
      storeTokenExpiry(0);
      storeUsers([]);
      return true;
    }
    return false;
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await requestJson(USERS_API_URL, isCrossOriginApi()
        ? { method: "POST", body: JSON.stringify({ action: "list" }) }
        : {}
      );
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray);
      storeUsers(usersArray);
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
        const cachedUsers = getStoredUsers();
        if (cachedUsers.length > 0) {
          setUsers(cachedUsers);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired]);

  const signInWithToken = async () => {
    setError("");
    setStatus("");

    try {
      const response = await requestJson(AUTH_TOKEN_URL, {
        method: "POST",
        body: JSON.stringify({
          email_id: emailForToken.trim(),
          password: passwordForToken
        })
      });

      if (!response?.access_token) {
        throw new Error("Token endpoint did not return an access token.");
      }

      storeToken(response.access_token);
      const expiresIn = Number(response.expires_in || 0);
      const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : 0;
      storeTokenExpiry(expiresAt);
      setTokenSecondsRemaining(getTokenSecondsRemaining());
      const me = await requestJson(AUTH_ME_URL, isCrossOriginApi()
        ? { method: "POST", body: JSON.stringify({}) }
        : {}
      );
      setCurrentUser(me?.user || { email_id: emailForToken.trim(), role_name: "Token User" });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setAuthLoading(true);
      setError("");

      try {
        const response = await requestJson(AUTH_ME_URL, isCrossOriginApi()
          ? { method: "POST", body: JSON.stringify({}) }
          : {}
        );
        setCurrentUser(response?.user || null);
        await loadUsers();
      } catch (requestError) {
        if (requestError?.status === 401) {
          setCurrentUser(null);
          setUsers([]);
        } else {
          setError(requestError.message);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrap();
  }, [loadUsers]);

  useEffect(() => {
    const updateTokenCountdown = () => {
      const secondsRemaining = getTokenSecondsRemaining();
      setTokenSecondsRemaining(secondsRemaining);

      if (getStoredToken() && getStoredTokenExpiry() && secondsRemaining <= 0) {
        storeToken("");
        storeTokenExpiry(0);
        storeUsers([]);
        setCurrentUser(null);
        setUsers([]);
        setStatus("");
        setError("Your access token expired. Please sign in again.");
      }
    };

    updateTokenCountdown();
    const timerId = window.setInterval(updateTokenCountdown, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setStatus("");
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      contact: form.contact.trim()
    };

    try {
      if (isEditing) {
        if (isCrossOriginApi()) {
          await requestJson(USERS_API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "update", ROWID: form.ROWID, ...payload })
          });
        } else {
          await requestJson(`${USERS_API_URL}/${form.ROWID}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          });
        }
      } else {
        await requestJson(USERS_API_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }

      resetForm();
      await loadUsers();
      setStatus(isEditing ? "User updated successfully." : "User created successfully.");
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
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
    setStatus(`Editing ${user.name || "user"}.`);
    setError("");
  };

  const deleteUser = async (rowId) => {
    setError("");
    setStatus("");

    try {
      if (isCrossOriginApi()) {
        await requestJson(USERS_API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "delete", ROWID: rowId })
        });
      } else {
        await requestJson(`${USERS_API_URL}/${rowId}`, {
          method: "DELETE"
        });
      }

      if (form.ROWID === rowId) {
        resetForm();
      }

      await loadUsers();
      setStatus("User deleted successfully.");
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message);
      }
    }
  };

  if (authLoading) {
    return (
      <main className="app-shell">
        <section className="hero-card auth-card">
          <div>
            <p className="eyebrow">Zoho Catalyst</p>
            <h1>Checking your session</h1>
            <p className="hero-copy">Verifying the current token before loading the users table.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="app-shell">
        <section className="hero-card auth-card">
          <div>
            <p className="eyebrow">Token Authentication</p>
            <h1>Sign in to continue</h1>
            <p className="hero-copy">
              This CRUD app uses token-based authentication so it can run on Slate while the backend remains on Catalyst.
              Enter your email to request a short-lived access token, then manage the
              <code> users </code>
              table.
            </p>
            {error && <p className="status error">{error}</p>}
          </div>
          <div className="auth-actions">
            <label className="token-login">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={emailForToken}
                onChange={(event) => setEmailForToken(event.target.value)}
              />
            </label>
            <label className="token-login">
              <span>Password</span>
              <input
                type="password"
                placeholder="Login password"
                value={passwordForToken}
                onChange={(event) => setPasswordForToken(event.target.value)}
              />
            </label>
            <button
              className="secondary-button"
              type="button"
              onClick={signInWithToken}
              disabled={!emailForToken.trim() || !passwordForToken}
            >
              Sign in
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Zoho Catalyst</p>
          <h1>Users CRUD</h1>
          <p className="hero-copy">
            Signed in as
            <code> {currentUser.email_id} </code>
            with the role
            <code> {currentUser.role_name || "App User"} </code>
            . The frontend and backend are protected by token-based authentication.
          </p>
        </div>
        <div className="hero-actions">
          <div className="token-timer" aria-live="polite">
            <span>Token expires in</span>
            <strong>{formatTimeRemaining(tokenSecondsRemaining)}</strong>
          </div>
          <button className="secondary-button" type="button" onClick={loadUsers} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              storeToken("");
              storeTokenExpiry(0);
              storeUsers([]);
              setCurrentUser(null);
              setUsers([]);
              setStatus("");
              setError("");
              setEmailForToken("");
              setPasswordForToken("");
            }}
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="content-grid">
        <form className="panel user-form" onSubmit={saveUser}>
          <div className="panel-heading">
            <h2>{isEditing ? "Update user" : "Add user"}</h2>
            <p>{isEditing ? "Save changes back to Catalyst." : "Create a new row in the users table."}</p>
          </div>

          <label>
            <span>Name</span>
            <input name="name" placeholder="Jane Doe" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            <span>Email</span>
            <input name="email" placeholder="jane@example.com" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Contact</span>
            <input name="contact" placeholder="+91 98765 43210" value={form.contact} onChange={handleChange} required />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update user" : "Add user"}
            </button>
            {isEditing && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          {error && <p className="status error">{error}</p>}
          {!error && status && <p className="status success">{status}</p>}
        </form>

        <section className="panel user-list">
          <div className="panel-heading">
            <h2>Users table</h2>
            <p>{loading ? "Loading rows from Catalyst..." : `${users.length} record${users.length === 1 ? "" : "s"} loaded.`}</p>
          </div>

          {loading ? (
            <p className="status">Fetching users...</p>
          ) : users.length === 0 ? (
            <p className="status">No users found in the Catalyst table yet.</p>
          ) : (
            users.map((user) => (
              <article className="user-row" key={user.ROWID}>
                <div className="user-copy">
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                  <p>{user.contact}</p>
                  <small>ROWID: {user.ROWID}</small>
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
      </section>
    </main>
  );
}

export default App;
