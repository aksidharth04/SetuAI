import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import VendorDashboard from './VendorDashboard';
import BuyerDashboard from './BuyerDashboard';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render different dashboard based on user role
  switch (user.role) {
    case 'VENDOR_ADMIN':
      return <VendorDashboard />;
    case 'BUYER_ADMIN':
      return <BuyerDashboard />;
    case 'SYSTEM_ADMIN':
      return <BuyerDashboard />; // System admin can see the marketplace features
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unsupported User Role
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your user role ({user.role}) is not supported in this application.
            </p>
          </div>
        </div>
      );
  }
} 