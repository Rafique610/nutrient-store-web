# GameVault 🎮

A full-stack game store web application where customers can browse and purchase games, developers can publish and manage their titles, and admins can oversee the entire platform.

**Live Demo:** [gamevault-store.vercel.app](https://gamevault-store.vercel.app)  
**Backend API:** [web-project-eskq.onrender.com](https://web-project-eskq.onrender.com)

---\

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)

---

## Features

### Customer
- Browse and search the game store with filters (genre, price, sort)
- View detailed game pages with screenshots and reviews
- Add games to cart and checkout (mock payment)
- Access purchased games in a personal library
- Download owned games
- Leave star ratings and written reviews on owned games

### Developer
- Publish new games with cover image and screenshots
- Manage (edit/delete) their own published titles
- View per-game stats: downloads, ratings, reviews
- Track estimated revenue from sales

### Admin
- Full dashboard with platform-wide stats (users, games, orders, revenue)
- Manage all users: create, edit, change roles, delete
- Manage all games: create, edit, delete
- View top-selling games and genre breakdown

### General
- JWT-based authentication with role-based access control
- Passwords hashed with bcrypt — never stored in plaintext
- Server-side and client-side input validation
- Responsive UI that works on desktop and mobile
- New Releases, Top Sellers, and Free to Play sections on the home page

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| React Icons | Icon library |
| Fetch API | HTTP requests to backend |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database and ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| multer | File uploads (cover images, screenshots) |
| express-validator | Server-side input validation |
| dotenv | Environment variable management |
| cors | Cross-origin request handling |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Cloud database |

---

## Project Structure

```
├── gamevault-frontend/
│   ├── public/
│   │   └── images/          # Static game images and screenshots
│   └── src/
│       ├── components/
│       │   ├── layout/      # Navbar, Sidebar, Footer
│       │   └── ui/          # GameCard, Icon, reusable components
│       ├── context/
│       │   ├── AuthContext.jsx   # Auth state, cart, library
│       │   └── GameContext.jsx   # Global games list
│       ├── pages/
│       │   ├── admin/       # AdminDashboard, AdminGames, AdminUsers
│       │   ├── Home.jsx
│       │   ├── Store.jsx
│       │   ├── GameDetail.jsx
│       │   ├── Cart.jsx
│       │   ├── Checkout.jsx
│       │   ├── Library.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Profile.jsx
│       │   └── DeveloperHub.jsx
│       └── services/
│           └── api.js       # All API calls and data normalizers
│
└── gamevault-backend/
    ├── config/
    │   └── db.js            # MongoDB connection
    ├── controllers/         # Business logic
    ├── middleware/
    │   ├── authMiddleware.js    # JWT verification
    │   ├── roleMiddleware.js    # Role-based access control
    │   └── errorMiddleware.js   # Global error handler
    ├── models/
    │   ├── User.js
    │   ├── Game.js
    │   ├── Order.js
    │   └── Review.js
    ├── routes/              # Express route definitions
    ├── scripts/
    │   └── seed.js          # Database seeder
    ├── uploads/             # Uploaded game images and files
    └── server.js            # Entry point
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works)
- Git

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Set up the backend

```bash
cd gamevault-backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables) below), then:

```bash
# Seed the database with sample games (optional but recommended)
npm run seed

# Start the development server
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd gamevault-frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173`.

---

## Environment Variables

### Backend — `gamevault-backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/gamevault` |
| `JWT_SECRET` | Secret key for signing JWTs | `a_long_random_string` |
| `JWT_EXPIRE` | JWT expiry duration | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `https://your-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |

### Frontend — `gamevault-frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `https://your-backend.onrender.com/api` |

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new user |
| POST | `/auth/login` | Public | Login and receive JWT |
| GET | `/auth/me` | Required | Get current user profile |
| PUT | `/auth/profile` | Required | Update profile |

### Games — `/api/games`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/games` | Public | List games (supports `search`, `category`, `sort`, `page`, `limit`) |
| GET | `/games/:id` | Public | Get a single game |
| GET | `/games/:id/reviews` | Public | Get reviews for a game |
| GET | `/games/:id/download` | Required | Download an owned game |
| POST | `/games` | Developer | Publish a new game (multipart/form-data) |
| PUT | `/games/:id` | Developer | Update own game |
| DELETE | `/games/:id` | Developer | Delete own game |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/orders/cart` | Required | Get current cart |
| POST | `/orders/cart` | Required | Add game to cart |
| DELETE | `/orders/cart/:gameId` | Required | Remove game from cart |
| DELETE | `/orders/cart` | Required | Clear entire cart |
| POST | `/orders/checkout` | Required | Checkout and create order |
| GET | `/orders/library` | Required | Get user's game library |
| GET | `/orders` | Required | Get user's order history |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/reviews` | Required | Create a review |
| PUT | `/reviews/:id` | Required | Update own review |
| DELETE | `/reviews/:id` | Required | Delete own review |

### Admin — `/api/admin`

All admin routes require authentication and the `admin` role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/stats` | Platform stats (users, games, orders, revenue) |
| GET | `/admin/users` | List all users |
| POST | `/admin/users` | Create a user |
| PUT | `/admin/users/:id` | Update a user |
| DELETE | `/admin/users/:id` | Delete a user |
| GET | `/admin/games` | List all games |
| POST | `/admin/games` | Create a game |
| PUT | `/admin/games/:id` | Update a game |
| DELETE | `/admin/games/:id` | Delete a game |

---

## User Roles

| Role | Capabilities |
|---|---|
| `customer` | Browse store, purchase games, leave reviews, manage cart and library |
| `developer` | All customer capabilities + publish and manage own games via Developer Hub |
| `admin` | Full platform access — manage all users, games, and view analytics |

To register as a developer or admin, set the `role` field in the register request body. By default, new accounts are created as `customer`.

---

## Screenshots

| | |
|---|---|
| ![Home](demo/web1.jpg) | ![Store](demo/web2.jpg) |
| ![Game Detail](demo/web3.jpg) | ![Cart](demo/web4.jpg) |
| ![Library](demo/web5.jpg) | ![Developer Hub](demo/web6.jpg) |
| ![Admin Dashboard](demo/web7.jpg) | ![Admin Users](demo/web8.jpg) |

---

## Deployment Notes

- **File uploads** (cover images, screenshots) are stored on the server filesystem. On Render's free tier the filesystem is ephemeral — uploaded files will not persist across restarts. For production use, migrate uploads to a cloud storage service such as Cloudinary or AWS S3.
- **Render free tier** spins down after 15 minutes of inactivity. The first request after a sleep period may take 30–60 seconds to respond while the server wakes up.
- After deploying the frontend to Vercel, set `CLIENT_URL` in your Render environment variables to the Vercel URL and redeploy the backend so CORS is configured correctly.
