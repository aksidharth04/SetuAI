import React from 'react';

const icons = {
  PENDING: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  VERIFIED: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8L7.33333 9.33333L10 6.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  REJECTED: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6L6 10M6 6L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  EXPIRED: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.33333V8L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.86975 2 11.5361 2.78331 12.6667 4.06666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12.6667 2V4.06666H14.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  MISSING: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5.33333V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 10.6667H8.00667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  PENDING_API_VALIDATION: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4L8 7L14 4L8 1L2 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8L8 11L14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L8 15L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  PENDING_MANUAL_REVIEW: (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.33333 9.33333C7.33333 8.97971 7.47381 8.64057 7.72386 8.39052C7.97391 8.14048 8.31304 8 8.66667 8C9.02029 8 9.35943 8.14048 9.60948 8.39052C9.85952 8.64057 10 8.97971 10 9.33333C10 9.86667 9.66667 10.1333 9.33333 10.4L8.66667 11V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.66667 14H8.67333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10.6667C14 7.72 11.6133 5.33333 8.66667 5.33333C5.72 5.33333 3.33333 7.72 3.33333 10.6667C3.33333 13.6133 5.72 16 8.66667 16C11.6133 16 14 13.6133 14 10.6667Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8.66667 5.33333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.66667 2.66667L5.33333 3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.6667 2.66667L12 3.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const statusConfig = {
  PENDING: {
    color: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
    text: 'Verification Pending'
  },
  VERIFIED: {
    color: 'bg-status-verified-bg text-status-verified-text border border-status-verified-border',
    text: 'Verified'
  },
  REJECTED: {
    color: 'bg-status-error-bg text-status-error-text border border-status-error-border',
    text: 'Rejected'
  },
  EXPIRED: {
    color: 'bg-background-dark text-text-tertiary border border-border',
    text: 'Expired'
  },
  MISSING: {
    color: 'bg-background-dark text-text-tertiary border border-border',
    text: 'Missing'
  },
  PENDING_API_VALIDATION: {
    color: 'bg-status-review-bg text-status-review-text border border-status-review-border',
    text: 'API Validation Pending'
  },
  PENDING_MANUAL_REVIEW: {
    color: 'bg-status-pending-bg text-status-pending-text border border-status-pending-border',
    text: 'Manual Review Pending'
  }
};

const VerificationBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  const icon = icons[status] || icons.PENDING;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {icon}
      {config.text}
    </span>
  );
};

export default VerificationBadge; 