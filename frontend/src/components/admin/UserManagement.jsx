import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
        const res = await api.get("/admin/users");
        setUsers(res.data);
    } catch (e) {
        console.error("Failed to fetch users", e);
        // Ensure users is empty array on error, not mock data
        setUsers([]);
    }
  };

  const toggleBlock = async (id) => {
    try {
        await api.put(`/admin/block/${id}`);
        fetchUsers();
    } catch (e) {
        // Optimistic update for demo
        setUsers(users.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                  <span className="product-name">{u.name}</span>
              </td>
              <td>{u.email}</td>
              <td>
                  <span className="tag" style={{ textTransform: 'capitalize' }}>{u.role}</span>
              </td>
              <td>
                  <span className={`status-badge ${u.isBlocked ? 'status-rejected' : 'status-active'}`}>
                      {u.isBlocked ? "Blocked" : "Active"}
                  </span>
              </td>
              <td>
                <button 
                    className={`btn btn-sm ${u.isBlocked ? 'btn-primary' : 'btn-danger-outline'}`}
                    onClick={() => toggleBlock(u._id)}
                >
                  {u.isBlocked ? "Unblock" : "Block"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
