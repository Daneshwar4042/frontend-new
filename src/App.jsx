// import { useEffect, useState } from "react";

// const BASE_URL = "https://1test-60069775150.development.catalystserverless.in/server/1_test_function/";

// function App() {
//   const [users, setUsers] = useState([]);
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     contact: ""
//   });

//   // ✅ Fetch users
//   const fetchUsers = async () => {
//     try {
//       const res = await fetch(BASE_URL);
//       const data = await res.json();
//       setUsers(data);
//     } catch (err) {
//       console.error("Fetch error:", err);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   // ✅ Handle input
//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   // ✅ Add user (CORS FIX APPLIED)
//   const addUser = async () => {
//     try {
//       await fetch(BASE_URL, {
//         method: "POST",
//         body: JSON.stringify(form)
//       });

//       setForm({ name: "", email: "", contact: "" });
//       fetchUsers();
//     } catch (err) {
//       console.error("Add error:", err);
//     }
//   };

//   // ✅ Delete user (also updated)
//   const deleteUser = async (id) => {
//     try {
//       await fetch(BASE_URL, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "text/plain"   // 🔥 avoid preflight
//         },
//         body: JSON.stringify({ ROWID: id })
//       });

//       fetchUsers();
//     } catch (err) {
//       console.error("Delete error:", err);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>User CRUD App</h1>

//       {/* Form */}
//       <div style={{ marginBottom: "20px" }}>
//         <input
//           name="name"
//           placeholder="Name"
//           value={form.name}
//           onChange={handleChange}
//         />
//         <input
//           name="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//         />
//         <input
//           name="contact"
//           placeholder="Contact"
//           value={form.contact}
//           onChange={handleChange}
//         />
//         <button onClick={addUser}>Add User</button>
//       </div>

//       <hr />

//       {/* User List */}
//       <h2>Users</h2>
//       {users.length === 0 ? (
//         <p>No users found</p>
//       ) : (
//         users.map((user) => (
//           <div key={user.ROWID} style={{ margin: "10px 0" }}>
//             <b>{user.name}</b> | {user.email} | {user.contact}
//             <button
//               onClick={() => deleteUser(user.ROWID)}
//               style={{ marginLeft: "10px" }}
//             >
//               Delete
//             </button>
//           </div>
//         ))
//       )}
//     </div>
//   );
// }

// export default App;




import { useEffect, useState } from "react";

const BASE_URL = "https://1test-60069775150.development.catalystserverless.in/server/1_test_function/";

function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: ""
  });

  // ✅ Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(BASE_URL);
      const data = await res.json();

      if (data.error) {
        console.error("Backend error:", data.error);
        return;
      }

      setUsers(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Add user (FIXED)
  const addUser = async () => {
    try {
      console.log("Sending:", form); // debug

      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain" // 🔥 important for your backend
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (data.error) {
        console.error("Add failed:", data.error);
        return;
      }

      setForm({ name: "", email: "", contact: "" });
      fetchUsers();

    } catch (err) {
      console.error("Add error:", err);
    }
  };

  // ✅ Delete user (FIXED)
  const deleteUser = async (id) => {
    try {
      console.log("Deleting:", id); // debug

      const res = await fetch(BASE_URL, {
        method: "DELETE",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({ ROWID: id })
      });

      const data = await res.json();

      if (data.error) {
        console.error("Delete failed:", data.error);
        return;
      }

      fetchUsers();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>User CRUD App</h1>

      {/* Form */}
      <div style={{ marginBottom: "20px" }}>
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
      </div>

      <hr />

      {/* User List */}
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        users.map((user) => (
          <div key={user.ROWID} style={{ margin: "10px 0" }}>
            <b>{user.name}</b> | {user.email} | {user.contact}
            <button
              onClick={() => deleteUser(user.ROWID)}
              style={{ marginLeft: "10px" }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default App;