import React from 'react';
import VerificationBadge from './VerificationBadge';

const UploadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 13.3333L10 10M10 10L6.66667 13.3333M10 10V17.5M16.9917 15.3583C17.8033 14.6534 18.3333 13.6283 18.3333 12.5C18.3333 10.2909 16.5424 8.5 14.3333 8.5C14.1178 8.5 13.9065 8.51858 13.7018 8.5542C13.0999 6.98279 11.6668 5.83333 10 5.83333C7.78595 5.83333 6 7.61929 6 9.83333C6 10.0489 6.01858 10.2601 6.0542 10.4648C4.48279 11.0668 3.33333 12.4999 3.33333 14.1667C3.33333 16.3758 5.12424 18.1667 7.33333 18.1667" 
      stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ViewIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" 
      stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.04834 10C3.11001 6.61919 6.26917 4.16669 10 4.16669C13.7317 4.16669 16.89 6.61919 17.9517 10C16.89 13.3809 13.7317 15.8334 10 15.8334C6.26917 15.8334 3.11001 13.3809 2.04834 10Z" 
      stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6.66669V10L12.5 12.5M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" 
      stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.6667 4H9.33333C7.86667 4 6.66667 5.2 6.66667 6.66667V25.3333C6.66667 26.8 7.86667 28 9.33333 28H22.6667C24.1333 28 25.3333 26.8 25.3333 25.3333V10.6667L18.6667 4Z" 
      className="fill-primary-100 stroke-primary-600" strokeWidth="2"/>
    <path d="M18.6667 4V10.6667H25.3333" stroke="currentColor" className="stroke-primary-600" strokeWidth="2"/>
    <path d="M20 16H12M20 21.3333H12" className="stroke-primary-600" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6.66669V10" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
    <path d="M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round"/>
    <path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" 
      stroke="currentColor" strokeWidth="1.67"/>
  </svg>
);

export default function DocumentCard({ 
  item, 
  doc, 
  uploadingId, 
  disableUpload, 
  onUpload, 
  onViewHistory, 
  uploadStatus 
}) {
  // Allow upload if document is rejected or no document exists
  const canUpload = !doc || doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'EXPIRED';
  
  return (
    <div className="card animate-lift">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <DocumentIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-x-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary truncate">
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                {item.issuingAuthority && (
                  <span>Issuing Authority: {item.issuingAuthority}<br /></span>
                )}
                Pillar: {item.pillar.replace(/_/g, ' ')}
              </p>
            </div>
            {doc && (
              <div className="shrink-0">
                <VerificationBadge status={doc.verificationStatus} />
              </div>
            )}
          </div>

          {/* Show verification summary for rejected documents */}
          {doc?.verificationStatus === 'REJECTED' && doc?.verificationSummary && (
            <div className="mt-2 p-2 bg-status-error-bg rounded-lg border border-status-error-border">
              <div className="flex items-start gap-2 text-status-error-text">
                <div className="shrink-0 mt-0.5">
                  <ErrorIcon />
                </div>
                <p className="text-sm">
                  {doc.verificationSummary}
                </p>
              </div>
            </div>
          )}

          {uploadStatus[item.id] && (
            <p className={`mt-2 text-sm ${
              uploadStatus[item.id].includes('success')
                ? 'text-status-verified-text'
                : 'text-status-error-text'
            }`}>
              {uploadStatus[item.id]}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="inline-block">
              <button
                className={`btn ${!canUpload ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => document.getElementById(`file-input-${item.id}`).click()}
                disabled={uploadingId === item.id || !canUpload}
              >
                <UploadIcon />
                {uploadingId === item.id ? 'Uploading...' : 'Upload'}
              </button>
              <input
                id={`file-input-${item.id}`}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => onUpload(e, item.id)}
              />
            </label>

            {doc?.filePath && (
              <a
                href={doc.filePath.startsWith('http') ? doc.filePath : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}${doc.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ViewIcon />
                View
              </a>
            )}

            {doc?.history?.length > 0 && (
              <button
                onClick={() => onViewHistory(item)}
                className="btn btn-outline"
              >
                <HistoryIcon />
                History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 