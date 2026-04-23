import { useEffect, useState } from "react";

export default function ActivityTable() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/admin/activity-logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.data || []));
  }, []);

  return (
    <div>
      <h2>Activity Logs</h2>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Login Time</th>
            <th>Logout Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((item) => (
            <tr key={item.ROWID}>
              <td>{item.username}</td>
              <td>{item.email}</td>
              <td>{item.login_time}</td>
              <td>{item.logout_time}</td>
              <td>{item.session_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
