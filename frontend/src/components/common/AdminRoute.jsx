import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  let user = null;

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('AdminRoute: Invalid user data', error);
    localStorage.removeItem('user'); // Clean up bad data
  }

  // 1. Not logged in -> Login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in but not admin -> Home
  // We use optional chaining and lowerCase to be robust
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Admin -> Render
  return children;
};

export default AdminRoute;
