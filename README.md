# Nutrient 💊

A full-stack supplements store web application where customers can browse and purchase supplements, developers can publish and manage their titles, and admins can oversee the entire platform.

**Live Demo:** [Nutrient-store.vercel.app](https://Nutrient-store.vercel.app)  
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
- Browse and search the supplements store with filters (genre, price, sort)
- View detailed supplement pages with screenshots and reviews
- Add supplements to cart and checkout (mock payment)
- Access purchased supplements in a personal library
- Download owned supplements
- Leave star ratings and written reviews on owned supplements

### Developer
- Publish new supplements with cover image and screenshots
- Manage (edit/delete) their own published titles
- View per-supplement stats: downloads, ratings, reviews
- Track estimated revenue from sales

### Admin
- Full dashboard with platform-wide stats (users, supplements, orders, revenue)
- Manage all users: create, edit, change roles, delete
- Manage all supplements: create, edit, delete
- View top-selling supplements and genre breakdown

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
├── Nutrient-frontend/
│   ├── public/
│   │   └── images/          # Static supplement images and screenshots
│   └── src/
│       ├── components/
│       │   ├── layout/      # Navbar, Sidebar, Footer
│       │   └── ui/          # ProductCard, Icon, reusable components
│       ├── context/
│       │   ├── AuthContext.jsx   # Auth state, cart, library
│       │   └── ProductContext.jsx   # Global supplements list
│       ├── pages/
│       │   ├── admin/       # AdminDashboard, Adminsupplements, AdminUsers
│       │   ├── Home.jsx
│       │   ├── Store.jsx
│       │   ├── ProductDetail.jsx
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
└── Nutrient-backend/
    ├── config/
    │   └── db.js            # MongoDB connection
    ├── controllers/         # Business logic
    ├── middleware/
    │   ├── authMiddleware.js    # JWT verification
    │   ├── roleMiddleware.js    # Role-based access control
    │   └── errorMiddleware.js   # Global error handler
    ├── models/
    │   ├── User.js
    │   ├── supplement.js
    │   ├── Order.js
    │   └── Review.js
    ├── routes/              # Express route definitions
    ├── scripts/
    │   └── seed.js          # Database seeder
    ├── uploads/             # Uploaded supplement images and files
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
cd Nutrient-backend
npm install
```

Create a `.env` file (see [Environment Variables](#environment-variables) below), then:

```bash
# Seed the database with sample supplements (optional but recommended)
npm run seed

# Start the development server
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd Nutrient-frontend
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

### Backend — `Nutrient-backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/Nutrient` |
| `JWT_SECRET` | Secret key for signing JWTs | `a_long_random_string` |
| `JWT_EXPIRE` | JWT expiry duration | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `https://your-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your_api_secret` |

### Frontend — `Nutrient-frontend/.env`

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

### supplements — `/api/supplements`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/supplements` | Public | List supplements (supports `search`, `category`, `sort`, `page`, `limit`) |
| GET | `/supplements/:id` | Public | Get a single supplement |
| GET | `/supplements/:id/reviews` | Public | Get reviews for a supplement |
| GET | `/supplements/:id/download` | Required | Download an owned supplement |
| POST | `/supplements` | Developer | Publish a new supplement (multipart/form-data) |
| PUT | `/supplements/:id` | Developer | Update own supplement |
| DELETE | `/supplements/:id` | Developer | Delete own supplement |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/orders/cart` | Required | Get current cart |
| POST | `/orders/cart` | Required | Add supplement to cart |
| DELETE | `/orders/cart/:ProductId` | Required | Remove supplement from cart |
| DELETE | `/orders/cart` | Required | Clear entire cart |
| POST | `/orders/checkout` | Required | Checkout and create order |
| GET | `/orders/library` | Required | Get user's supplement library |
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
| GET | `/admin/stats` | Platform stats (users, supplements, orders, revenue) |
| GET | `/admin/users` | List all users |
| POST | `/admin/users` | Create a user |
| PUT | `/admin/users/:id` | Update a user |
| DELETE | `/admin/users/:id` | Delete a user |
| GET | `/admin/supplements` | List all supplements |
| POST | `/admin/supplements` | Create a supplement |
| PUT | `/admin/supplements/:id` | Update a supplement |
| DELETE | `/admin/supplements/:id` | Delete a supplement |

---

## User Roles

| Role | Capabilities |
|---|---|
| `customer` | Browse store, purchase supplements, leave reviews, manage cart and library |
| `developer` | All customer capabilities + publish and manage own supplements via Developer Hub |
| `admin` | Full platform access — manage all users, supplements, and view analytics |

To register as a developer or admin, set the `role` field in the register request body. By default, new accounts are created as `customer`.

---

## Screenshots

| | |
|---|---|
| ![Home](demo/web1.jpg) | ![Store](demo/web2.jpg) |
| ![supplement Detail](demo/web3.jpg) | ![Cart](demo/web4.jpg) |
| ![Library](demo/web5.jpg) | ![Developer Hub](demo/web6.jpg) |
| ![Admin Dashboard](demo/web7.jpg) | ![Admin Users](demo/web8.jpg) |

---

## Deployment Notes

- **File uploads** (cover images, screenshots) are stored on the server filesystem. On Render's free tier the filesystem is ephemeral — uploaded files will not persist across restarts. For production use, migrate uploads to a cloud storage service such as Cloudinary or AWS S3.
- **Render free tier** spins down after 15 minutes of inactivity. The first request after a sleep period may take 30–60 seconds to respond while the server wakes up.
- After deploying the frontend to Vercel, set `CLIENT_URL` in your Render environment variables to the Vercel URL and redeploy the backend so CORS is configured correctly.




