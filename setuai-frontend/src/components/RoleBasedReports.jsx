import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import BuyerReportsPage from '../pages/BuyerReportsPage.jsx';

export default function RoleBasedReports() {
  const { user } = useAuth();

  console.log('RoleBasedReports: User role:', user?.role);
  console.log('RoleBasedReports: Full user object:', user);

  // Show buyer reports for BUYER_ADMIN, vendor reports for others
  if (user?.role === 'BUYER_ADMIN') {
    console.log('RoleBasedReports: Rendering BuyerReportsPage');
    return <BuyerReportsPage />;
  }

  console.log('RoleBasedReports: Rendering ReportsPage');
  return <ReportsPage />;
} 