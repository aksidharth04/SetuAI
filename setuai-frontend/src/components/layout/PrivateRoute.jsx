import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

const PrivateRoute = ({ children }) => {
  console.log("PrivateRoute: Rendering");
  
  try {
    const { token } = useAuth();
    console.log("PrivateRoute: Token exists:", !!token);
    
    if (!token) {
      console.log("PrivateRoute: No token, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    console.log("PrivateRoute: Token exists, rendering children");
    return children;
  } catch (error) {
    console.error("PrivateRoute: AuthProvider not available:", error);
    return <Navigate to="/login" replace />;
  }
};

const VendorRoute = ({ children }) => {
  console.log("VendorRoute: Rendering");
  
  try {
    const { token, user } = useAuth();
    console.log("VendorRoute: Token exists:", !!token);
    console.log("VendorRoute: User role:", user?.role);
    
    if (!token) {
      console.log("VendorRoute: No token, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    if (user?.role !== 'VENDOR_ADMIN') {
      console.log("VendorRoute: User is not a vendor, redirecting to dashboard");
      return <Navigate to="/dashboard" replace />;
    }
    
    console.log("VendorRoute: User is a vendor, rendering children");
    return children;
  } catch (error) {
    console.error("VendorRoute: AuthProvider not available:", error);
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;
export { VendorRoute }; 