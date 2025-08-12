import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocalization } from '../contexts/LocalizationContext';
import * as api from '../api/index.js';

export default function InvoiceDisplay({ invoice, onRatingSubmitted }) {
  const { t } = useLocalization();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.rateInvoice(invoice.id, { rating, review });
      if (response.data.success) {
        setShowRatingModal(false);
        setRating(0);
        setReview('');
        onRatingSubmitted?.(response.data.data.rating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value, interactive = false, onChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : 'span'}
            onClick={interactive ? () => onChange?.(star) : undefined}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!interactive}
          >
            <svg
              className={`w-5 h-5 ${
                star <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Invoice</h2>
            <p className="text-green-100">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right text-white">
            <p className="text-sm text-green-100">Date</p>
            <p className="font-semibold">{formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Extraction Quality */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
            <p className={`text-lg font-semibold ${getConfidenceColor(invoice.confidence)}`}>
              {(invoice.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
            <p className={`text-lg font-semibold ${getQualityColor(invoice.extractionQuality)}`}>
              {invoice.extractionQuality}
            </p>
          </div>
        </div>

        {/* Vendor & Buyer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vendor</h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">{invoice.vendorName}</p>
              {invoice.vendorAddress && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.vendorAddress}</p>
              )}
              {invoice.vendorGstin && (
                <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN: {invoice.vendorGstin}</p>
              )}
              {invoice.vendorPhone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {invoice.vendorPhone}</p>
              )}
              {invoice.vendorEmail && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Email: {invoice.vendorEmail}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Buyer</h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">{invoice.buyerName}</p>
              {invoice.buyerAddress && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.buyerAddress}</p>
              )}
              {invoice.buyerGstin && (
                <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN: {invoice.buyerGstin}</p>
              )}
              {invoice.buyerPhone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {invoice.buyerPhone}</p>
              )}
              {invoice.buyerEmail && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Email: {invoice.buyerEmail}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Items</h3>
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(invoice.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className="text-green-600 dark:text-green-400">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.paymentTerms || invoice.paymentMethod || invoice.notes) && (
          <div className="space-y-3">
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Terms</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Method</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.paymentMethod}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Notes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Ratings */}
        {invoice.ratings && invoice.ratings.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Ratings</h3>
            <div className="space-y-3">
              {invoice.ratings.map((rating) => (
                <div key={rating.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{rating.rater.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {renderStars(rating.rating)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {rating.rating}/5
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.review && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{rating.review}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Invoice Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowRatingModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Rate This Invoice
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm"></div>
            </div>

            <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Rate Invoice
                  </h3>
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rating
                    </label>
                    <div className="flex justify-center">
                      {renderStars(rating, true, setRating)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review (Optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Share your experience with this invoice..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  disabled={isSubmitting || rating === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 