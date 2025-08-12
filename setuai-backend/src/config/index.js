export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  // API Endpoints
  apiEndpoints: {
    masterIndia: {
      baseUrl: 'https://api.masterindia.co/api/v1',
      apiKey: process.env.MASTER_INDIA_API_KEY, // Store API key in .env
    },
    mca: {
      baseUrl: 'https://mca.gov.in/mca/api/v1',
    },
    tnFactories: {
      baseUrl: 'https://tnfactories.tn.gov.in/api',
    },
    esic: {
      baseUrl: 'https://www.esic.gov.in/portal/api/employer',
    },
    epfo: {
      baseUrl: 'https://unifiedportal-emp.epfindia.gov.in',
    },
    tnpcb: {
      baseUrl: 'https://www.tnpcb.gov.in',
    },
    iaf: {
      baseUrl: 'https://www.iafcertsearch.org/api',
    },
    oekoTex: {
      baseUrl: 'https://api.oeko-tex.com/v1',
    },
    gots: {
      baseUrl: 'https://api.global-standard.org/v0',
    },
    tnfrs: {
      baseUrl: 'https://tnfrs.tn.gov.in',
    },
  },
  
  // Other configurations...
  apis: {
    gst: {
      baseUrl: 'https://api.masterindia.co/api/v1/gst/gstin',
      apiKey: process.env.GST_API_KEY,
      quota: 100,
      cacheTTL: 86400 // 24 hours
    },
    mca: {
      baseUrl: 'https://mca.gov.in/mca/api/v1/companymaster',
      quota: 50,
      cacheTTL: 86400
    },
    factoryLicense: {
      baseUrl: 'https://tnfactories.tn.gov.in/api/factory-licences',
      quota: 100,
      cacheTTL: 86400
    },
    fire: {
      baseUrl: 'https://tnfrs.tn.gov.in/api/noc/status',
      quota: 60,
      cacheTTL: 86400
    },
    esic: {
      baseUrl: 'https://www.esic.gov.in/portal/api/employer/verify',
      quota: 50,
      cacheTTL: 86400
    },
    epfo: {
      baseUrl: 'https://unifiedportal-emp.epfindia.gov.in/publicPortal/estSearch',
      quota: 100,
      cacheTTL: 86400
    },
    epfoTrrn: {
      baseUrl: 'https://unifiedportal-emp.epfindia.gov.in/api/verify-trrn',
      quota: 50,
      cacheTTL: 86400
    },
    tnpcb: {
      baseUrl: 'https://www.tnpcb.gov.in/ocmms-api/consent',
      quota: 100,
      cacheTTL: 86400
    },
    tnpcbWaste: {
      baseUrl: 'https://www.tnpcb.gov.in/api/waste-auth',
      quota: 50,
      cacheTTL: 86400
    },
    iaf: {
      baseUrl: 'https://www.iafcertsearch.org/api/certificate',
      quota: 200,
      cacheTTL: 86400
    },
    oekotex: {
      baseUrl: 'https://api.oeko-tex.com/v1/certificate',
      quota: 100,
      cacheTTL: 86400
    },
    gots: {
      baseUrl: 'https://api.global-standard.org/v0/licence',
      quota: 50,
      cacheTTL: 86400
    }
  },
  verification: {
    pollInterval: process.env.VERIFICATION_POLL_INTERVAL || 5000,
    timeout: process.env.VERIFICATION_TIMEOUT || 300000,
    retryEnabled: process.env.VERIFICATION_RETRY_ENABLED === 'true',
    maxRetries: parseInt(process.env.VERIFICATION_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.VERIFICATION_RETRY_DELAY || '1000')
  }
}; 