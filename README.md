# 🚀 SetuAI - Smart Compliance Management System

<div align="center">

![SetuAI Logo](https://img.shields.io/badge/SetuAI-Smart%20Compliance-blue?style=for-the-badge&logo=shield-check)
![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue?style=for-the-badge&logo=postgresql)
![AI Powered](https://img.shields.io/badge/AI%20Powered-Gemini%20AI-orange?style=for-the-badge&logo=google)

**Intelligent compliance management powered by AI**  
*Making regulatory compliance effortless and accurate*

[![GitHub stars](https://img.shields.io/github/stars/hemang-doshi/setuai?style=social)](https://github.com/hemang-doshi/setuai)
[![GitHub forks](https://img.shields.io/github/forks/hemang-doshi/setuai?style=social)](https://github.com/hemang-doshi/setuai)
[![GitHub issues](https://img.shields.io/github/issues/hemang-doshi/setuai)](https://github.com/hemang-doshi/setuai/issues)
[![GitHub license](https://img.shields.io/github/license/hemang-doshi/setuai)](https://github.com/hemang-doshi/setuai/blob/main/LICENSE)

</div>

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Smart Document Verification** using Google Gemini AI
- **Real-time OCR Processing** for text extraction
- **Intelligent Risk Assessment** with confidence scoring
- **Automated Compliance Analysis** across multiple document types

### 📊 Smart Analytics & Scoring
- **Real-time Compliance Scoring** with risk assessment
- **Historical Analysis** for trend identification
- **Pillar-based Evaluation** across different compliance areas
- **Predictive Insights** for compliance optimization

### 🔄 Real-time Updates
- **Live Status Tracking** without page refresh
- **Smart Polling System** for automatic updates
- **Instant Notifications** for compliance alerts
- **Real-time Document Processing** status

### 📱 Modern User Experience
- **Responsive Design** for all devices
- **Intuitive Dashboard** with clean interface
- **Document Preview** with built-in viewer
- **Smart Notifications** with AI-powered suggestions

### 🔒 Enterprise Security
- **JWT Authentication** with secure token management
- **Role-based Access Control** for different user types
- **Secure File Upload** with validation
- **Complete Audit Trail** for all document changes

---

## 🛠️ Tech Stack

<div align="center">

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui&logoColor=white)

### AI & Services
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-FF6B6B?style=for-the-badge&logo=multer&logoColor=white)

</div>

---

## 🚀 Quick Start

### Prerequisites

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue?style=flat-square)
![Git](https://img.shields.io/badge/Git-2.30+-red?style=flat-square)

</div>

### 🎯 Installation

```bash
# Clone the repository
git clone https://github.com/hemang-doshi/setuai.git
cd setuai

# Install backend dependencies
cd setuai-backend
npm install

# Install frontend dependencies
cd ../setuai-frontend
npm install
```

### ⚙️ Configuration

#### Backend Setup
```bash
cd setuai-backend

# Create environment file
cp .env.example .env

# Configure your .env file
DATABASE_URL="postgresql://username:password@localhost:5432/setuai"
JWT_SECRET="your-super-secret-jwt-key"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3001
```

#### Frontend Setup
```bash
cd setuai-frontend

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:3001" > .env
```

### 🗄️ Database Setup

```bash
cd setuai-backend

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

### 🚀 Running the Application

```bash
# Start backend server (Terminal 1)
cd setuai-backend
npm start

# Start frontend development server (Terminal 2)
cd setuai-frontend
npm run dev
```

Visit `http://localhost:5173` to access the application!

---

## 📁 Project Structure

```
setuai/
├── 🖥️  setuai-backend/          # Backend API server
│   ├── 📁 src/
│   │   ├── 🛣️  api/            # API routes & controllers
│   │   ├── ⚙️  services/       # Business logic & AI services
│   │   ├── 🔐 middleware/     # Authentication & security
│   │   └── ⚙️  config/         # Configuration files
│   ├── 🗄️  prisma/             # Database schema & migrations
│   └── 📁 public/             # Static files & uploads
├── 🎨 setuai-frontend/        # React frontend application
│   ├── 📁 src/
│   │   ├── 🧩 components/     # Reusable UI components
│   │   ├── 📄 pages/          # Page components
│   │   ├── 🔄 contexts/       # React state management
│   │   └── 🌐 api/            # API client configuration
│   └── 📁 public/             # Static assets
└── 📖 README.md
```

---

## 🎯 Key Features

### 📋 Document Management
- **Multi-format Support**: PDF, JPG, PNG, DOC files
- **Smart Upload**: Drag & drop with progress tracking
- **Version Control**: Complete document history
- **Preview System**: Built-in document viewer

### 🤖 AI Verification
- **OCR Processing**: Text extraction from images
- **Content Analysis**: AI-powered document verification
- **Confidence Scoring**: Reliability metrics for verification
- **Multi-language Support**: Handles various document languages

### 📊 Compliance Analytics
- **Risk Assessment**: Real-time compliance scoring
- **Trend Analysis**: Historical compliance patterns
- **Pillar Evaluation**: Different compliance areas
- **Predictive Insights**: Future compliance recommendations

### 🔔 Smart Notifications
- **Real-time Alerts**: Instant status updates
- **AI Suggestions**: Smart compliance recommendations
- **Priority System**: Critical, high, medium, low alerts
- **Action Items**: Specific recommendations for improvement

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/setuai"

# Security
JWT_SECRET="your-super-secret-jwt-key"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
```

---

## 📊 Database Schema

### Core Models
- **👤 User**: Authentication and user management
- **🏢 Vendor**: Business entity information
- **📄 ComplianceDocument**: Available document types
- **📤 UploadedDocument**: User documents with verification status
- **📝 AuditLog**: Complete audit trail

### Key Relationships
```
User → Vendor → UploadedDocument → ComplianceDocument
                ↓
            AuditLog
```

---

## 🚀 Deployment

### Backend Deployment
1. **Database Setup**: Configure PostgreSQL
2. **Environment Variables**: Set production values
3. **Dependencies**: Install with `npm install --production`
4. **Migrations**: Run `npx prisma migrate deploy`
5. **Start Server**: Use PM2 or similar process manager

### Frontend Deployment
1. **Build**: Run `npm run build`
2. **Static Files**: Serve from `dist/` directory
3. **Environment**: Configure production API endpoint
4. **CDN**: Optional CDN for static assets

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

<div align="center">

### Need Help?
[![GitHub Issues](https://img.shields.io/badge/GitHub-Issues-red?style=for-the-badge&logo=github)](https://github.com/hemang-doshi/setuai/issues)
[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-blue?style=for-the-badge&logo=github)](https://github.com/hemang-doshi/setuai/discussions)

### Connect With Us
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/hemang-doshi)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hemangdoshi@gmail.com)

</div>

---

<div align="center">

**Made with ❤️ by [Hemang Doshi](https://github.com/hemang-doshi)**

![GitHub followers](https://img.shields.io/github/followers/hemang-doshi?label=Follow&style=social)
![GitHub stars](https://img.shields.io/github/stars/hemang-doshi/setuai?style=social)

*SetuAI - Making compliance management smarter with AI* 🚀

</div> 