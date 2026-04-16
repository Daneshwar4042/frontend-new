import { useEffect, useState } from "react";

const BASE_URL = "https://1test-60069775150.development.catalystserverless.in/server/1_test_function/"; // 🔁 replace this

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: ""
  });

  // Fetch users
  const fetchUsers = async () => {
    const res = await fetch(BASE_URL);
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add user
  const addUser = async () => {
    await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    setForm({ name: "", email: "", contact: "" });
    fetchUsers();
  };

  // Delete user
  const deleteUser = async (id) => {
    await fetch(BASE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ROWID: id })
    });

    fetchUsers();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>User CRUD App</h1>

      {/* Form */}
      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
      />
      <input
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />
      <input
        name="contact"
        placeholder="Contact"
        value={form.contact}
        onChange={handleChange}
      />
      <button onClick={addUser}>Add User</button>

      <hr />

      {/* List */}
      {users.map((user) => (
        <div key={user.ROWID} style={{ margin: "10px 0" }}>
          <b>{user.name}</b> | {user.email} | {user.contact}
          <button
            onClick={() => deleteUser(user.ROWID)}
            style={{ marginLeft: "10px" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default App;