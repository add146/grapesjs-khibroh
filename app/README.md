# Khibroh Web Builder

A web page builder powered by GrapesJS, deployed on Cloudflare Pages with D1 database and R2 storage.

## Project Structure

```
app/
├── public/               # Static frontend files
│   ├── index.html        # Login/Register page
│   ├── dashboard.html    # Project management
│   └── editor.html       # GrapesJS editor
├── functions/            # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── auth/         # Authentication endpoints
│   │   ├── projects/     # Project CRUD
│   │   └── assets/       # Asset upload
│   ├── assets/           # R2 asset serving
│   └── utils.ts          # Utility functions
├── schema.sql            # D1 database schema
├── wrangler.toml         # Cloudflare configuration
└── package.json
```

## Quick Start

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare (use regular terminal, not Antigravity)

```bash
wrangler login
```

This will open a browser window for authentication. After login, come back here.

### 3. Create D1 Database

```bash
cd app
wrangler d1 create khibroh-web-builder-db
```

Copy the `database_id` from the output and update `wrangler.toml`.

### 4. Create R2 Bucket

```bash
wrangler r2 bucket create khibroh-web-builder-assets
```

### 5. Run Database Migration

```bash
wrangler d1 execute khibroh-web-builder-db --file=./schema.sql
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Locally

```bash
npm run dev
```

Open http://localhost:8788 in your browser.

### 8. Deploy to Cloudflare Pages

```bash
npm run deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List all projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project data |
| PUT | /api/projects/:id | Save project data |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/assets/upload | Upload asset to R2 |
| GET | /api/assets | List assets |

## Environment Variables

Set in Cloudflare Dashboard or wrangler.toml:

- `JWT_SECRET`: Secret key for JWT token generation

## Features

- ✅ User authentication (login/register)
- ✅ Project management (create, edit, delete)
- ✅ GrapesJS visual editor
- ✅ Auto-save
- ✅ Device preview (desktop, tablet, mobile)
- ✅ Image upload to R2
- ✅ Responsive design
