# Lumina Reels — Premium Instagram Reel Downloader

Lumina Reels is an ultra-premium, dark-themed, and production-ready Instagram Reel Downloader web application built with a React frontend and a Node.js Express MVC backend utilizing MongoDB Atlas and Mongoose ODM.

---

## 📁 Project Architecture

The project is structured as a monorepo splitting the concerns of the client and the server:

```
project-root/
├── frontend/             # Vite + React Client application
│   ├── src/              # React components, service layer, styles (Framer Motion + Canvas)
│   ├── public/           # Static assets
│   ├── package.json      # Frontend package configuration
│   └── .env              # VITE_API_URL settings
│
├── backend/              # Node + Express REST API server (MVC Pattern)
│   ├── src/
│   │   ├── config/       # MongoDB connection configurations
│   │   ├── models/       # Mongoose Schemas (User, Reel, DownloadHistory)
│   │   ├── routes/       # API Route mappings
│   │   ├── controllers/  # Route logic controllers
│   │   ├── services/     # Scrapers & API extraction logic (instagram-url-direct + Puppeteer)
│   │   ├── middleware/   # Centralized error handler
│   │   └── server.js     # Server entry point
│   ├── package.json      # Backend package configuration
│   └── .env              # Server PORT, MONGODB_URI and Node environment
│
└── README.md             # Project documentation
```

---

## 🛠️ Tech Stack & Key Libraries

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Pure Vanilla CSS, CSS Variables, and Luxury dark-theme layouts
- **Animations**: Framer Motion 12 + GPU-Accelerated HTML5 Canvas Particles
- **API Client**: Axios

### Backend
- **Framework**: Node.js + Express
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Extraction Tools**: `instagram-url-direct` (API extraction) + `puppeteer` (headless chrome fallback)

---

## 🚀 Running the Project Locally

### 1. MongoDB Atlas Setup
Ensure you have a MongoDB Atlas cluster created. Retrieve your **MongoDB connection string**.

### 2. Configure Environment Variables

#### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Backend Server
Open a terminal in the `backend/` folder:
```bash
npm run dev
# or: npm start
```
The server will run on `http://localhost:5000/`.

### 4. Run Frontend Client
Open a terminal in the `frontend/` folder:
```bash
npm run dev
```
The client will run on `http://localhost:5173/` (or next available port).

---

## 🛡️ Deployment Instructions

### Frontend (Vercel Ready)
The frontend contains Vercel build configs.
1. Connect your repo to Vercel.
2. Set the Root Directory to `frontend`.
3. Add the environment variable: `VITE_API_URL` pointing to your deployed backend.
4. Deploy!

### Backend (Render or Railway Ready)
The backend is ready to build and run out-of-the-box.
1. Connect your repo to Render or Railway.
2. Set the Root Directory to `backend`.
3. Set the start command to `npm start`.
4. Configure the env variables: `MONGODB_URI` and `PORT`.
5. Deploy!
