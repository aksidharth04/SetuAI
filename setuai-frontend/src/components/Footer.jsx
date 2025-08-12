import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();
  const { t } = useLocalization();

  const handleContactUs = () => {
    const subject = encodeURIComponent('SetuAI Support Request');
    const body = encodeURIComponent(`Hello,\n\nI need assistance with SetuAI. Please provide the following information:\n\n1. What issue are you experiencing?\n2. What steps have you already tried?\n3. Any error messages you're seeing?\n4. Your user ID (if applicable)\n\nThank you for your assistance.\n\nBest regards,\n[Your Name]`);
    const mailtoLink = `mailto:aksidharthm10@gmail.com?subject=${subject}&body=${body}`;
    window.open(mailtoLink, '_blank');
  };

  const handleDocumentation = () => {
    window.open('/help', '_blank');
  };

  const handleAPIReference = () => {
    // Open API documentation in a new tab
    window.open('https://docs.setuai.com/api', '_blank');
  };

  const handleStatus = () => {
    // Open system status page
    window.open('https://status.setuai.com', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('/policy/privacy-policy', '_blank');
  };

  const handleTermsOfService = () => {
    window.open('/policy/terms-of-service', '_blank');
  };

  const handleCookiePolicy = () => {
    window.open('/policy/cookie-policy', '_blank');
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent font-bold text-xl">
                SetuAI
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://x.com/aks2082?s=11" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Follow us on X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/in/adicherikandi-sidharth/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Connect with us on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {t('footer.platform')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('navigation.dashboard')}
                </Link>
              </li>
              {user?.role === 'VENDOR_ADMIN' && (
                <li>
                  <Link to="/marketplace" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    {t('marketplace.title')}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/reports" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('navigation.reports')}
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {t('navigation.help')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              {t('footer.support')}
            </h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={handleContactUs}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('footer.contactUs')}
                </button>
              </li>
              <li>
                <button 
                  onClick={handleDocumentation}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('footer.documentation')}
                </button>
              </li>
              <li>
                <button 
                  onClick={handleAPIReference}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('footer.apiReference')}
                </button>
              </li>
              <li>
                <button 
                  onClick={handleStatus}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t('footer.status')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('footer.allRightsReserved', { year: currentYear })}
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <button 
                onClick={handlePrivacyPolicy}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                {t('footer.privacyPolicy')}
              </button>
              <button 
                onClick={handleTermsOfService}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                {t('footer.termsOfService')}
              </button>
              <button 
                onClick={handleCookiePolicy}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                {t('footer.cookiePolicy')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 