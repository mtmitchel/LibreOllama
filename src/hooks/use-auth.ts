import { useState, useEffect } from 'react';

// Simple auth hook for Tauri app - can be expanded later
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for now
  const [currentUser, setCurrentUser] = useState({
    id: 'default-user',
    name: 'User',
    email: 'user@example.com'
  });

  const getCurrentUserId = () => {
    return currentUser.id;
  };

  const login = async (credentials: { email: string; password: string }) => {
    // Placeholder for future authentication
    setIsAuthenticated(true);
    return true;
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setCurrentUser({
      id: 'default-user',
      name: 'User',
      email: 'user@example.com'
    });
  };

  return {
    isAuthenticated,
    currentUser,
    getCurrentUserId,
    login,
    logout,
  };
}