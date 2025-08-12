import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import * as api from '../api/index.js';
import { createEngagementNotification } from '../services/notificationService.js';

export default function AddVendorModal({ isOpen, onClose, onVendorAdded }) {
  const { t } = useLocalization();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [engagementData, setEngagementData] = useState({
    engagementStatus: 'PENDING',
    priority: 'MEDIUM',
    notes: '',
    dealValue: '',
    dealCurrency: 'INR',
    dealType: 'PURCHASE',
    nextFollowUp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await api.getMarketplaceVendors({ search: searchTerm });
      if (response.data.success) {
        console.log('Fetched vendors:', response.data.data.vendors);
        setVendors(response.data.data.vendors);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen, searchTerm]);

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
  };

  // Add CSS to hide scrollbars
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .smooth-scroll {
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 [ENGAGEMENT_DEBUG] Submit button clicked');
    
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('🔵 [ENGAGEMENT_DEBUG] Token exists:', !!token);
    console.log('🔵 [ENGAGEMENT_DEBUG] User exists:', !!user);
    if (user) {
      const userData = JSON.parse(user);
      console.log('🔵 [ENGAGEMENT_DEBUG] User role:', userData.role);
      console.log('🔵 [ENGAGEMENT_DEBUG] User email:', userData.email);
    }
    
    if (!selectedVendor) {
      console.log('🔴 [ENGAGEMENT_DEBUG] No vendor selected');
      return;
    }

    if (isSubmitting) {
      console.log('🔴 [ENGAGEMENT_DEBUG] Already submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔵 [ENGAGEMENT_DEBUG] Creating engagement with data:', { selectedVendor, engagementData });
      console.log('🔵 [ENGAGEMENT_DEBUG] Selected vendor ID:', selectedVendor.id);
      console.log('🔵 [ENGAGEMENT_DEBUG] Selected vendor name:', selectedVendor.companyName);
      
      const submitData = {
        ...engagementData,
        vendorId: selectedVendor.id,
        dealValue: engagementData.dealValue ? parseFloat(engagementData.dealValue) : null,
        nextFollowUp: engagementData.nextFollowUp || null
      };

      console.log('🔵 [ENGAGEMENT_DEBUG] Submitting data:', submitData);
      const response = await api.createEngagement(submitData);
      console.log('🔵 [ENGAGEMENT_DEBUG] API response:', response);
      
      if (response.data.success) {
        // Create notification for the vendor
        createEngagementNotification(response.data.data.engagement);
        console.log('🟢 [ENGAGEMENT_DEBUG] Engagement created successfully');
      }
      onVendorAdded();
      onClose();
      setSelectedVendor(null);
      setEngagementData({
        engagementStatus: 'PENDING',
        priority: 'MEDIUM',
        notes: '',
        dealValue: '',
        dealCurrency: 'INR',
        dealType: 'PURCHASE',
        nextFollowUp: ''
      });
    } catch (error) {
      console.error('🔴 [ENGAGEMENT_DEBUG] Error creating engagement:', error);
      console.error('🔴 [ENGAGEMENT_DEBUG] Error response:', error.response?.data);
      console.error('🔴 [ENGAGEMENT_DEBUG] Error status:', error.response?.status);
      console.error('🔴 [ENGAGEMENT_DEBUG] Error message:', error.message);
      alert('Failed to create engagement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" style={{ pointerEvents: 'none' }}>
          <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
        </div>

        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-10" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {t('engagement.addVendor')}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
              {/* Vendor Selection */}
              <div className="flex flex-col h-full min-h-0">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('engagement.vendor')}</h4>
                
                <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar smooth-scroll" style={{ minHeight: 0, height: 'calc(85vh - 300px)' }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('marketplace.searchVendors')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('marketplace.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="loader ease-linear rounded-full border-4 border-gray-200 dark:border-gray-700 h-8 w-8 mx-auto"></div>
                    </div>
                  ) : (
                    vendors.map((vendor) => (
                      <motion.div
                        key={vendor.id}
                        onClick={() => handleVendorSelect(vendor)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVendor?.id === vendor.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center">
                          <div className="relative w-10 h-10 mr-3">
                            <img
                              className="w-10 h-10 rounded-full object-cover"
                              src={vendor.marketplaceProfile?.logoUrl || `/images/vendors/textile-1.jpg`}
                              alt={vendor.companyName}
                              onError={(e) => {
                                if (e.target.src.includes('textile-1.jpg')) {
                                  e.target.src = '/images/vendors/textile-2.jpg';
                                } else if (e.target.src.includes('textile-2.jpg')) {
                                  e.target.src = '/images/vendors/textile-3.jpg';
                                } else {
                                  e.target.style.display = 'none';
                                  const fallbackDiv = document.createElement('div');
                                  fallbackDiv.className = 'w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm';
                                  fallbackDiv.textContent = vendor.companyName.charAt(0);
                                  e.target.parentNode.appendChild(fallbackDiv);
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">{vendor.companyName}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{vendor.factoryLocation}</p>
                            <div className="flex items-center mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                vendor.complianceStatus === 'GREEN' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                                vendor.complianceStatus === 'AMBER' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                                'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                              }`}>
                                {vendor.overallComplianceScore ? `${Math.round(vendor.overallComplianceScore)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Engagement Details Form */}
              <div className="flex flex-col h-full min-h-0">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('engagement.engagementDetails')}</h4>
                
                <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto hide-scrollbar smooth-scroll" style={{ minHeight: 0, height: 'calc(85vh - 300px)' }}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.status')}
                    </label>
                    <select 
                      value={engagementData.engagementStatus}
                      onChange={(e) => setEngagementData({...engagementData, engagementStatus: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="PENDING">🟡 {t('engagement.pending')}</option>
                      <option value="ACTIVE">🟢 {t('engagement.active')}</option>
                      <option value="COMPLETED">🔵 {t('engagement.completed')}</option>
                      <option value="ON_HOLD">🔴 {t('engagement.onHold')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.priority')}
                    </label>
                    <select 
                      value={engagementData.priority}
                      onChange={(e) => setEngagementData({...engagementData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="LOW">🟢 {t('engagement.low')}</option>
                      <option value="MEDIUM">🟡 {t('engagement.medium')}</option>
                      <option value="HIGH">🔴 {t('engagement.high')}</option>
                      <option value="URGENT">🚨 {t('engagement.urgent')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.dealType')}
                    </label>
                    <select 
                      value={engagementData.dealType}
                      onChange={(e) => setEngagementData({...engagementData, dealType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    >
                      <option value="PURCHASE">{t('engagement.dealTypes.PURCHASE')}</option>
                      <option value="SERVICE">{t('engagement.dealTypes.SERVICE')}</option>
                      <option value="CONSULTATION">{t('engagement.dealTypes.CONSULTATION')}</option>
                      <option value="PARTNERSHIP">Partnership</option>
                      <option value="LICENSING">Licensing</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.dealValue')}
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        value={engagementData.dealValue}
                        onChange={(e) => setEngagementData({...engagementData, dealValue: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="0.00"
                      />
                      <select 
                        value={engagementData.dealCurrency}
                        onChange={(e) => setEngagementData({...engagementData, dealCurrency: e.target.value})}
                        className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                      >
                        <option value="INR">{t('engagement.currencies.INR')}</option>
                        <option value="USD">{t('engagement.currencies.USD')}</option>
                        <option value="EUR">{t('engagement.currencies.EUR')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.notes')}
                    </label>
                    <textarea
                      value={engagementData.notes}
                      onChange={(e) => setEngagementData({...engagementData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Add notes about this engagement..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('engagement.nextFollowUp')} (Optional)
                    </label>
                    <input
                      type="date"
                      value={engagementData.nextFollowUp}
                      onChange={(e) => setEngagementData({...engagementData, nextFollowUp: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Leave blank if no follow-up needed"
                    />
                  </div>
                  
                  {/* Bottom padding to prevent button overlap */}
                  <div className="h-4"></div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedVendor || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Adding...' : 'Add to Engagements'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 