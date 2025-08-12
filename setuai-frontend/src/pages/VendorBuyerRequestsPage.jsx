import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout.jsx';
import { useLocalization } from '../contexts/LocalizationContext';
import * as api from '../api/index.js';
import { motion, AnimatePresence } from 'framer-motion';
import { createVendorResponseNotification, createStatusChangeNotification } from '../services/notificationService.js';
import InvoiceUploadModal from '../components/InvoiceUploadModal.jsx';
import InvoiceDisplay from '../components/InvoiceDisplay.jsx';

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-700';
    case 'HIGH':
      return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-700';
    case 'MEDIUM':
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700';
    case 'LOW':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
    case 'PENDING':
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
    case 'COMPLETED':
      return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
    case 'ON_HOLD':
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
};

export default function VendorBuyerRequestsPage() {
  console.log('🔵 [VENDOR_DEBUG] Rendering VendorBuyerRequestsPage');
  
  const { t } = useLocalization();
  const [vendorEngagements, setVendorEngagements] = useState([]);
  const [groupedRequests, setGroupedRequests] = useState({});
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [historyTab, setHistoryTab] = useState('active');
  const [responseModal, setResponseModal] = useState({ isOpen: false, request: null });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, engagement: null });
  const [invoiceUploadModal, setInvoiceUploadModal] = useState({ isOpen: false, engagementId: null });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoicesModal, setInvoicesModal] = useState({ isOpen: false, engagement: null });
  const [invoiceDetailsModal, setInvoiceDetailsModal] = useState({ isOpen: false, invoice: null });
  const [imageViewerModal, setImageViewerModal] = useState({ isOpen: false, imageUrl: null, imageName: null, error: null, loading: false });
  const [actionsDropdown, setActionsDropdown] = useState(null);
  const [responseData, setResponseData] = useState({
    response: '',
    notes: '',
    nextAction: '',
    engagementStatus: 'PENDING',
    uploadedInvoice: null
  });

  const fetchVendorEngagements = async () => {
    try {
      console.log('🔵 [VENDOR_DEBUG] Fetching vendor engagements...');
      setLoading(true);
      const response = await api.getVendorEngagements();
      if (response.data.success) {
        // Fetch invoices for each engagement
        const engagementsWithInvoices = await Promise.all(
          response.data.data.engagements.map(async (engagement) => {
            try {
              const invoiceResponse = await api.getEngagementInvoices(engagement.id);
              return {
                ...engagement,
                invoices: invoiceResponse.data.success ? invoiceResponse.data.data.invoices : []
              };
            } catch (error) {
              console.error(`Error fetching invoices for engagement ${engagement.id}:`, error);
              return {
                ...engagement,
                invoices: []
              };
            }
          })
        );
        
        setVendorEngagements(engagementsWithInvoices);
        console.log('🔵 [VENDOR_DEBUG] Vendor engagements fetched:', engagementsWithInvoices.length);
      } else {
        console.error('🔴 [VENDOR_DEBUG] Failed to fetch vendor engagements');
        setError('Failed to fetch vendor engagements');
      }
    } catch (err) {
      console.error('🔴 [VENDOR_DEBUG] Error fetching vendor engagements:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorEngagements();
  }, []);

  // Update groupedRequests and summary when vendorEngagements changes
  useEffect(() => {
    const activeBuyerRequests = vendorEngagements.filter(e => e.engagementStatus !== 'COMPLETED');
    
    const updatedGroupedRequests = {
      URGENT: activeBuyerRequests.filter(req => req.priority === 'URGENT'),
      HIGH: activeBuyerRequests.filter(req => req.priority === 'HIGH'),
      MEDIUM: activeBuyerRequests.filter(req => req.priority === 'MEDIUM'),
      LOW: activeBuyerRequests.filter(req => req.priority === 'LOW')
    };

    const updatedSummary = {
      total: activeBuyerRequests.length,
      urgent: updatedGroupedRequests.URGENT.length,
      high: updatedGroupedRequests.HIGH.length,
      medium: updatedGroupedRequests.MEDIUM.length,
      low: updatedGroupedRequests.LOW.length
    };

    setGroupedRequests(updatedGroupedRequests);
    setSummary(updatedSummary);
  }, [vendorEngagements]);

  const handleRespond = (request) => {
    setResponseData({
      response: '',
      notes: request.notes || '',
      nextAction: request.nextFollowUp ? new Date(request.nextFollowUp).toISOString().split('T')[0] : '',
      engagementStatus: request.engagementStatus || 'PENDING'
    });
    setResponseModal({ isOpen: true, request });
  };

  const closeResponseModal = () => {
    setResponseModal({ isOpen: false, request: null });
    setResponseData({
      response: '',
      notes: '',
      nextAction: '',
      engagementStatus: 'PENDING'
    });
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    try {
      console.log('🔵 [VENDOR_DEBUG] Submitting response with data:', responseData);
      
      // Ensure invoice is uploaded
      if (!responseData.uploadedInvoice) {
        alert('Please upload an invoice before submitting the response');
        return;
      }
      
      // Prepare response data with invoice information
      const responsePayload = {
        ...responseData,
        invoiceData: {
          invoiceId: responseData.uploadedInvoice.invoice.id,
          totalAmount: responseData.uploadedInvoice.invoice.totalAmount,
          invoiceNumber: responseData.uploadedInvoice.invoice.invoiceNumber,
          confidence: responseData.uploadedInvoice.extraction.confidence
        }
      };
      
      const response = await api.respondToBuyerRequest(responseModal.request.id, responsePayload);
      if (response.data.success) {
        console.log('🔵 [VENDOR_DEBUG] Response submitted successfully with invoice');
        
        // Create notification for the buyer
        createVendorResponseNotification(responseModal.request, responseData.response);
        
        // Create status change notification if status changed
        if (responseData.engagementStatus !== responseModal.request.engagementStatus) {
          createStatusChangeNotification(
            responseModal.request, 
            responseModal.request.engagementStatus, 
            responseData.engagementStatus
          );
        }
        
        closeResponseModal();
        // Refresh data to ensure UI is updated
        await fetchVendorEngagements();
        console.log('🔵 [VENDOR_DEBUG] Data refreshed after response submission');
      }
    } catch (error) {
      console.error('🔴 [VENDOR_DEBUG] Error submitting response:', error);
    }
  };

  const handleViewDetails = async (engagement) => {
    try {
      console.log('🔵 [VENDOR_DEBUG] Fetching engagement details:', engagement.id);
      const response = await api.getVendorEngagementDetails(engagement.id);
      if (response.data.success) {
        const engagementData = response.data.data.engagement;
        
        // Fetch full invoice details including ratings and images
        if (engagementData.invoices && engagementData.invoices.length > 0) {
          const invoicesWithDetails = await Promise.all(
            engagementData.invoices.map(async (invoice) => {
              try {
                const invoiceResponse = await api.getInvoiceDetails(invoice.id);
                if (invoiceResponse.data.success) {
                  return invoiceResponse.data.data.invoice;
                }
              } catch (error) {
                console.error(`Error fetching invoice details for ${invoice.id}:`, error);
              }
              return invoice;
            })
          );
          
          engagementData.invoices = invoicesWithDetails;
        }
        
        setDetailsModal({ isOpen: true, engagement: engagementData });
      } else {
        setError('Failed to fetch engagement details');
      }
    } catch (error) {
      console.error('🔴 [VENDOR_DEBUG] Error fetching engagement details:', error);
      setError('Failed to fetch engagement details');
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false, engagement: null });
  };

  const handleViewInvoices = async (engagement) => {
    try {
      console.log('🔵 [VENDOR_DEBUG] Fetching invoices for engagement:', engagement.id);
      
      // Fetch full invoice details including ratings and images
      if (engagement.invoices && engagement.invoices.length > 0) {
        const invoicesWithDetails = await Promise.all(
          engagement.invoices.map(async (invoice) => {
            try {
              const invoiceResponse = await api.getInvoiceDetails(invoice.id);
              if (invoiceResponse.data.success) {
                return invoiceResponse.data.data.invoice;
              }
            } catch (error) {
              console.error(`Error fetching invoice details for ${invoice.id}:`, error);
            }
            return invoice;
          })
        );
        
        setInvoicesModal({ isOpen: true, engagement: { ...engagement, invoices: invoicesWithDetails } });
      } else {
        // Fetch invoices if not already loaded
        const invoiceResponse = await api.getEngagementInvoices(engagement.id);
        if (invoiceResponse.data.success && invoiceResponse.data.data.invoices.length > 0) {
          const invoicesWithDetails = await Promise.all(
            invoiceResponse.data.data.invoices.map(async (invoice) => {
              try {
                const invoiceResponse = await api.getInvoiceDetails(invoice.id);
                if (invoiceResponse.data.success) {
                  return invoiceResponse.data.data.invoice;
                }
              } catch (error) {
                console.error(`Error fetching invoice details for ${invoice.id}:`, error);
              }
              return invoice;
            })
          );
          
          setInvoicesModal({ isOpen: true, engagement: { ...engagement, invoices: invoicesWithDetails } });
        } else {
          alert('No invoices found for this engagement');
        }
      }
    } catch (error) {
      console.error('🔴 [VENDOR_DEBUG] Error fetching invoices:', error);
      setError('Failed to fetch invoices');
    }
  };

  const closeInvoicesModal = () => {
    setInvoicesModal({ isOpen: false, engagement: null });
  };

  const openInvoiceDetailsModal = (invoice) => {
    setInvoiceDetailsModal({ isOpen: true, invoice });
  };

  const closeInvoiceDetailsModal = () => {
    setInvoiceDetailsModal({ isOpen: false, invoice: null });
  };

  const openImageViewerModal = async (imageId, imageName) => {
    try {
      // Show loading state
      setImageViewerModal({ isOpen: true, imageUrl: null, imageName, error: null, loading: true });
      
      // Use the API endpoint to get the image with proper authentication
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/invoice/image/${imageId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setImageViewerModal({ isOpen: true, imageUrl, imageName, error: null, loading: false });
    } catch (error) {
      console.error('Error loading image:', error);
      // Show error in modal
      setImageViewerModal({ 
        isOpen: true, 
        imageUrl: null, 
        imageName,
        error: 'Failed to load image. Please check your permissions or try again later.',
        loading: false
      });
    }
  };

  const closeImageViewerModal = () => {
    // Clean up the object URL to prevent memory leaks
    if (imageViewerModal.imageUrl && imageViewerModal.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageViewerModal.imageUrl);
    }
    setImageViewerModal({ isOpen: false, imageUrl: null, imageName: null, error: null, loading: false });
  };

  console.log('🔵 [VENDOR_DEBUG] Component state:', { loading, error, vendorEngagements: vendorEngagements.length });

  if (loading) {
    console.log('🔵 [VENDOR_DEBUG] Showing loading state');
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="loader ease-linear rounded-full border-8 border-gray-200 dark:border-gray-700 h-32 w-32"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.log('🔵 [VENDOR_DEBUG] Showing error state:', error);
    return (
      <Layout>
        <div className="text-red-500 dark:text-red-400 text-center py-10">{error}</div>
      </Layout>
    );
  }

  // Separate engagements by status for history tab
  const activeEngagementList = vendorEngagements.filter(e => e.engagementStatus === 'ACTIVE');
  const pendingEngagementList = vendorEngagements.filter(e => e.engagementStatus === 'PENDING');
  const completedEngagementList = vendorEngagements.filter(e => e.engagementStatus === 'COMPLETED');
  const onHoldEngagementList = vendorEngagements.filter(e => e.engagementStatus === 'ON_HOLD');

  try {
    console.log('🔵 [VENDOR_DEBUG] Rendering main content');
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('vendorRequests.title')}</h1>
          </div>
          
          {/* Summary Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-red-200 dark:border-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('vendorRequests.urgentRequests')}</p>
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    {summary.urgent || 0}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-orange-200 dark:border-orange-700 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('vendorRequests.highPriority')}</p>
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  >
                    {summary.high || 0}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('vendorRequests.mediumPriority')}</p>
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    {summary.medium || 0}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-green-200 dark:border-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center">
                <motion.div 
                  className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </motion.div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Priority</p>
                  <motion.p 
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  >
                    {summary.low || 0}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content with Tabs */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('vendorRequests.title')}</h2>
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'requests'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('vendorRequests.buyerRequests')} ({Object.values(groupedRequests).reduce((sum, group) => sum + group.length, 0)})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'history'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {t('vendorRequests.engagementHistory')} ({vendorEngagements.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Buyer Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-8 p-6">
                {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => (
                  groupedRequests[priority] && groupedRequests[priority].length > 0 && (
                    <motion.div
                      key={priority}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {t('vendorRequests.priorityRequests', { priority })}
                      </h3>
                      
                      <div className={`overflow-x-auto transition-all duration-300 ${actionsDropdown ? 'pb-32' : 'pb-2'}`}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-white dark:bg-gray-800">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.buyer')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.status')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.dealType')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.dealValue')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.lastContact')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('vendorRequests.tableHeaders.actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <AnimatePresence>
                              {groupedRequests[priority].map((request, index) => (
                                <motion.tr
                                  key={request.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 }}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{request.buyer.name}</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">{request.buyer.email}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.engagementStatus)}`}>
                                      {request.engagementStatus.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {request.dealType || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {request.dealValue ? `${request.dealValue} ${request.dealCurrency}` : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {request.lastContact ? new Date(request.lastContact).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="relative">
                                      <motion.button
                                        onClick={() => setActionsDropdown(actionsDropdown === request.id ? null : request.id)}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                      >
                                        {t('actions.title')}
                                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </motion.button>
                                      
                                                                      {actionsDropdown === request.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
                                    style={{
                                      bottom: 'auto',
                                      top: '100%'
                                    }}
                                  >
                                          <div className="py-1">
                                            <motion.button
                                              onClick={() => {
                                                handleRespond(request);
                                                setActionsDropdown(null);
                                              }}
                                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                              whileHover={{ x: 5 }}
                                            >
                                              <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                {t('actions.respond')}
                                              </div>
                                            </motion.button>
                                            
                                            <motion.button
                                              onClick={() => {
                                                handleViewDetails(request);
                                                setActionsDropdown(null);
                                              }}
                                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                              whileHover={{ x: 5 }}
                                            >
                                              <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View Details
                                              </div>
                                            </motion.button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  </td>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )
                ))}

                {/* Empty State for Requests */}
                {Object.values(groupedRequests).every(group => group.length === 0) && (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('vendorRequests.noActiveRequests')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('vendorRequests.noActiveRequestsMessage')}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Engagement History Tab */}
            {activeTab === 'history' && (
              <div className="p-6">
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setHistoryTab('active')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      historyTab === 'active'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Active ({activeEngagementList.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('pending')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      historyTab === 'pending'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Pending ({pendingEngagementList.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('onHold')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      historyTab === 'onHold'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    On Hold ({onHoldEngagementList.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('completed')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      historyTab === 'completed'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Completed ({completedEngagementList.length})
                  </button>
                </div>

                <div className={`overflow-x-auto transition-all duration-300 ${actionsDropdown ? 'pb-32' : 'pb-2'}`}>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Buyer</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Contact</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Next Follow-up
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Invoices
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <AnimatePresence>
                        {(historyTab === 'active' ? activeEngagementList : 
                          historyTab === 'pending' ? pendingEngagementList :
                          historyTab === 'onHold' ? onHoldEngagementList :
                          completedEngagementList).map((engagement, index) => (
                          <motion.tr
                            key={engagement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                    {engagement.buyer.name.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{engagement.buyer.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{engagement.buyer.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(engagement.engagementStatus)}`}>
                                {engagement.engagementStatus.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(engagement.priority)}`}>
                                {engagement.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                              {engagement.lastContact ? new Date(engagement.lastContact).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                              {engagement.nextFollowUp ? new Date(engagement.nextFollowUp).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                              {engagement.invoices && engagement.invoices.length > 0 ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                                  {engagement.invoices.length}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400">
                                  0
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                              <div className="relative">
                                <motion.button
                                  onClick={() => setActionsDropdown(actionsDropdown === engagement.id ? null : engagement.id)}
                                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  Actions
                                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </motion.button>
                                
                                {actionsDropdown === engagement.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20"
                                    style={{
                                      bottom: 'auto',
                                      top: '100%'
                                    }}
                                  >
                                    <div className="py-1">
                                      <motion.button
                                        onClick={() => {
                                          handleViewDetails(engagement);
                                          setActionsDropdown(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        whileHover={{ x: 5 }}
                                      >
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                          View Details
                                        </div>
                                      </motion.button>
                                      
                                      {engagement.invoices && engagement.invoices.length > 0 && (
                                        <motion.button
                                          onClick={() => {
                                            handleViewInvoices(engagement);
                                            setActionsDropdown(null);
                                          }}
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                          whileHover={{ x: 5 }}
                                        >
                                          <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            View Invoices ({engagement.invoices.length})
                                          </div>
                                        </motion.button>
                                      )}
                                      
                                      <motion.button
                                        onClick={() => {
                                          handleRespond(engagement);
                                          setActionsDropdown(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        whileHover={{ x: 5 }}
                                      >
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                                          {t('actions.updateResponse')}
                                        </div>
                                      </motion.button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Empty State for History */}
                {(historyTab === 'active' ? activeEngagementList.length === 0 :
                  historyTab === 'pending' ? pendingEngagementList.length === 0 :
                  historyTab === 'onHold' ? onHoldEngagementList.length === 0 :
                  completedEngagementList.length === 0) && (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {historyTab === 'active' ? 'No active engagements' :
                       historyTab === 'pending' ? 'No pending engagements' :
                       historyTab === 'onHold' ? 'No on-hold engagements' :
                       'No completed engagements'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {historyTab === 'completed' 
                        ? 'Completed engagements will appear here as an audit trail.'
                        : 'Engagements will appear here when buyers create requests.'
                      }
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>

          {/* Response Modal */}
          {responseModal.isOpen && responseModal.request && (
            <div className="fixed inset-0 z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-10" style={{ pointerEvents: 'auto' }}>
                  <form onSubmit={handleSubmitResponse}>
                    <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {t('response.title')}
                        </h3>
                        <button
                          type="button"
                          onClick={closeResponseModal}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{responseModal.request.buyer.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{responseModal.request.buyer.email}</p>
                          <div className="mt-2 flex space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(responseModal.request.priority)}`}>
                              {responseModal.request.priority} Priority
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(responseModal.request.engagementStatus)}`}>
                              Current: {responseModal.request.engagementStatus.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('response.yourResponse')}
                          </label>
                          <textarea
                            value={responseData.response}
                            onChange={(e) => setResponseData({...responseData, response: e.target.value})}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                            placeholder={t('response.responsePlaceholder')}
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('response.additionalNotes')}
                          </label>
                          <textarea
                            value={responseData.notes}
                            onChange={(e) => setResponseData({...responseData, notes: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                            placeholder={t('response.notesPlaceholder')}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('response.engagementStatus')}
                          </label>
                          <select
                            value={responseData.engagementStatus}
                            onChange={(e) => setResponseData({...responseData, engagementStatus: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                          >
                            <option value="PENDING">{t('response.statusOptions.PENDING')}</option>
                            <option value="ACTIVE">{t('response.statusOptions.ACTIVE')}</option>
                            <option value="ON_HOLD">{t('response.statusOptions.ON_HOLD')}</option>
                            <option value="COMPLETED">{t('response.statusOptions.COMPLETED')}</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('response.nextActionDate')}
                          </label>
                          <input
                            type="date"
                            value={responseData.nextAction}
                            onChange={(e) => setResponseData({...responseData, nextAction: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                          />
                        </div>

                        {/* Invoice Upload Section */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                📄 Attach Invoice (Required)
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Upload a valid invoice to proceed with this response
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setInvoiceUploadModal({ isOpen: true, engagementId: responseModal.request.id })}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Upload Invoice</span>
                              </div>
                            </button>
                          </div>

                          {/* Invoice Upload Info */}
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                  AI-Powered Invoice Processing
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  Upload invoice images to automatically extract details, validate authenticity, and create professional invoices. 
                                  Only legitimate invoices will be accepted. This creates a formal engagement with the buyer.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Uploaded Invoice Display */}
                          {responseData.uploadedInvoice && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      Invoice #{responseData.uploadedInvoice.invoice.invoiceNumber}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      ₹{responseData.uploadedInvoice.invoice.totalAmount.toLocaleString()} • {(responseData.uploadedInvoice.extraction.confidence * 100).toFixed(1)}% confidence
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(responseData.uploadedInvoice.invoice)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setResponseData(prev => ({ ...prev, uploadedInvoice: null }))}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        onClick={closeResponseModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!responseData.uploadedInvoice}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {responseData.uploadedInvoice ? 'Send Response with Invoice' : 'Upload Invoice First'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {detailsModal.isOpen && detailsModal.engagement && (
            <div className="fixed inset-0 z-50 overflow-y-auto" style={{ pointerEvents: 'auto' }}>
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" style={{ pointerEvents: 'none' }}>
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-10" style={{ pointerEvents: 'auto' }}>
                  <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Engagement Details
                      </h3>
                      <button
                        onClick={closeDetailsModal}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Buyer Information */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buyer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
                            <p className="text-lg text-gray-900 dark:text-white">{detailsModal.engagement.buyer.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</p>
                            <p className="text-lg text-gray-900 dark:text-white">{detailsModal.engagement.buyer.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Information */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(detailsModal.engagement.engagementStatus)}`}>
                              {detailsModal.engagement.engagementStatus.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority</p>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(detailsModal.engagement.priority)}`}>
                              {detailsModal.engagement.priority}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {detailsModal.engagement.createdAt ? new Date(detailsModal.engagement.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {detailsModal.engagement.dealValue && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deal Value</p>
                            <p className="text-lg text-gray-900 dark:text-white">
                              {detailsModal.engagement.dealValue} {detailsModal.engagement.dealCurrency}
                            </p>
                          </div>
                        )}

                        {detailsModal.engagement.dealType && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deal Type</p>
                            <p className="text-sm text-gray-900 dark:text-white">{detailsModal.engagement.dealType}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Contact</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {detailsModal.engagement.lastContact ? new Date(detailsModal.engagement.lastContact).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Follow-up</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {detailsModal.engagement.nextFollowUp ? new Date(detailsModal.engagement.nextFollowUp).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {detailsModal.engagement.notes && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{detailsModal.engagement.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Invoice Information - Prominently Displayed */}
                      {detailsModal.engagement.invoices && detailsModal.engagement.invoices.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-lg p-6 shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Invoice Details
                            </h4>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              {detailsModal.engagement.invoices.length} Invoice{detailsModal.engagement.invoices.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          {detailsModal.engagement.invoices.map((invoice, index) => (
                            <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-full ${
                                    invoice.verificationStatus === 'VERIFIED' 
                                      ? 'bg-green-100 dark:bg-green-900' 
                                      : invoice.verificationStatus === 'REJECTED'
                                      ? 'bg-red-100 dark:bg-red-900'
                                      : 'bg-yellow-100 dark:bg-yellow-900'
                                  }`}>
                                    {invoice.verificationStatus === 'VERIFIED' ? (
                                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    ) : invoice.verificationStatus === 'REJECTED' ? (
                                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Invoice #{invoice.invoiceNumber}
                                      </h5>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        invoice.verificationStatus === 'VERIFIED' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' 
                                          : invoice.verificationStatus === 'REJECTED'
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'
                                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400'
                                      }`}>
                                        {invoice.verificationStatus}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {new Date(invoice.invoiceDate).toLocaleDateString()} • {(invoice.confidence * 100).toFixed(1)}% confidence
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ₹{invoice.totalAmount.toLocaleString()}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {invoice.currency}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendor</p>
                                  <p className="text-sm text-gray-900 dark:text-white">{invoice.vendorName}</p>
                                  {invoice.vendorGstin && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">GSTIN: {invoice.vendorGstin}</p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buyer</p>
                                  <p className="text-sm text-gray-900 dark:text-white">{invoice.buyerName}</p>
                                  {invoice.buyerGstin && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">GSTIN: {invoice.buyerGstin}</p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      closeInvoicesModal();
                                      openInvoiceDetailsModal(invoice);
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                  >
                                    View Full Details
                                  </button>
                                  {invoice.invoiceImage && (
                                    <button
                                      onClick={async () => await openImageViewerModal(invoice.invoiceImage.id, `Invoice ${invoice.invoiceNumber}`)}
                                      className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                    >
                                      📷 View Original
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {invoice.ratings && invoice.ratings.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${i < Math.round(invoice.ratings.reduce((acc, r) => acc + r.rating, 0) / invoice.ratings.length) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        ({invoice.ratings.length})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Engagement History */}
                      {detailsModal.engagement.engagementHistory && detailsModal.engagement.engagementHistory.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Engagement History</h4>
                          <div className="space-y-3">
                            {detailsModal.engagement.engagementHistory.map((history, index) => (
                              <div key={history.id} className="border-l-4 border-green-500 pl-4 py-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{history.action}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{history.details}</p>
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(history.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      onClick={closeDetailsModal}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      onClick={() => handleRespond(detailsModal.engagement)}
                    >
                      Respond
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Upload Modal */}
          <InvoiceUploadModal
            isOpen={invoiceUploadModal.isOpen}
            onClose={() => setInvoiceUploadModal({ isOpen: false, engagementId: null })}
            engagementId={invoiceUploadModal.engagementId}
            onInvoiceCreated={(invoiceData) => {
              // Store the uploaded invoice in response data
              setResponseData(prev => ({
                ...prev,
                uploadedInvoice: invoiceData
              }));
              
              setInvoiceUploadModal({ isOpen: false, engagementId: null });
              
              // Show success notification
              const notification = {
                type: 'success',
                title: 'Invoice Uploaded Successfully!',
                message: `Invoice #${invoiceData.invoice.invoiceNumber} has been processed and extracted with ${(invoiceData.extraction.confidence * 100).toFixed(1)}% confidence.`,
                duration: 5000
              };
              
              // You can integrate this with your notification system
              console.log('✅ Invoice uploaded successfully:', notification);
            }}
          />

          {/* Invoice Display Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-transparent text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="relative">
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <InvoiceDisplay
                      invoice={selectedInvoice}
                      onRatingSubmitted={() => {
                        // Refresh invoice data if needed
                        setSelectedInvoice(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Modal */}
          {invoicesModal.isOpen && invoicesModal.engagement && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Invoices for {invoicesModal.engagement.buyer.name}
                      </h3>
                      <button
                        onClick={closeInvoicesModal}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {invoicesModal.engagement.invoices.map((invoice, index) => (
                        <div key={invoice.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Invoice #{invoice.invoiceNumber}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(invoice.invoiceDate).toLocaleDateString()} • {(invoice.confidence * 100).toFixed(1)}% confidence
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                ₹{invoice.totalAmount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {invoice.currency}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vendor</p>
                              <p className="text-sm text-gray-900 dark:text-white">{invoice.vendorName}</p>
                              {invoice.vendorGstin && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">GSTIN: {invoice.vendorGstin}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Buyer</p>
                              <p className="text-sm text-gray-900 dark:text-white">{invoice.buyerName}</p>
                              {invoice.buyerGstin && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">GSTIN: {invoice.buyerGstin}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                                                <button
                                    onClick={() => {
                                      closeDetailsModal();
                                      openInvoiceDetailsModal(invoice);
                                    }}
                                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                  >
                                    View Full Details
                                  </button>
                                                                {invoice.invoiceImage && (
                                    <button
                                      onClick={async () => await openImageViewerModal(invoice.invoiceImage.id, `Invoice ${invoice.invoiceNumber}`)}
                                      className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                                    >
                                      📷 View Original
                                    </button>
                                  )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {invoice.ratings && invoice.ratings.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${i < Math.round(invoice.ratings.reduce((acc, r) => acc + r.rating, 0) / invoice.ratings.length) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    ({invoice.ratings.length})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      onClick={closeInvoicesModal}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details Modal */}
          {invoiceDetailsModal.isOpen && invoiceDetailsModal.invoice && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Invoice Details
                      </h3>
                      <button
                        onClick={closeInvoiceDetailsModal}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      <InvoiceDisplay 
                        invoice={invoiceDetailsModal.invoice} 
                        onRatingSubmitted={() => {
                          // Refresh the invoice data after rating
                          closeInvoiceDetailsModal();
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={closeInvoiceDetailsModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Viewer Modal */}
          {imageViewerModal.isOpen && imageViewerModal.imageUrl && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
                </div>

                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                  <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {imageViewerModal.imageName || 'Invoice Image'}
                      </h3>
                      <button
                        onClick={closeImageViewerModal}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                                      <div className="max-h-96 overflow-y-auto">
                    {imageViewerModal.loading ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading image...</p>
                        <p className="text-sm">Please wait while we fetch the invoice image.</p>
                      </div>
                    ) : imageViewerModal.error ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load image</p>
                        <p className="text-sm">{imageViewerModal.error}</p>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <img 
                          src={imageViewerModal.imageUrl} 
                          alt={imageViewerModal.imageName || 'Invoice Image'}
                          className="max-w-full h-auto rounded-lg shadow-lg"
                          onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'text-center py-8 text-gray-500 dark:text-gray-400';
                            errorDiv.innerHTML = `
                              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p>Failed to load image</p>
                              <p class="text-sm mt-2">The image may not be accessible or may have been removed.</p>
                            `;
                            e.target.parentNode.appendChild(errorDiv);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={closeImageViewerModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    );
  } catch (error) {
    console.error('🔴 [VENDOR_DEBUG] Error rendering VendorBuyerRequestsPage:', error);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-500 dark:text-red-400 text-center py-10">
            Error rendering page: {error.message}
          </div>
        </div>
      </Layout>
    );
  }
} 