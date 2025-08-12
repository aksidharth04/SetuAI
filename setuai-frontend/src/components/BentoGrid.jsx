export default function BentoGrid({ documents = [] }) {
  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = doc.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CategoryCard = ({ title, docs, isLarge = false, position = 'center' }) => (
    <div className={`relative ${isLarge ? 'lg:row-span-2 lg:self-center' : ''}`}>
      <div className="absolute inset-px rounded-lg bg-white" />
          <div className="relative flex flex-col rounded-lg shadow-sm border border-gray-200/50 h-[200px] hover:border-green-200/50 transition-colors">
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {docs.length} document{docs.length !== 1 ? 's' : ''}
                </p>
              </div>
              {docs.some(doc => doc.uploadedDocuments?.[0]?.verificationStatus === 'VERIFIED') && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 px-6 py-4 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="space-y-3">
            {docs.map((doc) => {
              const latestUpload = doc.uploadedDocuments?.[0];
              return (
                <div key={doc.id} className="group flex items-center justify-between rounded-md p-2 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-gray-900">{doc.name}</h4>
                    {latestUpload && (
                      <p className="text-xs text-gray-500">
                        Updated {new Date(latestUpload.uploadedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {latestUpload && (
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      getStatusColor(latestUpload.verificationStatus)
                    }`}>
                      {latestUpload.verificationStatus}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-base/7 font-semibold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">Document Categories</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-3xl font-semibold tracking-tight text-balance text-gray-900">
          Compliance Document Overview
        </p>
        <div className="mt-10 sm:mt-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Top box */}
            <div className="md:col-span-4 md:flex md:justify-center">
              <div className="w-full md:w-[calc(50%-0.5rem)]">
                <CategoryCard
                  title="Environmental Compliance"
                  docs={[
                    ...(documentsByCategory['TNPCB'] || []),
                    ...(documentsByCategory['Hazardous'] || [])
                  ]}
                  position="top"
                />
              </div>
            </div>

            {/* Middle boxes */}
            <div className="md:col-start-1 md:col-span-2">
              <CategoryCard
                title="Government Registrations"
                docs={[
                  ...(documentsByCategory['EPF'] || []),
                  ...(documentsByCategory['ESIC'] || []),
                  ...(documentsByCategory['Factory'] || [])
                ]}
                position="left"
              />
            </div>
            <div className="md:col-start-3 md:col-span-2">
              <CategoryCard
                title="Safety Certifications"
                docs={[
                  ...(documentsByCategory['Fire'] || []),
                  ...(documentsByCategory['ISO'] || [])
                ]}
                position="right"
              />
            </div>

            {/* Bottom box */}
            <div className="md:col-span-4 md:flex md:justify-center">
              <div className="w-full md:w-[calc(50%-0.5rem)]">
                <CategoryCard
                  title="Quality Standards"
                  docs={[
                    ...(documentsByCategory['GOTS'] || []),
                    ...(documentsByCategory['OEKO-TEX'] || []),
                    ...(documentsByCategory['ISO 9001'] || [])
                  ]}
                  position="bottom"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  