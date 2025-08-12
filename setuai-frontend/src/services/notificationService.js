// Efficient trigger-based notification service with role-based access and user-specific storage
import * as api from '../api';

// Get user-specific storage key
const getNotificationStorageKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user.email || 'anonymous';
  return `notifications_${userId}`;
};

// Get dismissed notifications storage key
const getDismissedStorageKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user.email || 'anonymous';
  return `dismissed_notifications_${userId}`;
};

// Get initial notifications flag storage key
const getInitialNotificationsFlagKey = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user.email || 'anonymous';
  return `initial_notifications_generated_${userId}`;
};

// Get user-specific notification state
const getNotificationState = () => {
  const storageKey = getNotificationStorageKey();
  const dismissedKey = getDismissedStorageKey();
  const initialFlagKey = getInitialNotificationsFlagKey();
  
  const stored = localStorage.getItem(storageKey);
  const dismissedStored = localStorage.getItem(dismissedKey);
  const initialFlagStored = localStorage.getItem(initialFlagKey);
  
  let notifications = [];
  let dismissedNotifications = new Set();
  let initialNotificationsGenerated = false;
  
  if (stored) {
    const parsed = JSON.parse(stored);
    notifications = parsed.notifications || [];
  }
  
  if (dismissedStored) {
    const dismissedParsed = JSON.parse(dismissedStored);
    dismissedNotifications = new Set(dismissedParsed.dismissedIds || []);
  }
  
  if (initialFlagStored) {
    const parsed = JSON.parse(initialFlagStored);
    initialNotificationsGenerated = parsed.generated || false;
  }
  
  return {
    notifications,
    dismissedNotifications,
    initialNotificationsGenerated,
    lastNotificationTime: null
  };
};

// Save user-specific notification state with automatic cleanup
const saveNotificationState = (state) => {
  const storageKey = getNotificationStorageKey();
  const dismissedKey = getDismissedStorageKey();
  const initialFlagKey = getInitialNotificationsFlagKey();
  
  // Clean up read notifications - remove them from storage
  const unreadNotifications = state.notifications.filter(
    notification => !state.dismissedNotifications.has(notification.id)
  );
  
  // Keep only unread notifications and limit to 50
  const cleanedNotifications = unreadNotifications.slice(0, 50);
  
  // Save notifications
  const serialized = {
    notifications: cleanedNotifications,
    lastNotificationTime: state.lastNotificationTime
  };
  localStorage.setItem(storageKey, JSON.stringify(serialized));
  
  // Save dismissed notifications separately
  const dismissedSerialized = {
    dismissedIds: Array.from(state.dismissedNotifications)
  };
  localStorage.setItem(dismissedKey, JSON.stringify(dismissedSerialized));
  
  // Save initial notifications flag
  const initialFlagSerialized = {
    generated: state.initialNotificationsGenerated
  };
  localStorage.setItem(initialFlagKey, JSON.stringify(initialFlagSerialized));
};

// Notification triggers based on actions
const actionTriggers = {
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_VERIFIED: 'document_verified',
  DOCUMENT_REJECTED: 'document_rejected',
  COMPLIANCE_SCORE_CHANGED: 'compliance_score_changed',
  DOCUMENT_EXPIRING: 'document_expiring',
  NEW_DOCUMENT_REQUIRED: 'new_document_required',
  // Engagement-specific triggers
  NEW_ENGAGEMENT_REQUEST: 'new_engagement_request',
  ENGAGEMENT_STATUS_CHANGED: 'engagement_status_changed',
  VENDOR_RESPONSE_RECEIVED: 'vendor_response_received',
  BUYER_RESPONSE_RECEIVED: 'buyer_response_received',
  ENGAGEMENT_COMPLETED: 'engagement_completed',
  ENGAGEMENT_ON_HOLD: 'engagement_on_hold'
};

