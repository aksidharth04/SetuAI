import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { generateNotifications, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationState, refreshNotifications } from '../services/notificationService';

// Create a global event system for notification updates
window.notificationRefreshTrigger = () => {};

export default function Navbar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useLocalization();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const { user } = useAuth();
  
  const navLinks = [
    { path: '/dashboard', label: t('navigation.dashboard') },
    ...(user?.role === 'VENDOR_ADMIN' ? [
      { path: '/marketplace', label: t('marketplace.title') },
      { path: '/wage-verification', label: t('navigation.wageVerification') }
    ] : []),
    ...(user?.role === 'VENDOR_ADMIN' || user?.role === 'SYSTEM_ADMIN' ? [
      { path: '/profile', label: t('common.profile') },
      { path: '/buyer-requests', label: t('navigation.buyerRequests') }
    ] : []),
    { path: '/reports', label: user?.role === 'BUYER_ADMIN' ? t('engagement.title') : t('navigation.reports') },
    { path: '/help', label: t('navigation.help') }
  ];

  // Fetch dynamic notifications
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    if (loadingNotifications && !forceRefresh) return;
    
    setLoadingNotifications(true);
    try {
      const dynamicNotifications = await generateNotifications();
      setNotifications(dynamicNotifications);
      setLastRefresh(Date.now());
      console.log('Notifications refreshed:', dynamicNotifications.length, 'notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [loadingNotifications]);

  useEffect(() => {
    // Initial load of notifications
    fetchNotifications();
    
    // Set up global refresh trigger (no polling)
    window.notificationRefreshTrigger = () => {
      console.log('Triggering notification refresh...');
      fetchNotifications(true);
    };
    
    return () => {
      window.notificationRefreshTrigger = () => {};
    };
  }, [fetchNotifications]);

  // Force refresh when notifications dropdown is opened
  useEffect(() => {
    if (isNotificationsOpen) {
      fetchNotifications(true);
    }
  }, [isNotificationsOpen, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications([]);
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await refreshNotifications();
      // The refresh will trigger through the global event system
      console.log('Manual notification refresh triggered');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Remove the notification from the local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      console.log('Notification marked as read:', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    // Clear notification state on logout
    clearNotificationState();
    
    // Add smooth logout animation
    const logoutButton = document.querySelector('[data-logout-button]');
    if (logoutButton) {
      logoutButton.style.transform = 'scale(0.95)';
      logoutButton.style.opacity = '0.7';
    }
    
    // Delay logout for smooth transition
    setTimeout(() => {
      logout();
      setIsMenuOpen(false);
    }, 200);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <motion.div 
      className="navbar bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="navbar-start">
        <div className="relative">
          <motion.button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className={`w-5 h-5 flex flex-col justify-center items-center transition-all duration-300 ease-out ${isMenuOpen ? 'rotate-90' : ''}`}>
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-current rounded-full my-1 transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </div>
          </motion.button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.ul 
                className="absolute top-full left-0 mt-3 z-[1] p-2 shadow-xl bg-white dark:bg-gray-800 rounded-lg w-56 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {navLinks.map((link, index) => (
                  <motion.li 
                    key={link.path} 
                    className="mb-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link 
                      to={link.path}
                      className={`${location.pathname === link.path ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'} rounded-lg px-3 py-3 text-sm font-medium transition-colors text-center w-full flex justify-center items-center`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li 
                  className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                >
                  <motion.button 
                    data-logout-button
                    onClick={handleLogout}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-3 py-3 text-sm font-medium w-full text-center transition-all duration-300 flex justify-center items-center"
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: navLinks.length * 0.1 + 0.1 }}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('common.logout')}
                  </motion.button>
                </motion.li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="navbar-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/dashboard" className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <span className="bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent font-bold text-2xl drop-shadow-lg">
              SetuAI
            </span>
          </Link>
        </motion.div>
      </div>
      <div className="navbar-end">
        <div className="flex items-center space-x-2 mr-4">
          <DarkModeToggle />
          <LanguageSwitcher />
        </div>
        <div className="relative">
          <motion.button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <motion.span 
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {notifications.length}
                </motion.span>
              )}
            </div>
          </motion.button>
          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div 
                className="absolute top-full right-0 mt-3 z-[1] p-4 shadow-xl bg-white dark:bg-gray-800 rounded-lg w-72 border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{t('notifications.title')}</h3>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleManualRefresh}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
                      title="Refresh notifications"
                      disabled={loadingNotifications}
                    >
                      <svg className={`w-4 h-4 ${loadingNotifications ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                      >
                        {t('notifications.markAllRead')}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {loadingNotifications ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <motion.div 
                        key={`${notification.id}-${lastRefresh}`} 
                        className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          notification.priority === 'high' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' :
                          notification.priority === 'medium' ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20' :
                          'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                        }`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.priority === 'high' ? 'bg-red-500' :
                            notification.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              {getNotificationIcon(notification.type)}
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.message}</p>
                            </div>
                            {notification.action && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">{notification.action}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                title="Mark as read"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}