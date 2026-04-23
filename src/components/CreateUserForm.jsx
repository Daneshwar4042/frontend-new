import { useState } from "react";

export default function CreateUserForm() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role_name: "User"
  });

  const handleSubmit = async () => {
    await fetch("/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    alert("User created successfully");
  };

  return (
    <div>
      <h2>Create User</h2>
      <input placeholder="Username" onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select onChange={(e) => setForm({ ...form, role_name: e.target.value })}>
        <option>User</option>
        <option>Admin</option>
      </select>
      <button onClick={handleSubmit}>Create User</button>
    </div>
  );
}