// Role-based notification system with user-specific storage
export const triggerRoleBasedNotification = (action, data = {}, targetRole = null) => {
  const timestamp = new Date().toISOString();
  const notificationId = `${action}_${timestamp}`;
  
  // Get current user role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserRole = user.role;
  
  // Only create notification if it's meant for the current user's role
  if (targetRole && targetRole !== currentUserRole) {
    console.log(`Notification for ${targetRole} role, current user is ${currentUserRole} - skipping`);
    return null;
  }
  
  let notification = {
    id: notificationId,
    timestamp,
    priority: 'medium',
    type: 'info',
    targetRole: targetRole || currentUserRole,
    userId: user.id || user.email || 'anonymous' // Add user ID for additional isolation
  };

  switch (action) {
    case actionTriggers.DOCUMENT_UPLOADED:
      notification = {
        ...notification,
        type: 'success',
        priority: 'low',
        message: `Document "${data.documentName}" uploaded successfully!`,
        action: 'Verification in progress...'
      };
      break;

    case actionTriggers.DOCUMENT_VERIFIED:
      notification = {
        ...notification,
        type: 'success',
        priority: 'low',
        message: `Document "${data.documentName}" verified successfully!`,
        action: 'Your compliance score has been updated.'
      };
      break;

    case actionTriggers.DOCUMENT_REJECTED:
      notification = {
        ...notification,
        type: 'alert',
        priority: 'high',
        message: `Document "${data.documentName}" was rejected.`,
        action: 'Please review and upload a corrected version.'
      };
      break;

    case actionTriggers.COMPLIANCE_SCORE_CHANGED:
      const scoreChange = data.newScore - data.previousScore;
      if (scoreChange > 0) {
        notification = {
          ...notification,
          type: 'success',
          priority: 'medium',
          message: `Your compliance score improved by ${Math.round(scoreChange)}%!`,
          action: `Current score: ${Math.round(data.newScore)}%`
        };
      } else if (scoreChange < 0) {
        notification = {
          ...notification,
          type: 'warning',
          priority: 'high',
          message: `Your compliance score decreased by ${Math.abs(Math.round(scoreChange))}%.`,
          action: 'Review rejected or missing documents.'
        };
      }
      break;

    case actionTriggers.DOCUMENT_EXPIRING:
      notification = {
        ...notification,
        type: 'warning',
        priority: 'medium',
        message: `Document "${data.documentName}" expires in ${data.daysUntilExpiry} days.`,
        action: 'Please renew this document soon.'
      };
      break;

    case actionTriggers.NEW_DOCUMENT_REQUIRED:
      notification = {
        ...notification,
        type: 'suggestion',
        priority: 'medium',
        message: `New document required: ${data.documentName}`,
        action: 'Upload this document to improve your compliance score.'
      };
      break;

    // Engagement-specific notifications
    case actionTriggers.NEW_ENGAGEMENT_REQUEST:
      notification = {
        ...notification,
        type: 'success',
        priority: 'high',
        message: `New engagement request from ${data.buyerName}`,
        action: `Priority: ${data.priority} | Deal Type: ${data.dealType}`,
        data: {
          engagementId: data.engagementId,
          buyerId: data.buyerId,
          type: 'engagement_request'
        }
      };
      break;

    case actionTriggers.ENGAGEMENT_STATUS_CHANGED:
      notification = {
        ...notification,
        type: 'info',
        priority: 'medium',
        message: `Engagement status changed to ${data.newStatus}`,
        action: `Engagement with ${data.counterpartyName} is now ${data.newStatus.toLowerCase()}`,
        data: {
          engagementId: data.engagementId,
          type: 'status_change'
        }
      };
      break;

    case actionTriggers.VENDOR_RESPONSE_RECEIVED:
      notification = {
        ...notification,
        type: 'info',
        priority: 'medium',
        message: `Vendor ${data.vendorName} has responded to your request`,
        action: 'Click to view the response details',
        data: {
          engagementId: data.engagementId,
          vendorId: data.vendorId,
          type: 'vendor_response'
        }
      };
      break;

    case actionTriggers.BUYER_RESPONSE_RECEIVED:
      notification = {
        ...notification,
        type: 'info',
        priority: 'medium',
        message: `Buyer ${data.buyerName} has responded to your request`,
        action: 'Click to view the response details',
        data: {
          engagementId: data.engagementId,
          buyerId: data.buyerId,
          type: 'buyer_response'
        }
      };
      break;

    case actionTriggers.ENGAGEMENT_COMPLETED:
      notification = {
        ...notification,
        type: 'success',
        priority: 'medium',
        message: `Engagement with ${data.counterpartyName} has been completed`,
        action: 'View engagement history for details',
        data: {
          engagementId: data.engagementId,
          type: 'engagement_completed'
        }
      };
      break;

    case actionTriggers.ENGAGEMENT_ON_HOLD:
      notification = {
        ...notification,
        type: 'warning',
        priority: 'medium',
        message: `Engagement with ${data.counterpartyName} is now on hold`,
        action: 'Review and take action to resume',
        data: {
          engagementId: data.engagementId,
          type: 'engagement_on_hold'
        }
      };
      break;
  }

  // Add notification to user-specific state only if it's for the current user
  if (notification) {
    const notificationState = getNotificationState();
    notificationState.notifications.unshift(notification);
    
    // Keep only last 50 notifications to prevent memory issues
    if (notificationState.notifications.length > 50) {
      notificationState.notifications = notificationState.notifications.slice(0, 50);
    }
    
    // Save to user-specific storage (with automatic cleanup)
    saveNotificationState(notificationState);
    
    // Trigger global refresh
    if (window.notificationRefreshTrigger) {
      window.notificationRefreshTrigger();
    }
  }
  
  return notification;
};

