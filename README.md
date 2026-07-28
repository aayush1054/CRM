# 🚀 Orbit CRM

Orbit CRM is a modern, full-stack Customer Relationship Management system featuring a breathtaking, highly animated **Futuristic Dark Theme** UI. It provides essential tools for managing customers, tracking product inventory, generating sales challans, and analyzing performance through beautiful, interactive charts.

![Orbit CRM Dashboard](https://img.shields.io/badge/Status-Production_Ready-success) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## ✨ Features

- **Futuristic UI:** Deep space background, neon LED badges, true glassmorphism, 3D hover effects, and bouncy modal animations.
- **Customer Management:** Track leads, active clients, and their details.
- **Product & Inventory:** Monitor stock levels in real-time, get low-stock alerts, and view movement logs.
- **Sales Challans:** Create interactive drafts, automatically deduct stock upon confirmation, and export professional PDF challans.
- **Interactive Analytics:** Staggered load animations on dashboard metrics, featuring Recharts with deep glowing gradients.
- **Secure Authentication:** Role-based login system powered by JWT and bcrypt.

---

## 🛠️ Technology Stack

**Frontend (Client)**
- **React.js 18** (Vite)
- **Vanilla CSS** (Custom Futuristic Design System)
- **Recharts** (Data Visualization)
- **jsPDF & autoTable** (PDF Generation)
- **Lucide React** (Icons)

**Backend (API)**
- **Node.js** & **Express**
- **Prisma ORM** (Database mapping)
- **PostgreSQL** (Primary database)
- **Zod** (Schema validation)
- **JWT** (Authentication)

---

## 💻 Local Setup Instructions

### Prerequisites
Make sure you have [Node.js (v18+)](https://nodejs.org/) installed on your machine. You will also need a PostgreSQL database (local or cloud-hosted, like [Neon.tech](https://neon.tech)).

### 1. Clone the repository
```bash
git clone https://github.com/aayush1054/CRM.git
cd CRM
```

### 2. Backend Setup
Navigate to the backend folder:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add your database and JWT secret:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/crmdb"
JWT_SECRET="super_secret_jwt_key_123"
```

Initialize the database and start the development server:
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*The backend API will run on `http://localhost:5000`.*

### 3. Frontend Setup
Open a new terminal tab and navigate to the frontend folder:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:5000"
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend will run on `http://localhost:5173`. Open this in your browser.*

---

## 🚀 Deployment Instructions

### Backend (Deploying to Railway)
Railway is ideal for deploying the Node.js API and hosting the PostgreSQL database.

1. Go to **[Railway.app](https://railway.app/)** and click **New Project -> Deploy from GitHub repo**. Select `aayush1054/CRM`.
2. **IMPORTANT: Set Root Directory:**
   - Click your GitHub service block in Railway -> Go to **Settings**.
   - Under **Build**, change the **Root Directory** to `/backend`.
3. **Add Database:**
   - Click `+ New` on the Railway canvas -> **Database** -> **Add PostgreSQL**.
4. **Environment Variables:**
   - Click your GitHub service block -> **Variables** tab.
   - Add `DATABASE_URL` (Select the auto-populated Postgres reference).
   - Add `JWT_SECRET` (Enter a secure random string).
5. **Get your Live API Domain:**
   - In Settings -> Networking, click **Generate Domain**. Copy this URL for the frontend.
6. Click **Deploy / Redeploy**.

### Frontend (Deploying to Netlify)
Netlify is perfect for hosting the React Single Page Application (SPA).

1. Go to **[Netlify.com](https://www.netlify.com/)** -> **Add new site** -> **Import an existing project** (from GitHub). Select `aayush1054/CRM`.
2. **Configure Build Settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist` (or just `dist` if Netlify auto-detects it).
3. **Environment Variables:**
   - Click **Add environment variables**.
   - Key: `VITE_API_URL`
   - Value: `https://your-railway-backend-domain.up.railway.app`
4. Click **Deploy site**.
*(Note: A `_redirects` file is already included in `frontend/public/` to prevent React Router 404 errors on page refresh).*

---

## 🏗️ Architecture Explanation

Orbit CRM follows a standard **Client-Server (Monolithic API)** architecture, organized as a Monorepo:
1. **Frontend (Client Layer):** A React SPA built with Vite. It handles routing locally (React Router) and manages state mostly through local component state and prop drilling for simplicity. It communicates with the backend via RESTful API calls using `axios`. The CSS is entirely custom, built from scratch without bulky UI libraries to ensure lightning-fast performance and a highly tailored aesthetic.
2. **Backend (API Layer):** A Node.js Express server that exposes REST endpoints. It implements Role-Based Access Control (RBAC) via custom middleware, verifying JWT tokens on protected routes.
3. **Database Layer:** Powered by PostgreSQL. We use **Prisma ORM** for type-safe database queries. The database schema strictly enforces relations (e.g., a Challan relies on Customer and User IDs, and ChallanItems connect to Products). When a Challan is confirmed, a database transaction ensures that stock reduction and movement logging happen atomically to prevent data corruption.

---

## ⚠️ Known Limitations & Incomplete Parts

While fully functional, the current version has a few boundaries:
*   **No Image Hosting / CDN:** Product images are currently uploaded to the local `/uploads` directory on the backend server. In an ephemeral cloud environment (like Railway/Heroku), these images will be lost on container restart. *Fix: Integrate AWS S3 or Cloudinary in the `multer` middleware.*
*   **Pagination Missing on Frontend:** The backend API supports `?page=` and `?limit=` for pagination, but the frontend currently fetches all items and handles pagination purely on the client side (in memory). For massive datasets, this could slow down the browser.
*   **No Password Reset Flow:** There is no "Forgot Password" or email-sending logic currently implemented.
*   **Single Currency:** The system hardcodes `Rs.` (Rupees) in the frontend and PDF generation. It does not support multi-currency out of the box.

---

## 📂 Project Structure

```text
CRM/
├── backend/
│   ├── prisma/             # Database schema (schema.prisma)
│   ├── src/
│   │   ├── middleware/     # Auth and validation guards
│   │   ├── routes/         # Express API endpoints
│   │   └── index.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/             
│   │   └── _redirects      # Netlify SPA routing rules
│   ├── src/
│   │   ├── components/     # Reusable UI components & layouts
│   │   ├── pages/          # Full page views (Dashboard, Products, etc.)
│   │   ├── utils/          # API Axios configurations
│   │   ├── global.css      # Core Futuristic Design System
│   │   └── App.tsx         # React Router logic
│   └── package.json
└── README.md               # You are here!
```
