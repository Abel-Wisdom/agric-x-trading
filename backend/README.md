# Agric X Trading — Backend

The backend powers the Agric X Trading website and its content management system. It provides REST API endpoints for authentication, research reports, articles, videos, agricultural services, media management, contact messages, and website settings.

## Technology Stack

- **Runtime:** Node.js
- **Server:** Express 5
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Authentication:** JSON Web Tokens (JWT)
- **Password hashing:** bcryptjs
- **Media storage:** Cloudinary
- **Email service:** Resend
- **File uploads:** Multer

## Project Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── controllers/
│   ├── generated/
│   │   └── prisma/
│   ├── lib/
│   ├── middleware/
│   └── routes/
├── prisma.config.ts
├── server.js
└── package.json
```

## Getting Started

### Prerequisites

Install the following before running the backend:

- Node.js and npm
- PostgreSQL database
- Cloudinary account for media storage
- Resend account for email functionality

### Installation

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the backend directory.

Configure the following environment variables:

```env
PORT=8000

DATABASE_URL="your_postgresql_connection_string"

JWT_SECRET="your_secure_jwt_secret"

CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

RESEND_API_KEY="your_resend_api_key"
RESEND_TEST_EMAIL="your_test_recipient_email"
RESEND_FROM_EMAIL="your_sender_email"
```

**Environment variable descriptions:**

| Variable | Description |
|---|---|
| `PORT` | Server port. Defaults to `8000` when not provided. |
| `DATABASE_URL` | PostgreSQL database connection string. |
| `JWT_SECRET` | Secret used to sign and verify authentication tokens. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `RESEND_API_KEY` | Resend API key. |
| `RESEND_TEST_EMAIL` | Recipient address used by the email service. |
| `RESEND_FROM_EMAIL` | Sender address used for outgoing email. |

Keep the `.env` file private. Never commit credentials, database connection strings, or API secrets to version control.

### Database Setup

The project uses Prisma 7 with PostgreSQL.

The Prisma configuration is defined in `prisma.config.ts`, and the database schema is located in `prisma/schema.prisma`.

Generate the Prisma Client:

```bash
npx prisma generate
```

For an existing database with committed migrations, apply migrations using:

```bash
npx prisma migrate deploy
```

During local development, create and apply a migration when the schema changes:

```bash
npx prisma migrate dev --name migration_name
```

## Running the Backend

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm start
```

By default, the API runs on:

```text
http://localhost:8000
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the server using Nodemon. |
| `npm start` | Starts the server using Node.js. |
| `npm test` | Placeholder script; automated tests are not configured yet. |

## API Overview

The backend exposes the following API route groups.

### Health Check

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Checks whether the API is running. |

### Authentication

Base path: `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Admin login. |
| PUT | `/profile` | Protected | Update admin profile. |
| PUT | `/change-password` | Protected | Change admin password. |
| GET | `/me` | Protected | Verify admin session and retrieve admin details. |

### Dashboard

Base path: `/api/dashboard`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/stats` | Protected | Retrieve dashboard statistics. |

### Research & Fieldwork

Base path: `/api/research`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/published` | Public | Retrieve published research reports. |
| GET | `/published/:slug` | Public | Retrieve a published report by slug. |
| POST | `/upload-files` | Protected | Upload research files. |
| GET | `/` | Protected | Retrieve all research reports. |
| POST | `/` | Protected | Create a research report. |
| PUT | `/:id` | Protected | Update a research report. |
| DELETE | `/:id` | Protected | Delete a research report. |

Research file upload fields:

- `cover`: maximum 1 file.
- `pdf`: maximum 1 file.
- `contentImages`: maximum 10 files.
- `contentVideos`: maximum 5 files.

### Articles & Insights

Base path: `/api/articles`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/published` | Public | Retrieve published articles. |
| GET | `/published/:slug` | Public | Retrieve a published article by slug. |
| GET | `/` | Protected | Retrieve all articles. |
| POST | `/` | Protected | Create an article. |
| PUT | `/:id` | Protected | Update an article. |
| DELETE | `/:id` | Protected | Delete an article. |

### Videos

Base path: `/api/videos`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/published` | Public | Retrieve published videos. |
| GET | `/published/:slug` | Public | Retrieve a published video by slug. |
| GET | `/` | Protected | Retrieve all videos. |
| POST | `/` | Protected | Create a video. |
| PUT | `/:id` | Protected | Update a video. |
| DELETE | `/:id` | Protected | Delete a video. |

### Services

Base path: `/api/services`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/published` | Public | Retrieve published services. |
| GET | `/` | Protected | Retrieve all services. |
| POST | `/` | Protected | Create a service. |
| PUT | `/:id` | Protected | Update a service. |
| DELETE | `/:id` | Protected | Delete a service. |

### Media Library

Base path: `/api/media`

All endpoints require admin authentication.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve media assets. |
| GET | `/:id/preview` | Preview a media asset. |
| POST | `/upload` | Upload media files. |
| DELETE | `/:id` | Delete a media asset. |

The media upload endpoint accepts up to 20 files under the `files` field.

### Contact Messages

Base path: `/api/messages`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Public | Submit a contact form message. |
| GET | `/` | Protected | Retrieve contact messages. |
| PATCH | `/:id/status` | Protected | Update message status. |
| POST | `/:id/reply` | Protected | Send a reply to a message. |
| DELETE | `/:id` | Protected | Delete a message. |

### Website Settings

Base path: `/api/settings`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Retrieve website settings. |
| PUT | `/` | Protected | Update website settings. |

## Database Models

The Prisma schema currently defines the following models:

| Model | Purpose |
|---|---|
| `Admin` | Administrator accounts and authentication details. |
| `ResearchReport` | Research and fieldwork reports. |
| `ResearchMedia` | Media associated with research reports. |
| `Article` | Insights and articles. |
| `Video` | Standalone video publications. |
| `Service` | Agricultural services. |
| `MediaAsset` | Uploaded media metadata and storage references. |
| `ContactMessage` | Messages submitted through the website. |
| `SiteSettings` | Website and company information. |

## Authentication and Security

- Admin authentication uses JSON Web Tokens.
- Passwords are handled using bcryptjs.
- Protected API routes use authentication middleware.
- The JWT secret is supplied through the environment configuration.
- Cloudinary credentials and email service credentials are kept in environment variables.

## Middleware and Server Configuration

The Express server currently includes:

- CORS configuration.
- JSON request parsing with a `10 MB` body limit.
- A root health-check endpoint.
- Registration of the API route groups.

**Deployment consideration:** The current CORS configuration allows `http://localhost:5173`. Update it to allow the deployed frontend origin before production deployment.

## External Services

- **PostgreSQL:** Persistent application database.
- **Cloudinary:** Media asset storage.
- **Resend:** Email delivery for message replies and related email functionality.

## Deployment

Production deployment requires:

1. A production PostgreSQL database.
2. Production environment variables.
3. Prisma Client generation and database migrations.
4. Configured Cloudinary and Resend credentials.
5. An updated CORS origin for the deployed frontend.
6. A production server started with `npm start`.

Deployment platform and production URLs will be documented once deployment is configured.

## Project Status

The backend provides the REST API and database functionality for the Agric X Trading website and its administration dashboard.

Automated testing and production deployment configuration remain to be completed.