// Legacy function for backward compatibility
export const triggerNotification = (action, data = {}) => {
  return triggerRoleBasedNotification(action, data);
};

// Efficient notification generation - only for initial load and manual refresh
export const generateNotifications = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isVendor = user.role === 'VENDOR_ADMIN' || user.role === 'SYSTEM_ADMIN';
    
    // Get user-specific notification state
    const notificationState = getNotificationState();
    
    // Only generate compliance notifications for vendors on initial load
    if (isVendor && notificationState.notifications.length === 0 && !notificationState.initialNotificationsGenerated) {
      try {
        const profileResponse = await api.getVendorProfile();
        const documentsResponse = await api.getVendorDocuments();
        
        const vendor = profileResponse.data.data.vendor;
        const documents = documentsResponse.data.documents || [];
        const currentComplianceScore = vendor.overallComplianceScore;

        // Generate static notifications based on current state
        if (currentComplianceScore < 60) {
          triggerRoleBasedNotification(actionTriggers.COMPLIANCE_SCORE_CHANGED, {
            newScore: currentComplianceScore,
            previousScore: 0
          }, 'VENDOR_ADMIN');
        }

        const rejectedDocs = documents.filter(doc => 
          doc.uploadedDocuments?.some(upload => upload.verificationStatus === 'REJECTED')
        );
        
        if (rejectedDocs.length > 0) {
          triggerRoleBasedNotification(actionTriggers.DOCUMENT_REJECTED, {
            documentName: `${rejectedDocs.length} document(s)`
          }, 'VENDOR_ADMIN');
        }

        const pendingDocs = documents.filter(doc => 
          doc.uploadedDocuments?.some(upload => 
            upload.verificationStatus === 'PENDING' || 
            upload.verificationStatus === 'PENDING_MANUAL_REVIEW'
          )
        );
        
        if (pendingDocs.length > 0) {
          triggerRoleBasedNotification(actionTriggers.DOCUMENT_UPLOADED, {
            documentName: `${pendingDocs.length} document(s)`
          }, 'VENDOR_ADMIN');
        }

        if (currentComplianceScore >= 85) {
          triggerRoleBasedNotification(actionTriggers.COMPLIANCE_SCORE_CHANGED, {
            newScore: currentComplianceScore,
            previousScore: 0
          }, 'VENDOR_ADMIN');
        }
        
        // Mark initial notifications as generated
        notificationState.initialNotificationsGenerated = true;
        saveNotificationState(notificationState);
      } catch (error) {
        console.error('Error generating initial vendor notifications:', error);
      }
    }

    // Return only unread notifications (read ones are automatically cleaned up)
    return notificationState.notifications
      .filter(notification => !notificationState.dismissedNotifications.has(notification.id))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
    
  } catch (error) {
    console.error('Error generating notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  const notificationState = getNotificationState();
  notificationState.dismissedNotifications.add(notificationId);
  
  // Immediately clean up by removing read notifications from storage
  saveNotificationState(notificationState);
  
  return { success: true };
};

export const markAllNotificationsAsRead = async () => {
  // Clear all notifications for current user (they're all marked as read)
  const emptyState = {
    notifications: [],
    dismissedNotifications: new Set(),
    initialNotificationsGenerated: true, // Keep the flag to prevent regeneration
    lastNotificationTime: null
  };
  saveNotificationState(emptyState);
  return { success: true };
};

export const clearNotificationState = () => {
  // Clear notifications for current user only
  const emptyState = {
    notifications: [],
    dismissedNotifications: new Set(),
    initialNotificationsGenerated: false, // Reset flag on logout
    lastNotificationTime: null
  };
  saveNotificationState(emptyState);
};

// Export action triggers for use in components
export { actionTriggers };

// Role-based engagement notification functions
export const createEngagementNotification = (engagement) => {
  // This notification should only be shown to VENDOR_ADMIN
  return triggerRoleBasedNotification(actionTriggers.NEW_ENGAGEMENT_REQUEST, {
    engagementId: engagement.id,
    buyerId: engagement.buyer?.id,
    buyerName: engagement.buyer?.name || 'Unknown Buyer',
    priority: engagement.priority,
    dealType: engagement.dealType || 'N/A'
  }, 'VENDOR_ADMIN');
};

export const createVendorResponseNotification = (engagement, response) => {
  // This notification should only be shown to BUYER_ADMIN
  return triggerRoleBasedNotification(actionTriggers.VENDOR_RESPONSE_RECEIVED, {
    engagementId: engagement.id,
    vendorId: engagement.vendor?.id,
    vendorName: engagement.vendor?.companyName || 'Unknown Vendor',
    response: response
  }, 'BUYER_ADMIN');
};

export const createBuyerResponseNotification = (engagement, response) => {
  // This notification should only be shown to VENDOR_ADMIN
  return triggerRoleBasedNotification(actionTriggers.BUYER_RESPONSE_RECEIVED, {
    engagementId: engagement.id,
    buyerId: engagement.buyer?.id,
    buyerName: engagement.buyer?.name || 'Unknown Buyer',
    response: response
  }, 'VENDOR_ADMIN');
};

export const createStatusChangeNotification = (engagement, previousStatus, newStatus) => {
  const counterpartyName = engagement.buyer?.name || engagement.vendor?.companyName || 'Unknown';
  
  let triggerType = actionTriggers.ENGAGEMENT_STATUS_CHANGED;
  if (newStatus === 'COMPLETED') {
    triggerType = actionTriggers.ENGAGEMENT_COMPLETED;
  } else if (newStatus === 'ON_HOLD') {
    triggerType = actionTriggers.ENGAGEMENT_ON_HOLD;
  }

  // Status change notifications should be shown to both parties
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserRole = user.role;
  
  // Create notification for current user's role
  return triggerRoleBasedNotification(triggerType, {
    engagementId: engagement.id,
    newStatus: newStatus,
    previousStatus: previousStatus,
    counterpartyName: counterpartyName
  }, currentUserRole);
};

// Document-specific notification functions (triggered only when documents are uploaded/verified)
export const createDocumentUploadNotification = (documentName) => {
  return triggerRoleBasedNotification(actionTriggers.DOCUMENT_UPLOADED, {
    documentName: documentName
  }, 'VENDOR_ADMIN');
};

export const createDocumentVerifiedNotification = (documentName) => {
  return triggerRoleBasedNotification(actionTriggers.DOCUMENT_VERIFIED, {
    documentName: documentName
  }, 'VENDOR_ADMIN');
};

export const createDocumentRejectedNotification = (documentName) => {
  return triggerRoleBasedNotification(actionTriggers.DOCUMENT_REJECTED, {
    documentName: documentName
  }, 'VENDOR_ADMIN');
};

export const createComplianceScoreNotification = (newScore, previousScore) => {
  return triggerRoleBasedNotification(actionTriggers.COMPLIANCE_SCORE_CHANGED, {
    newScore: newScore,
    previousScore: previousScore
  }, 'VENDOR_ADMIN');
};

// Helper function to trigger notification refresh globally
export const triggerNotificationRefresh = () => {
  if (typeof window !== 'undefined' && window.notificationRefreshTrigger) {
    window.notificationRefreshTrigger();
  }
};

// Function to manually refresh notifications (for testing and manual refresh)
export const refreshNotifications = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isVendor = user.role === 'VENDOR_ADMIN' || user.role === 'SYSTEM_ADMIN';
    
    if (isVendor) {
      // Force regenerate notifications by resetting the flag
      const notificationState = getNotificationState();
      notificationState.initialNotificationsGenerated = false;
      saveNotificationState(notificationState);
      
      // Trigger refresh
      triggerNotificationRefresh();
    }
  } catch (error) {
    console.error('Error refreshing notifications:', error);
  }
}; 