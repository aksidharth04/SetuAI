import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Toast from '../components/Toast';
import * as api from '../api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    companyDescription: '',
    contactEmail: '',
    websiteUrl: '',
    logoUrl: ''
  });
  
  const [publishStatus, setPublishStatus] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.getProfile();
      
      if (response.data.success) {
        const vendor = response.data.data.vendor;
        setPublishStatus(vendor.isPublished);
        
        if (vendor.marketplaceProfile) {
          setFormData({
            companyDescription: vendor.marketplaceProfile.companyDescription || '',
            contactEmail: vendor.marketplaceProfile.contactEmail || '',
            websiteUrl: vendor.marketplaceProfile.websiteUrl || '',
            logoUrl: vendor.marketplaceProfile.logoUrl || ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      const response = await api.updateProfile(formData);
      
      if (response.data.success) {
        showToast('success', 'Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
      showToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setPublishing(true);
      setError('');
      
      const response = await api.togglePublish();
      
      if (response.data.success) {
        setPublishStatus(response.data.data.isPublished);
        showToast('success', response.data.message);
      }
    } catch (err) {
      console.error('Error toggling publish status:', err);
      setError(err.response?.data?.error || 'Failed to toggle publish status');
      showToast('error', 'Failed to toggle publish status');
    } finally {
      setPublishing(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('profile.marketplaceProfile')}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {t('profile.marketplaceProfileSubtitle')}
            </p>
          </div>
          
          {/* Publish Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {publishStatus ? t('profile.published') : t('profile.draft')}
            </span>
            <button
              onClick={handleTogglePublish}
              disabled={publishing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                publishStatus ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
              } ${publishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  publishStatus ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {publishing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            )}
          </div>
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

        {/* Profile Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('profile.companyInfo')}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {t('profile.companyDescriptionHelp')}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Description */}
              <div className="md:col-span-2">
                <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.companyDescription')}
                </label>
                <textarea
                  id="companyDescription"
                  name="companyDescription"
                  rows={4}
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  placeholder={t('profile.companyDescriptionPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('profile.companyDescriptionHelp')}
                </p>
              </div>

              {/* Contact Email */}
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.contactEmail')}
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder={t('profile.contactEmailPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourcompany.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Logo URL */}
              <div className="md:col-span-2">
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://yourcompany.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Provide a direct link to your company logo (PNG, JPG, or SVG recommended)
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                icon={
                  saving ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )
                }
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        {publishStatus && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Profile is Published
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Your profile is visible to buyers in the marketplace. Any changes you make will be saved as a draft until you publish again.
                </p>
              </div>
            </div>
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
    </Layout>
  );
} 