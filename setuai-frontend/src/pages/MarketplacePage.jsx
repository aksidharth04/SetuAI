import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import Layout from '../components/Layout';
import BuyerDashboard from '../components/BuyerDashboard';
import ImageWithFallback from '../components/ImageWithFallback';
import * as api from '../api/index.js';

export default function MarketplacePage() {
  const { user } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const isVendor = user?.role === 'VENDOR_ADMIN';

  useEffect(() => {
    fetchVendors();
  }, [pagination.page, searchTerm, statusFilter, locationFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter,
        location: locationFilter
      };

      const response = await api.getMarketplaceVendors(params);
      
      if (response.data.success) {
        setVendors(response.data.data.vendors || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total || 0,
          totalPages: response.data.data.pagination.totalPages || 0
        }));
      } else {
        setError(response.data.error || t('errors.failedToFetchVendors'));
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.response?.data?.error || t('errors.failedToFetchVendors'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getComplianceScore = (score) => {
    if (!score) return 'N/A';
    return Math.round(score);
  };

  const getComplianceScoreColor = (score) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleVendorClick = (vendorId) => {
    navigate(`/marketplace/vendors/${vendorId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('errors.failedToFetchVendors')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header with View-Only Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t('marketplace.title')}
              </h1>
              {isVendor && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  👁️ View Only
                </span>
              )}
            </div>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {t('marketplace.subtitle')}
            </p>
            {isVendor && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('marketplace.viewOnlyMode', 'View-only mode: You can browse but cannot create engagements')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Browse other vendors to understand compliance standards and market positioning
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('marketplace.searchVendors')}
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('marketplace.searchPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('marketplace.complianceStatus')}
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('marketplace.allStatuses')}</option>
                <option value="GREEN">{t('marketplace.green')}</option>
                <option value="AMBER">{t('marketplace.amber')}</option>
                <option value="RED">{t('marketplace.red')}</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('marketplace.location')}
              </label>
              <select
                id="location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">{t('marketplace.allLocations')}</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Salem">Salem</option>
                <option value="Chennai">Chennai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                {t('marketplace.search')}
              </button>
            </div>
          </div>
        </form>

        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('marketplace.showingResults', { count: vendors.length, total: pagination.total })}
        </div>
        
        {/* Vendor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                isVendor ? 'ring-2 ring-blue-200 dark:ring-blue-800 hover:ring-blue-300 dark:hover:ring-blue-700' : 'hover:ring-2 hover:ring-green-200 dark:hover:ring-green-800'
              }`}
              onClick={() => handleVendorClick(vendor.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleVendorClick(vendor.id);
                }
              }}
            >
              <div className="p-6">
                {/* Vendor Logo */}
                <div className="flex items-center justify-center h-16 mb-4">
                  <ImageWithFallback
                    src={vendor.marketplaceProfile?.logoUrl || '/src/assets/textile-factory-picture.jpeg'}
                    alt={t('marketplace.vendorLogo', { companyName: vendor.companyName })}
                    className="max-h-12 max-w-full object-contain rounded-full"
                  />
                </div>
                
                {/* Company Name */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                  {vendor.companyName}
                </h3>
                
                {/* Location */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                  📍 {vendor.factoryLocation || 'Location not specified'}
                </p>
                
                {/* Compliance Score */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vendor.overallComplianceScore >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    vendor.overallComplianceScore >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {vendor.overallComplianceScore >= 80 ? '🟢' : vendor.overallComplianceScore >= 60 ? '🟡' : '🔴'} {vendor.overallComplianceScore ? Math.round(vendor.overallComplianceScore) : 'N/A'}%
                  </span>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('marketplace.score', { score: getComplianceScore(vendor.overallComplianceScore) })}
                  </span>
                </div>

                {/* Document Count */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  📄 {t('marketplace.documentsUploaded', { count: vendor.documentCount || 0 })}
                </div>

                {/* Click indicator for all users */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md animate-pulse">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('marketplace.clickToViewDetails')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t('marketplace.previous')}
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
              {t('marketplace.page', { current: pagination.page, total: pagination.totalPages })}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {t('marketplace.next')}
            </button>
          </div>
        )}

        {/* No Results */}
        {vendors.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('marketplace.noVendorsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('marketplace.noVendorsMessage')}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
} 