import dotenv from 'dotenv';
dotenv.config();
import { listen } from './app.js';

const PORT = process.env.PORT || 3001;

listen(PORT, () => {
  console.log(`🚀 SetuAI Vendor Backend server running on port ${PORT}`);
  console.log(`📁 Static files served from: ${process.cwd()}/public`);
  console.log(`🔗 Server URL: ${process.env.SERVER_BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`📊 Health check: ${process.env.SERVER_BASE_URL || `http://localhost:${PORT}`}/health`);
}); 