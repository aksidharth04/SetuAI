import React, { createContext, useContext, useState, useEffect } from "react";
import * as api from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log("AuthProvider: Rendering with children:", children ? "has children" : "no children");
  
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem("token");
    console.log("Initial token from localStorage:", savedToken ? "exists" : "none");
    return savedToken;
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    console.log("Initial user from localStorage:", savedUser ? "exists" : "none");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  });

  useEffect(() => {
    console.log("Token changed:", token ? "exists" : "none");
    if (token) {
      console.log("Saving token to localStorage and setting in axios");
      localStorage.setItem("token", token);
      // Update axios headers
      api.setAuthToken(token);
      console.log("Token saved and axios headers updated");
    } else {
      console.log("Removing token from localStorage and axios");
      localStorage.removeItem("token");
      api.setAuthToken(null);
      console.log("Token removed from localStorage and axios");
    }
  }, [token]);

  useEffect(() => {
    console.log("User changed:", user ? "exists" : "none");
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (credentials) => {
    try {
      console.log("Login attempt with:", credentials.email);
      const res = await api.loginUser(credentials);
      console.log("Login response:", res.data);
      
      if (res.data.success && res.data.data.token) {
        console.log("Setting token:", res.data.data.token.substring(0, 20) + "...");
        console.log("Setting user:", res.data.data.user);
        setToken(res.data.data.token);
        setUser(res.data.data.user);
        console.log("Token and user set in state");
        return res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (data) => {
    const res = await api.registerUser(data);
    if (res.data.success && res.data.data.token) {
      setToken(res.data.data.token);
      setUser(res.data.data.user);
    }
    return res;
  };

  const logout = () => {
    console.log("Logging out...");
    
    // Add fade-out effect to the entire app
    const appElement = document.getElementById('root');
    if (appElement) {
      appElement.style.transition = 'opacity 0.3s ease-out';
      appElement.style.opacity = '0';
    }
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      api.setAuthToken(null);
      
      // Reset opacity after logout
      if (appElement) {
        appElement.style.opacity = '1';
        appElement.style.transition = '';
      }
    }, 300); // 300ms delay for smooth animation
  };

  const value = {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  console.log("useAuth: Hook called");
  const context = useContext(AuthContext);
  console.log("useAuth: Context value:", context ? "exists" : "null");
  if (!context) {
    console.error("useAuth called outside of AuthProvider");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 