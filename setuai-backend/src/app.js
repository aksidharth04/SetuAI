import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './api/auth/auth.routes.js';
import vendorRoutes from './api/vendor/vendor.routes.js';
import complianceRoutes from './api/compliance/compliance.routes.js';
import documentRoutes from './api/document/document.routes.js';
import profileRoutes from './api/profile/profile.routes.js';
import marketplaceRoutes from './api/marketplace/marketplace.routes.js';
import engagementRoutes from './api/engagement/engagement.routes.js';
import invoiceRoutes from './api/invoice/invoice.routes.js';
import wageVerificationRoutes from './api/wage-verification/wage-verification.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SetuAI Vendor Backend is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/wage-verification', wageVerificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export function listen(port, cb) {
  app.listen(port, cb);
} 