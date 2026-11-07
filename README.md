# Agric X Trading

A full-stack website for Agric X Trading, an agricultural research and consulting company. The platform presents the company's work, services, research activities, publications, and media while providing an administrative dashboard for managing website content.

## Project Overview

The website is designed to communicate Agric X Trading's work in:

- Agricultural research and field investigations.
- Agricultural inputs consultation.
- Farmer training and agricultural education.
- Field exploration and engagement with farmers from different locations and backgrounds.
- Research documentation and the publication of agricultural insights.

The platform includes a public-facing website and a protected content-management area.

## Main Features

### Public Website

- Home page introducing the company and its work.
- About page presenting the company's background and approach.
- Research & Fieldwork section for published research reports.
- Services page describing the company's services.
- Insights section for articles and publications.
- Video content section.
- Contact page for enquiries.
- Individual detail pages for research reports, articles, and videos.

### Content Management

The administrative dashboard provides tools for managing website content, including:

- Research reports.
- Articles and insights.
- Videos.
- Media assets.
- Contact messages.
- Website settings.

The dashboard also provides an overview of content and message activity.

### Research and Publication Experience

- Published research, articles, and videos are retrieved from the backend API.
- Public content is cached to improve the browsing experience.
- Cached content is refreshed periodically and when the browser regains focus or connectivity.
- Research reports are presented through the public research experience using uploaded documents.

## Technology Stack

### Frontend

- React 19
- Vite 8
- React Router 7
- TipTap editor
- DOMPurify
- Lucide React

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Neon PostgreSQL hosting

### External Services

- Cloudinary for media storage.
- Resend for email delivery.

## Repository Structure

```text
agric-x-trading/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── README.md
```

The frontend and backend have separate dependencies, configuration, and setup instructions.

## Getting Started

To run the application locally, configure and start the backend and frontend separately.

### 1. Backend

Follow the instructions in [Backend Documentation](backend/README.md).

### 2. Frontend

Follow the instructions in [Frontend Documentation](frontend/README.md).

## Environment Configuration

The application uses environment variables for configuration, including database access, API communication, media storage, and email services.

Do not commit actual `.env` files, database credentials, API keys, access tokens, or other secrets to version control.

Use the relevant example environment files and documentation when configuring each application.

## Development API Configuration

The frontend supports the `VITE_API_URL` environment variable.

If it is not provided, the frontend uses:

- Development: `http://localhost:8000/api`
- Production: `/api`

The production API address can be configured through `VITE_API_URL` when required by the deployment architecture.

## Documentation

- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)

## Deployment

Deployment instructions will be added after the frontend and backend configuration, environment variables, and production requirements have been documented and verified.

## Project Status

This repository contains the frontend and backend applications for the Agric X Trading website. Refer to the individual application documentation for setup and implementation details.