# Agric X Trading – Frontend

The frontend application for the Agric X Trading website. It provides the public-facing company website and the administrative interface used to manage website content.

## Overview

The website presents Agric X Trading's work in agricultural research, fieldwork, agricultural inputs consultation, farmer training, and related services.

The frontend includes:

- Public company pages and navigation.
- Research reports and individual research detail pages.
- Articles and video content under Insights.
- Services and contact pages.
- An administrative dashboard for managing website content.
- Responsive layouts for desktop and mobile devices.

## Technology Stack

- **React 19** – User interface.
- **Vite 8** – Development server and build tool.
- **React Router 7** – Client-side routing.
- **Lucide React** – Icons.
- **TipTap 3** – Rich-text editing.
- **DOMPurify** – HTML sanitization.

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── admin/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── sections/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

### Main directories

| Directory | Purpose |
|---|---|
| `src/pages/` | Public website pages |
| `src/components/` | Reusable interface components |
| `src/sections/` | Page sections |
| `src/layouts/` | Shared page layouts |
| `src/admin/` | Administrative dashboard and management interface |
| `src/services/` | API and data-related services |
| `src/hooks/` | Reusable React hooks |
| `src/utils/` | Utility functions |
| `src/assets/` | Application assets |
| `public/` | Static public files |

## Public Website Routes

The application uses React Router.

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/research` | Research listing |
| `/research/:slug` | Research report details |
| `/services` | Services |
| `/insights` | Insights |
| `/insights/:slug` | Article details |
| `/insights/videos/:slug` | Video details |
| `/contact` | Contact |
| `/404` | Not-found page |

Unknown public routes redirect to the not-found page.

## Administrative Dashboard

The administration interface is accessed through `/admin/login`.

After authentication, protected routes include:

| Route | Purpose |
|---|---|
| `/admin/dashboard` | Dashboard overview and statistics |
| `/admin/research` | Research management |
| `/admin/insights` | Insights content management |
| `/admin/media` | Media library |
| `/admin/messages` | Contact message management |
| `/admin/settings` | Website settings |

The `/admin` route redirects to `/admin/dashboard`.

Administrative pages are protected by the application's authentication and route-protection logic.

## API Configuration

The frontend communicates with the Agric X Trading backend through an API base URL configured in the application.

The API URL is read from the `VITE_API_URL` environment variable when it is provided.

Otherwise, the application uses these defaults:

- **Development:** `http://localhost:8000/api`
- **Production:** `/api`

The configuration is implemented in:

```text
src/services/publicDataCache.js
```

Other API-consuming components and pages also use the configured API URL.

### Environment variable

Create a `.env` file inside the `frontend/` directory when you need to specify a custom backend API URL.

Example for local development:

```env
VITE_API_URL=http://localhost:8000/api
```

For a separately hosted backend, configure `VITE_API_URL` with the deployed backend's API base URL before building the frontend.

**Important:** The production default `/api` assumes the API is available on the same origin or is routed through an appropriate proxy. If the frontend and backend are hosted separately, configure `VITE_API_URL` accordingly.

Vite exposes variables prefixed with `VITE_` to frontend code. Do not put passwords, private API keys, database credentials, or other secrets in frontend environment variables.

## Installation

Make sure Node.js and npm are installed.

From the project root, enter the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

## Running the Development Server

Start the Vite development server:

```bash
npm run dev
```

The application normally runs at:

```text
http://localhost:5173
```

The backend should also be running for features that require API access.

## Available Scripts

Run these commands from the `frontend/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint checks |

### Production build

To create a production build:

```bash
npm run build
```

Vite generates the production files in:

```text
frontend/dist/
```

The `dist/` directory is generated output and is excluded from Git.

## Public Content and Data

The frontend retrieves public research reports, articles, and videos from the backend.

The public data cache is implemented in:

```text
src/services/publicDataCache.js
```

The cache uses in-memory storage and session storage. Its configured cache duration and background refresh interval are three minutes.

The service also supports prefetching and refreshing public collections when relevant browser events occur, such as the application regaining focus or network connectivity.

## Content Management

The administrative interface communicates with the backend to manage website content and settings.

Management areas include:

- Research reports and associated media.
- Insights content.
- Media library assets.
- Contact messages.
- Website settings.

Research report creation currently requires a cover image and a PDF document. Published research detail pages provide an embedded PDF reading experience, with downloading optional.

## Deployment Notes

Before deploying the frontend:

1. Run `npm run lint` and address relevant errors.
2. Run `npm run build` and confirm that the production build succeeds.
3. Configure `VITE_API_URL` for the deployed backend.
4. Ensure the backend permits requests from the deployed frontend origin.
5. Deploy the generated `dist/` directory using the selected hosting platform.
6. Configure the hosting platform to serve the application correctly when visitors navigate directly to client-side routes.

The deployment platform and production API configuration should be confirmed before deployment.

## Related Documentation

- [Main Project Documentation](../README.md)
- [Backend Documentation](../backend/README.md)

## Project Status

The frontend is part of the Agric X Trading website project. Production deployment and hosting configuration are separate steps and should be completed after the deployment architecture has been agreed upon.
