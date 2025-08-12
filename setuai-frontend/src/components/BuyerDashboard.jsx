import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../contexts/LocalizationContext';
import Layout from './Layout';
import * as api from '../api';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await api.getMarketplaceVendors(params);
      
      if (response.data.success) {
        setVendors(response.data.data.vendors);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages
        }));
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err.response?.data?.error || t('errors.failedToFetchVendors'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [pagination.page, searchTerm, statusFilter, locationFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleVendorClick = (vendorId) => {
    navigate(`/marketplace/vendors/${vendorId}`);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'GREEN':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'AMBER':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'RED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getComplianceScore = (score) => {
    if (!score) return 'N/A';
    return `${Math.round(score)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('marketplace.title')}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {t('marketplace.subtitle')}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
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
                  <option value="Erode">Erode</option>
                  <option value="Tirupur">Tirupur</option>
                  <option value="Karur">Karur</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Thoothukudi">Thoothukudi</option>
                  <option value="Namakkal">Namakkal</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
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
        </div>

        {/* Error Message */}
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('marketplace.showingResults', { count: vendors.length, total: pagination.total })}
            </div>

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  onClick={() => handleVendorClick(vendor.id)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Vendor Logo */}
                  <div className="flex items-center justify-center h-16 mb-4">
                    <img
                      src={vendor.marketplaceProfile?.logoUrl || `/images/vendors/textile-1.jpg`}
                      alt={t('marketplace.vendorLogo', { companyName: vendor.companyName })}
                      className="max-h-12 max-w-full object-contain rounded-full"
                                              onError={(e) => {
                          // If the main image fails, try a fallback
                          if (e.target.src.includes('textile-1.jpg')) {
                            e.target.src = '/images/vendors/textile-2.jpg';
                          } else if (e.target.src.includes('textile-2.jpg')) {
                            e.target.src = '/images/vendors/textile-3.jpg';
                          } else {
                            // If all images fail, show a simple colored div with initials
                            e.target.style.display = 'none';
                            const fallbackDiv = document.createElement('div');
                            fallbackDiv.className = 'w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg';
                            fallbackDiv.textContent = vendor.companyName.charAt(0);
                            e.target.parentNode.appendChild(fallbackDiv);
                          }
                        }}
                    />
                  </div>

                  {/* Vendor Info */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {vendor.companyName}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {vendor.factoryLocation}
                    </p>

                    {vendor.marketplaceProfile?.companyDescription && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {vendor.marketplaceProfile.companyDescription}
                      </p>
                    )}

                    {/* Compliance Status */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.complianceStatus)}`}>
                        {vendor.complianceStatus}
                      </span>
                      
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('marketplace.score', { score: getComplianceScore(vendor.overallComplianceScore) })}
                      </span>
                    </div>

                    {/* Document Count */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      📄 {t('marketplace.documentsUploaded', { count: vendor.documentCount || 0 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
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

            {/* Empty State */}
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
          </>
        )}
      </div>
    </Layout>
  );
} 