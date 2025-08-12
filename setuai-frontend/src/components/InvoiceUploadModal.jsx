import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import * as api from '../api/index.js';

export default function InvoiceUploadModal({ isOpen, onClose, engagementId, onInvoiceCreated }) {
  const { t } = useLocalization();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file type (JPEG, PNG, JPG, or PDF)');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('invoice', selectedFile);

      const response = await api.uploadInvoice(engagementId, formData);

      if (response.data.success) {
        setExtractionResult(response.data.data);
        onInvoiceCreated?.(response.data.data);
      } else {
        setError(response.data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      
      // Handle specific error types
      if (err.response?.data?.error === 'Invoice authenticity verification failed') {
        const details = err.response.data.details;
        setError(`❌ Fake Invoice Detected!\n\nAuthenticity Score: ${(details.authenticityScore * 100).toFixed(1)}%\n\nReason: ${details.reason}\n\nRed Flags:\n${details.redFlags.map(flag => `• ${flag}`).join('\n')}`);
      } else if (err.response?.data?.error === 'Invalid invoice format') {
        setError(`❌ Invalid Invoice Format!\n\n${err.response.data.details}`);
      } else {
        setError(err.response?.data?.error || 'Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractionResult(null);
    setError('');
    onClose();
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'HIGH': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
        </div>

        <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Upload Invoice
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Invoice Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 flex flex-col items-center justify-center space-y-2"
                    >
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Click to select or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        JPEG, PNG, JPG, PDF (max 10MB)
                      </span>
                    </button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    {previewUrl && (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Invoice preview"
                          className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        'Upload & Extract Invoice'
                      )}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}
              </div>

              {/* Extraction Results */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Extraction Results
                </h4>

                {extractionResult ? (
                  <div className="space-y-4">
                    {/* Confidence & Quality */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                        <p className={`text-lg font-semibold ${getConfidenceColor(extractionResult.extraction.confidence)}`}>
                          {(extractionResult.extraction.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
                        <p className={`text-lg font-semibold ${getQualityColor(extractionResult.extraction.quality)}`}>
                          {extractionResult.extraction.quality}
                        </p>
                      </div>
                    </div>

                    {/* Authenticity Verification */}
                    {extractionResult.verification && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Authenticity Verification</p>
                            <span className={`text-sm font-semibold ${
                              extractionResult.verification.isAuthentic ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {extractionResult.verification.isAuthentic ? '✅ Authentic' : '❌ Suspicious'}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                            Score: {(extractionResult.verification.authenticityScore * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {extractionResult.verification.reason}
                          </p>
                        </div>

                        {/* Authenticity Checks */}
                        {extractionResult.verification.authenticityChecks && (
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(extractionResult.verification.authenticityChecks).map(([check, passed]) => (
                              <div key={check} className="flex items-center space-x-2 text-xs">
                                <span className={passed ? 'text-green-500' : 'text-red-500'}>
                                  {passed ? '✓' : '✗'}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 capitalize">
                                  {check.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Red Flags */}
                        {extractionResult.verification.redFlags && extractionResult.verification.redFlags.length > 0 && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                              ⚠️ Red Flags Detected
                            </p>
                            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                              {extractionResult.verification.redFlags.map((flag, index) => (
                                <li key={index}>• {flag}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Invoice Preview */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Invoice Preview</h5>
                      
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Invoice #</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {extractionResult.invoice.invoiceNumber}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Date</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(extractionResult.invoice.invoiceDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Vendor</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {extractionResult.invoice.vendorName}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Buyer</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {extractionResult.invoice.buyerName}
                          </p>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(extractionResult.invoice.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Tax</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrency(extractionResult.invoice.taxAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center font-semibold text-lg">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-green-600 dark:text-green-400">
                              {formatCurrency(extractionResult.invoice.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items Preview */}
                      {extractionResult.items && extractionResult.items.length > 0 && (
                        <div className="mt-4">
                          <h6 className="font-medium text-gray-900 dark:text-white mb-2">Items</h6>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {extractionResult.items.slice(0, 3).map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 truncate">
                                  {item.description}
                                </span>
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {formatCurrency(item.totalPrice)}
                                </span>
                              </div>
                            ))}
                            {extractionResult.items.length > 3 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                +{extractionResult.items.length - 3} more items
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {extractionResult.extraction.warnings && extractionResult.extraction.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Extraction Warnings
                        </p>
                        <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                          {extractionResult.extraction.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Fields */}
                    {extractionResult.extraction.missingFields && extractionResult.extraction.missingFields.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Missing Fields
                        </p>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          {extractionResult.extraction.missingFields.map((field, index) => (
                            <li key={index}>• {field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">Upload an invoice to see extraction results</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Close
            </button>
            {extractionResult && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 