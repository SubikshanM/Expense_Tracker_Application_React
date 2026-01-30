import React from 'react';
import { Navigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

// Protected route wrapper - redirects to login if not authenticated
export const ProtectedRoute = ({ children }) => {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public route wrapper - redirects to dashboard if already authenticated
export const PublicRoute = ({ children }) => {
  if (authAPI.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
};
