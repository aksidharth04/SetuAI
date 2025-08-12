import React from 'react';
import { useParams } from 'react-router-dom';
import { useLocalization } from '../contexts/LocalizationContext';
import Layout from '../components/Layout';

export default function PolicyPage() {
  const { policyType } = useParams();
  const { t } = useLocalization();

  const getPolicyContent = () => {
    switch (policyType) {
      case 'privacy-policy':
        return {
          title: t('footer.privacyPolicy'),
          content: `
            <h2>Privacy Policy</h2>
            <p>Last updated: ${new Date().toLocaleDateString()}</p>
            
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, upload documents, or contact us for support.</p>
            
            <h3>2. How We Use Your Information</h3>
            <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
            
            <h3>3. Information Sharing</h3>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
            
            <h3>4. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h3>5. Your Rights</h3>
            <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
          `
        };
      case 'terms-of-service':
        return {
          title: t('footer.termsOfService'),
          content: `
            <h2>Terms of Service</h2>
            <p>Last updated: ${new Date().toLocaleDateString()}</p>
            
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using SetuAI, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h3>2. Use License</h3>
            <p>Permission is granted to temporarily download one copy of SetuAI for personal, non-commercial transitory viewing only.</p>
            
            <h3>3. Disclaimer</h3>
            <p>The materials on SetuAI are provided on an 'as is' basis. SetuAI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            
            <h3>4. Limitations</h3>
            <p>In no event shall SetuAI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SetuAI.</p>
            
            <h3>5. Revisions and Errata</h3>
            <p>The materials appearing on SetuAI could include technical, typographical, or photographic errors. SetuAI does not warrant that any of the materials on its website are accurate, complete or current.</p>
          `
        };
      case 'cookie-policy':
        return {
          title: t('footer.cookiePolicy'),
          content: `
            <h2>Cookie Policy</h2>
            <p>Last updated: ${new Date().toLocaleDateString()}</p>
            
            <h3>1. What Are Cookies</h3>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.</p>
            
            <h3>2. How We Use Cookies</h3>
            <p>We use cookies to:</p>
            <ul>
              <li>Remember your preferences and settings</li>
              <li>Analyze how you use our website</li>
              <li>Provide personalized content and advertisements</li>
              <li>Improve our services</li>
            </ul>
            
            <h3>3. Types of Cookies We Use</h3>
            <p><strong>Essential Cookies:</strong> These cookies are necessary for the website to function properly.</p>
            <p><strong>Analytics Cookies:</strong> These cookies help us understand how visitors interact with our website.</p>
            <p><strong>Preference Cookies:</strong> These cookies remember your choices and preferences.</p>
            
            <h3>4. Managing Cookies</h3>
            <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>
            
            <h3>5. Third-Party Cookies</h3>
            <p>Some cookies are placed by third-party services that appear on our pages. We do not control these cookies and they are subject to the third party's privacy policy.</p>
          `
        };
      default:
        return {
          title: 'Policy Not Found',
          content: '<p>The requested policy page could not be found.</p>'
        };
    }
  };

  const policy = getPolicyContent();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />
        </div>
      </div>
    </Layout>
  );
}
