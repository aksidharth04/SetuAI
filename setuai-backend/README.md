# SetuAI Vendor Backend

SetuAI is an innovative, AI-powered ethical compliance engine designed to address critical gaps in India's vast textile supply chain. This backend serves the vendor-facing application, enabling Tier 2+ textile vendors to streamline their journey towards audit readiness.

## Features

- **Vendor Registration & Authentication**: Secure JWT-based authentication system
- **Document Upload & Management**: Local file storage with unique filename generation
- **Compliance Tracking**: Comprehensive compliance document checklist and status tracking
- **Audit Logging**: Complete audit trail for all document operations
- **Profile Management**: Vendor profile management with compliance statistics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer with local storage
- **Validation**: Built-in Express validation

## Project Structure

```
setuai-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── uploads/               # File upload directory
├── src/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── vendor/            # Vendor management endpoints
│   │   ├── compliance/        # Compliance checklist endpoints
│   │   └── document/          # Document upload endpoints
│   ├── middleware/
│   │   └── auth.middleware.js # JWT authentication middleware
│   ├── services/
│   │   ├── database.service.js # Prisma client
│   │   └── upload.service.js   # File upload configuration
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Server
PORT=3001
SERVER_BASE_URL=http://localhost:3001

# Security
JWT_SECRET="your-super-secret-jwt-key-for-setuai-local"
SALT_ROUNDS=10
```

### 3. Database Setup

Initialize Prisma and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Initial Data

Seed the compliance checklist:

```bash
curl -X POST http://localhost:3001/api/compliance/seed
```

### 5. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new vendor
- `POST /api/auth/login` - Login vendor
- `GET /api/auth/profile` - Get user profile (protected)

### Vendor Management

- `GET /api/vendor/profile` - Get vendor profile with documents (protected)
- `PUT /api/vendor/profile` - Update vendor profile (protected)
- `GET /api/vendor/compliance-status` - Get compliance status (protected)

### Compliance

- `GET /api/compliance/checklist` - Get compliance document checklist
- `POST /api/compliance/seed` - Seed initial compliance data

### Document Management

- `POST /api/document/upload` - Upload compliance document (protected)
- `GET /api/document/vendor-documents` - Get vendor's uploaded documents (protected)

## Database Schema

The application uses a normalized database schema with the following key entities:

- **User**: Vendor administrators with authentication
- **Vendor**: Company information and compliance status
- **ComplianceDocument**: Master list of required compliance documents
- **UploadedDocument**: Vendor's uploaded compliance documents
- **AuditLog**: Complete audit trail for document operations

## File Upload

- Files are stored locally in `public/uploads/`
- Supported formats: JPEG, PNG, GIF, PDF, DOC, DOCX
- Maximum file size: 10MB
- Unique filenames generated to prevent collisions
- Files accessible via: `{SERVER_BASE_URL}/uploads/{filename}`

## Security Features

- JWT-based authentication with configurable expiration
- Password hashing with bcryptjs
- File type validation
- File size limits
- Protected routes with middleware
- Audit logging for all document operations

## Development

### Running in Development

```bash
npm run dev
```

The server will start with nodemon for automatic restarts on file changes.

### Database Migrations

```bash
npx prisma migrate dev --name migration_name
```

### Prisma Studio

View and edit database data:

```bash
npx prisma studio
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper database connection
4. Set up proper file storage (consider cloud storage for production)
5. Configure reverse proxy (nginx) for static file serving
6. Set up SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License 