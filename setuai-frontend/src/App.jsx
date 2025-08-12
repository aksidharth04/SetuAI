import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { LocalizationProvider } from "./contexts/LocalizationContext.jsx";
import { DarkModeProvider } from "./contexts/DarkModeContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import VendorDetailPage from "./pages/VendorDetailPage.jsx";
import RoleBasedReports from "./components/RoleBasedReports.jsx";
import VendorBuyerRequestsPage from "./pages/VendorBuyerRequestsPage.jsx";
import WageVerificationPage from "./pages/WageVerificationPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import PolicyPage from "./pages/PolicyPage.jsx";
import PrivateRoute, { VendorRoute } from "./components/layout/PrivateRoute.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <PrivateRoute>
            <MarketplacePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/marketplace/vendors/:vendorId"
        element={
          <PrivateRoute>
            <VendorDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <RoleBasedReports />
          </PrivateRoute>
        }
      />
      <Route
        path="/buyer-requests"
        element={
          <PrivateRoute>
            <VendorBuyerRequestsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/wage-verification"
        element={
          <VendorRoute>
            <WageVerificationPage />
          </VendorRoute>
        }
      />
      <Route
        path="/help"
        element={
          <PrivateRoute>
            <HelpPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/policy/:policyType"
        element={<PolicyPage />}
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <LocalizationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LocalizationProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App; 