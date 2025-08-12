import React, { useRef } from 'react';
import Button from './Button';

const getStatusIcon = (status) => {
  switch (status?.toUpperCase()) {
    case 'VERIFIED':
      return (
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'REJECTED':
      return (
        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'PENDING':
      return (
        <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
  }
};

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'VERIFIED': 
      return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
    case 'REJECTED': 
      return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
    case 'PENDING': 
      return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
    default: 
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  }
};

// Separate component for each document row
const DocumentUploadRow = ({ doc, uploadingId, disableUpload, onUpload, onViewHistory, uploadStatus }) => {
  const fileInputRef = useRef(null);
  const latestUpload = doc.uploadedDocuments?.[0];
  const isUploading = uploadingId === doc.id;
  const status = latestUpload?.verificationStatus || 'NEW';
  const statusText = uploadStatus && isUploading ? uploadStatus[doc.id] : status;

  return (
    <li className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {statusText}
            </span>
          </div>
          {latestUpload && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(latestUpload.uploadedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="ml-4 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
            style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
            onChange={(e) => {
              try {
                if (e.target.files && e.target.files[0]) {
                  onUpload(e, doc.id);
                }
              } catch (error) {
                console.error('Upload error:', error);
              } finally {
                e.target.value = '';
              }
            }}
            disabled={isUploading || disableUpload}
            accept=".pdf,.jpg,.jpeg,.png"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disableUpload}
            className="min-w-[100px] justify-center"
            icon={
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
            }
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          {latestUpload && (
            <Button
              variant="primary"
              onClick={() => onViewHistory(doc)}
              className="min-w-[100px] justify-center"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              History
            </Button>
          )}
        </div>
      </div>
    </li>
  );
};

// Main DocumentList component
export default function DocumentList({ documents, uploadingId, disableUpload, onUpload, onViewHistory, uploadStatus }) {
  return (
    <ul className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700">
      {documents.map((doc) => (
        <DocumentUploadRow
          key={doc.id}
          doc={doc}
          uploadingId={uploadingId}
          disableUpload={disableUpload}
          onUpload={onUpload}
          onViewHistory={onViewHistory}
          uploadStatus={uploadStatus}
        />
      ))}
    </ul>
  );
}