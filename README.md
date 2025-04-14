# Tech Blog with Dark Theme

## Overview

A modern, responsive blog built with Eleventy and Express.js. Features a professional dark theme with purple accents.

## Features

- Professional dark theme with purple accents
- Full-stack application with static frontend and API backend
- Tag-based filtering and post categorization
- Admin panel for content management
- Responsive layout for all device sizes
- Markdown support for blog posts

## Prerequisites

- Node.js (v14 or later)
- npm
- MySQL database

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Set up your MySQL database using the schema provided

## Development

Start the frontend development server:
```bash
npm start
```

Start the backend API server:
```bash
npm run dev
```

## Build for Production

Create a production build:
```bash
npm run build
```

## Deployment

This project has automated deployment configured using GitHub Actions:

1. Frontend: Deployed to GitHub Pages automatically when pushing to main branch
2. Backend: Configure the workflow in `.github/workflows/deploy-backend.yml` for your preferred hosting platform

### Frontend Deployment
The static Eleventy site is automatically built and deployed to GitHub Pages.

### Backend Deployment
The Express.js API needs to be deployed to a server that can run Node.js and has MySQL access.

## Color Scheme

This blog uses a custom dark theme with the following colors:
- Background: #16213e (deep navy blue)
- Text: #e6e6e6 (light gray)
- Accent: #8e65f0 (purple)
- Secondary text: #a0a0a0 (medium gray)

## Database Configuration

The blog uses a MySQL database with status conversion between frontend and backend:
- Status in database: 'draft' and 'published'
- Status in frontend/API: 'draft' and 'public'

## License

MIT License