import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLocalization } from "../contexts/LocalizationContext";
import * as api from "../api";
import Layout from '../components/Layout.jsx';
import DocumentCard from '../components/DocumentCard.jsx';
import Modal from '../components/Modal.jsx';
import Toast from '../components/Toast.jsx';
import DocumentList from '../components/DocumentList.jsx';
import { triggerRoleBasedNotification, actionTriggers } from '../services/notificationService';

// Helper to get status color
const getStatusBadgeClass = (action) => {
  switch (action?.toUpperCase()) {
    case 'VERIFIED':
      return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20';
    case 'REJECTED':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 ring-red-600/20';
    case 'PENDING':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-yellow-600/20';
    default:
      return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-500/10';
  }
};

// Helper function to trigger global notification refresh
const triggerNotificationRefresh = () => {
  if (window.notificationRefreshTrigger) {
    window.notificationRefreshTrigger();
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const { t } = useLocalization();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalLogs, setModalLogs] = useState([]);
  const [modalDocName, setModalDocName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [wageStats, setWageStats] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log('Making API calls with token:', token ? 'exists' : 'none');
      console.log('localStorage token:', localStorage.getItem('token') ? 'exists' : 'none');
      
      // Test the API calls individually to see which one fails
      try {
        console.log('Testing vendor profile API call...');
        const profileRes = await api.getVendorProfile();
        console.log('Profile API call successful:', profileRes.data);
        setProfile(profileRes.data.data.vendor);
      } catch (profileError) {
        console.error('Profile API call failed:', profileError);
        throw profileError;
      }

      try {
        console.log('Testing vendor documents API call...');
        const documentsRes = await api.getVendorDocuments();
        console.log('Documents API call successful:', documentsRes.data);
        
        // Process documents to add categories
        const docs = documentsRes.data.documents || [];
        const processedDocs = docs.map(doc => {
          let category = 'Other';
          const name = doc.name.toLowerCase();
          
          if (name.includes('epf')) category = 'EPF';
          else if (name.includes('esic')) category = 'ESIC';
          else if (name.includes('factory')) category = 'Factory';
          else if (name.includes('tnpcb')) category = 'TNPCB';
          else if (name.includes('hazardous')) category = 'Hazardous';
          else if (name.includes('fire')) category = 'Fire';
          else if (name.includes('iso')) category = 'ISO';
          else if (name.includes('gots')) category = 'GOTS';
          else if (name.includes('oeko-tex')) category = 'OEKO-TEX';
          
          return { ...doc, category };
        });
        
        setDocuments(processedDocs);
      } catch (documentsError) {
        console.error('Documents API call failed:', documentsError);
        throw documentsError;
      }

      // Fetch wage verification stats for vendors
      if (user && user.role === 'VENDOR_ADMIN') {
        try {
          const wageStatsRes = await api.getWageVerificationStats();
          setWageStats(wageStatsRes.data.data);
        } catch (wageError) {
          console.error('Wage stats API call failed:', wageError);
          // Don't throw error for wage stats, as it's optional
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.error || `${t('errors.networkError')}: ${err.message}`);
      showToast('error', t('dashboard.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for authentication to be ready
    if (!isAuthenticated || !token) {
      console.log('Waiting for authentication...');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token exists:', !!token);
      console.log('localStorage token:', localStorage.getItem('token') ? 'exists' : 'none');
      return;
    }

    fetchData();
  }, [isAuthenticated, token]);

  // Polling effect for status updates after upload
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const documentsRes = await api.getVendorDocuments();
        const docs = documentsRes.data.documents || [];
        const processedDocs = processDocuments(docs);
        
        // Check for status changes and trigger notifications
        const previousDocs = documents;
        const statusChanges = [];
        
        processedDocs.forEach(newDoc => {
          const prevDoc = previousDocs.find(d => d.id === newDoc.id);
          if (prevDoc) {
            const newStatus = newDoc.uploadedDocuments?.[0]?.verificationStatus;
            const prevStatus = prevDoc.uploadedDocuments?.[0]?.verificationStatus;
            
            if (newStatus !== prevStatus) {
              statusChanges.push({
                doc: newDoc,
                previousStatus: prevStatus,
                newStatus: newStatus
              });
            }
          }
        });
        
        // Trigger notifications for status changes (vendor-specific)
        statusChanges.forEach(change => {
          if (change.newStatus === 'VERIFIED') {
            triggerRoleBasedNotification(actionTriggers.DOCUMENT_VERIFIED, {
              documentName: change.doc.name
            }, 'VENDOR_ADMIN');
          } else if (change.newStatus === 'REJECTED') {
            triggerRoleBasedNotification(actionTriggers.DOCUMENT_REJECTED, {
              documentName: change.doc.name
            }, 'VENDOR_ADMIN');
          }
        });
        
        setDocuments(processedDocs);
        
        // Trigger global notification refresh if there were status changes
        if (statusChanges.length > 0) {
          triggerNotificationRefresh();
        }
        
        // Check if any documents are still pending
        const hasPendingDocs = processedDocs.some(doc => 
          doc.uploadedDocuments?.some(uploadedDoc => 
            uploadedDoc.verificationStatus === 'PENDING' || 
            uploadedDoc.verificationStatus === 'PENDING_MANUAL_REVIEW'
          )
        );
        
        // Stop polling if no more pending documents
        if (!hasPendingDocs) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling document status:", error);
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 5000); // Poll every 5 seconds (reduced frequency)

    return () => clearInterval(pollInterval);
  }, [isPolling, documents]);

  const processDocuments = (docs) => {
    return (docs || []).map(doc => {
      let category = 'Other';
      const name = doc.name.toLowerCase();
      
      if (name.includes('epf')) category = 'EPF';
      else if (name.includes('esic')) category = 'ESIC';
      else if (name.includes('factory')) category = 'Factory';
      else if (name.includes('tnpcb')) category = 'TNPCB';
      else if (name.includes('hazardous')) category = 'Hazardous';
      else if (name.includes('fire')) category = 'Fire';
      else if (name.includes('iso')) category = 'ISO';
      else if (name.includes('gots')) category = 'GOTS';
      else if (name.includes('oeko-tex')) category = 'OEKO-TEX';
      
      return { ...doc, category };
    });
  };

  const handleFileChange = async (e, complianceDocumentId) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      setUploadingId(complianceDocumentId);
      setUploadStatus((s) => ({ ...s, [complianceDocumentId]: "Uploading..." }));

      const formData = new FormData();
      formData.append("document", file);
      formData.append("complianceDocumentId", complianceDocumentId);

      await api.uploadDocument(formData);
      
      // Find the document name for notification
      const document = documents.find(doc => doc.id === complianceDocumentId);
      const documentName = document?.name || 'Document';
      
      // Trigger upload notification (vendor-specific)
      triggerRoleBasedNotification(actionTriggers.DOCUMENT_UPLOADED, {
        documentName: documentName
      }, 'VENDOR_ADMIN');
      
      // Trigger global notification refresh
      triggerNotificationRefresh();
      
      // Refresh documents list
      const documentsRes = await api.getVendorDocuments();
      const processedDocs = processDocuments(documentsRes.data.documents);
      setDocuments(processedDocs);
      
      setUploadStatus((s) => ({
        ...s,
        [complianceDocumentId]: "Upload successful!"
      }));
      showToast('success', t('dashboard.uploadSuccess'));
      
      // Start polling for status updates
      setIsPolling(true);
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err?.response?.data?.error || t('dashboard.uploadError');
      setUploadStatus((s) => ({
        ...s,
        [complianceDocumentId]: errorMessage
      }));
      showToast('error', errorMessage);
    } finally {
      setUploadingId(null);
    }
  };

  const handleShowLogs = (doc) => {
    if (!doc) return;

    const allLogs = (doc.uploadedDocuments || [])
      .flatMap(uploadedDoc => {
        const historyEntries = (uploadedDoc.history && uploadedDoc.history.length > 0)
          ? uploadedDoc.history
          : [{
              action: uploadedDoc.verificationStatus || 'PENDING',
              timestamp: uploadedDoc.uploadedAt || new Date().toISOString(),
              details: uploadedDoc.verificationSummary || 'Document verification status',
              changedByUserId: 'SYSTEM',
            }];
        
        return [
          ...historyEntries,
          {
            action: 'UPLOADED',
            timestamp: uploadedDoc.uploadedAt,
            details: `New document version uploaded.`,
            changedByUserId: 'SYSTEM'
          }
        ];
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setModalLogs(allLogs);
    setModalDocName(doc.name);
    setIsModalOpen(true);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  function safeDisplay(val) {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (Array.isArray(val)) return val.join(', ');
    if (val && typeof val === 'object') return JSON.stringify(val);
    return 'SYSTEM';
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {t('dashboard.overview')}
            </p>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            {t('common.lastUpdated')}: {new Date().toLocaleDateString()}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 6.66669V10" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
                <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
                <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="currentColor" strokeWidth="1.67"/>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner w-8 h-8" />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Wage Verification Section for Vendors */}
            {user && user.role === 'VENDOR_ADMIN' && wageStats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('navigation.wageVerification')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered wage compliance analysis</p>
                  </div>
                  <button
                    onClick={() => navigate('/wage-verification')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{wageStats.totalVerifications}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Verifications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{wageStats.verified}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{wageStats.pendingReview}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{wageStats.totalDiscrepancies}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Discrepancies</div>
                  </div>
                </div>
              </div>
            )}

            <DocumentList
              documents={documents}
              uploadingId={uploadingId}
              disableUpload={false}
              onUpload={handleFileChange}
              onViewHistory={handleShowLogs}
              uploadStatus={uploadStatus}
            />
          </div>
        )}

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Audit Logs for ${modalDocName}`}
      >
        {!modalLogs || modalLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No audit logs found</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {modalLogs.map((log, idx) => {
              const displayName = safeDisplay(log.changedByUser?.name || log.changedByUserId);
              console.log('Audit log displayName:', displayName, log.changedByUser, log.changedByUserId);
              return (
                <li key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                    <time className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{log.details}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <img
                      className="h-4 w-4 rounded-full"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff`}
                      alt=""
                    />
                    <span>{displayName}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </Layout>
  );
} 