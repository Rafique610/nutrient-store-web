# GameVault Project Explanation

## 1. Project Overview

GameVault is a full-stack web application for browsing, buying, reviewing, publishing, and managing digital games. It is built as a marketplace-style platform with three user roles:

- `customer`: browses games, adds games to cart, checks out, owns a library, downloads owned games, and reviews owned games.
- `developer`: has customer-like browsing access plus developer-only game publishing and ownership-based game management.
- `admin`: manages platform users, games, and dashboard statistics through an admin panel.

The project is split into two main applications:

- `gamevault-frontend/`: React + Vite frontend.
- `gamevault-backend/`: Node.js + Express + MongoDB backend.

There is also a root-level runner:

- `package.json`
- `scripts/dev-all.js`

This root runner starts both the frontend and backend together with one command.

## 2. High-Level Architecture

The application follows a typical client-server architecture:

```txt
Browser
  |
  | React frontend on http://localhost:5173
  |
  | HTTP requests using fetch
  | Authorization: Bearer <JWT>
  v
Express backend on http://localhost:5000
  |
  | Mongoose ODM
  v
MongoDB database: gamevault
```

The frontend never talks directly to MongoDB. It only communicates with the backend API. The backend owns authentication, validation, authorization, database writes, file uploads, and response formatting.

## 3. Technology Stack

### Frontend

The frontend uses:

- React 18
- Vite
- React Router DOM
- React Icons
- Plain CSS modules/files per page/component
- Native `fetch` through a custom API client

Important frontend files:

- `gamevault-frontend/src/App.jsx`
- `gamevault-frontend/src/main.jsx`
- `gamevault-frontend/src/services/api.js`
- `gamevault-frontend/src/context/AuthContext.jsx`
- `gamevault-frontend/src/context/GameContext.jsx`
- `gamevault-frontend/src/pages/*`
- `gamevault-frontend/src/components/*`

### Backend

The backend uses:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT through `jsonwebtoken`
- Password hashing through `bcryptjs`
- File uploads through `multer`
- Input validation through `express-validator`
- CORS through `cors`
- Environment variables through `dotenv`

Important backend files:

- `gamevault-backend/server.js`
- `gamevault-backend/config/db.js`
- `gamevault-backend/models/User.js`
- `gamevault-backend/models/Game.js`
- `gamevault-backend/models/Order.js`
- `gamevault-backend/models/Review.js`
- `gamevault-backend/controllers/*`
- `gamevault-backend/routes/*`
- `gamevault-backend/middleware/*`
- `gamevault-backend/scripts/seed.js`

## 4. Root Project Runner

The root `package.json` provides commands for working with the full project:

```json
{
  "scripts": {
    "dev": "node scripts/dev-all.js",
    "dev:backend": "npm --prefix gamevault-backend run dev",
    "dev:frontend": "npm --prefix gamevault-frontend run dev",
    "seed": "npm --prefix gamevault-backend run seed"
  }
}
```

### `npm run dev`

Runs both applications at once:

- Backend: `gamevault-backend`, using `npm run dev`
- Frontend: `gamevault-frontend`, using `npm run dev`

The runner is implemented in:

```txt
scripts/dev-all.js
```

It spawns both child processes, prefixes terminal logs with `[backend]` and `[frontend]`, and stops both when the user presses `Ctrl+C`.

## 5. Environment Configuration

### Backend Environment

Backend environment file:

```txt
gamevault-backend/.env
```

Example file:

```txt
gamevault-backend/.env.example
```

Expected variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/gamevault
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=1h
```

Meaning:

- `PORT`: backend server port.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: secret key used to sign JWT tokens.
- `JWT_EXPIRE`: token expiry duration. The project uses `1h`.

### Frontend Environment

Frontend example file:

```txt
gamevault-frontend/.env.example
```

Expected variable:

```env
VITE_API_URL=http://localhost:5000/api
```

If this variable is not set, the frontend defaults to:

```txt
http://localhost:5000/api
```

## 6. Frontend Architecture

### 6.1 Entry Point

Frontend rendering begins in:

```txt
gamevault-frontend/src/main.jsx
```

It mounts the React app into the DOM:

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 6.2 App Routing

Routes are defined in:

```txt
gamevault-frontend/src/App.jsx
```

Main routes:

| Route | Component | Access |
|---|---|---|
| `/` | `Home` | Public, redirects admin to `/admin` |
| `/store` | `Store` | Public |
| `/game/:id` | `GameDetail` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/cart` | `Cart` | Authenticated |
| `/checkout` | `Checkout` | Authenticated |
| `/library` | `Library` | Authenticated |
| `/profile` | `Profile` | Authenticated |
| `/developer` | `DeveloperHub` | Developer only |
| `/admin` | `AdminDashboard` | Admin only |
| `/admin/games` | `AdminGames` | Admin only |
| `/admin/users` | `AdminUsers` | Admin only |

Protected routing is handled by the `ProtectedRoute` component in `App.jsx`. It checks:

- Whether authentication is still loading.
- Whether a user is logged in.
- Whether a required role matches the logged-in user.

### 6.3 Layout Components

The main layout includes:

- `Navbar`
- `Sidebar`
- `Footer`

Files:

```txt
gamevault-frontend/src/components/layout/Navbar.jsx
gamevault-frontend/src/components/layout/Sidebar.jsx
gamevault-frontend/src/components/layout/Footer.jsx
```

The navbar shows:

- Brand link.
- Store navigation.
- Search box.
- Cart icon and count.
- User dropdown.
- Login/register buttons for guests.

The sidebar changes based on role:

- Public/customer/developer users see store discovery links.
- Developers also see Dev Hub.
- Admins see dashboard, users, games, and analytics links.

### 6.4 API Client

All frontend-backend communication is centralized in:

```txt
gamevault-frontend/src/services/api.js
```

This file defines:

- `ApiError`
- `setAuthToken`
- `getAuthToken`
- `assetUrl`
- `normalizeGame`
- `normalizeUser`
- `normalizeReview`
- `authApi`
- `gamesApi`
- `orderApi`
- `reviewApi`
- `adminApi`

The API client:

- Reads the API base URL from `VITE_API_URL`.
- Adds `Authorization: Bearer <token>` when a JWT is available.
- Sends JSON bodies for normal requests.
- Supports `FormData` bodies for upload-compatible calls.
- Parses the backend response envelope.
- Throws meaningful errors when requests fail.

### 6.5 Response Normalization

The backend uses MongoDB-style fields such as `_id`, `category`, `coverImage`, `averageRating`, and `totalReviews`.

The frontend UI expects convenient display aliases such as `id`, `genre`, `image`, `rating`, and `reviews`.

The frontend therefore normalizes backend objects in `api.js`:

#### `normalizeGame`

Maps backend game data into frontend-friendly data:

- `_id` -> `id`
- `category` -> `genre`
- `coverImage` -> `image`
- `averageRating` -> `rating`
- `totalReviews` -> `reviews`
- `totalSales` -> `downloads`
- `price === 0` -> `isFree`

#### `normalizeUser`

Maps backend user data:

- `_id` -> `id`
- `profile.fullName` -> `name`
- `createdAt` -> `joinDate`
- developer profile name -> `studio`

#### `normalizeReview`

Maps backend review data:

- `_id` -> `id`
- `comment` -> `text`
- `createdAt` -> `date`

This normalization layer keeps the frontend UI clean and prevents database naming details from leaking into every component.

### 6.6 Authentication Context

Authentication state is handled in:

```txt
gamevault-frontend/src/context/AuthContext.jsx
```

It stores and exposes:

- `user`
- `loading`
- `cart`
- `library`
- `libraryGames`
- `orders`
- `cartTotal`
- `cartCount`
- `login`
- `register`
- `logout`
- `addToCart`
- `removeFromCart`
- `clearCart`
- `purchaseGames`
- `updateProfile`
- `refreshCart`
- `refreshLibrary`
- `refreshOrders`
- `isInCart`
- `isOwned`

Local storage is used only as a session/cache layer:

- `gv_token`: JWT token.
- `gv_user`: cached user object.
- `gv_cart`: cached cart display data.
- `gv_library`: cached library ids.

Actual authoritative data comes from backend API calls.

On app load:

1. The context checks for `gv_token`.
2. If present, it calls `GET /api/auth/me`.
3. It then loads cart, library, and orders from the backend.
4. If token validation fails, it clears the session.

### 6.7 Game Context

Game catalog state is handled in:

```txt
gamevault-frontend/src/context/GameContext.jsx
```

It stores:

- `games`
- `loading`
- `error`

It exposes:

- `refreshGames`
- `addGame`
- `updateGame`
- `removeGame`

It loads games from:

```txt
GET /api/games?limit=100&sort=featured
```

This context feeds the home page, store page, navbar search, and developer/admin flows.

### 6.8 Frontend Pages

#### Home

File:

```txt
gamevault-frontend/src/pages/Home.jsx
```

Uses `GameContext` to show:

- Featured carousel.
- New releases.
- Top sellers.
- Free-to-play games.
- Genre links.

Games are loaded from the backend, not from local mock state.

#### Store

File:

```txt
gamevault-frontend/src/pages/Store.jsx
```

Uses backend-loaded catalog data and provides frontend-side:

- Search.
- Genre filter.
- Price range filter.
- Free-only filter.
- Sorting.
- Quick filters for new, top, and free games.

The store uses `GENRES` from `mockData.js` only for static filter labels.

#### Game Detail

File:

```txt
gamevault-frontend/src/pages/GameDetail.jsx
```

Loads:

- Game detail from `GET /api/games/:id`
- Reviews from `GET /api/games/:id/reviews`

Supports:

- Add to cart.
- Download if owned.
- Review submission if owned.
- Screenshot preview.

#### Cart

File:

```txt
gamevault-frontend/src/pages/Cart.jsx
```

Uses `AuthContext.cart`, which is loaded from:

```txt
GET /api/orders/cart
```

Supports:

- Displaying cart items.
- Removing a game from cart.
- Navigating to checkout.

#### Checkout

File:

```txt
gamevault-frontend/src/pages/Checkout.jsx
```

Uses:

```txt
POST /api/orders/checkout
```

Checkout is mock payment. It always succeeds if the cart is valid, then:

- Creates an order.
- Adds games to the user's library.
- Clears cart.
- Updates purchase history.

#### Library

File:

```txt
gamevault-frontend/src/pages/Library.jsx
```

Uses `AuthContext.libraryGames`, loaded from:

```txt
GET /api/orders/library
```

Shows owned games and supports local library search.

#### Profile

File:

```txt
gamevault-frontend/src/pages/Profile.jsx
```

Uses:

- Current user from auth context.
- Library from backend.
- Orders from backend.

Supports:

```txt
PUT /api/auth/profile
```

This allows editing the user's display name.

#### Developer Hub

File:

```txt
gamevault-frontend/src/pages/DeveloperHub.jsx
```

Developer-only page.

Uses:

```txt
POST /api/games
```

Developers can publish new games. The backend ensures only users with role `developer` can access this route.

#### Admin Dashboard

File:

```txt
gamevault-frontend/src/pages/admin/AdminDashboard.jsx
```

Uses:

```txt
GET /api/admin/stats
GET /api/admin/games
GET /api/admin/users
```

Shows:

- Total users.
- Total games.
- Total orders.
- Total revenue.
- Top selling games.
- Genre breakdown.
- Recent users.

#### Admin Games

File:

```txt
gamevault-frontend/src/pages/admin/AdminGames.jsx
```

Uses:

```txt
GET /api/admin/games
POST /api/admin/games
PUT /api/admin/games/:id
DELETE /api/admin/games/:id
```

Admins can:

- View all games.
- Search/filter/sort games.
- Add games.
- Edit games.
- Delete games.

#### Admin Users

File:

```txt
gamevault-frontend/src/pages/admin/AdminUsers.jsx
```

Uses:

```txt
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
```

Admins can:

- View users.
- Search/filter users.
- Add users.
- Edit users.
- Delete users.

## 7. Backend Architecture

### 7.1 Server Setup

Main backend file:

```txt
gamevault-backend/server.js
```

Responsibilities:

- Load environment variables.
- Connect to MongoDB.
- Create upload folders.
- Configure CORS.
- Configure JSON parsing.
- Configure URL-encoded parsing.
- Serve uploaded files from `/uploads`.
- Mount API routes.
- Provide root health endpoint.
- Register 404 handler.
- Register global error handler.
- Start the server.

Mounted route groups:

```txt
/api/auth
/api/games
/api/orders
/api/reviews
/api/admin
```

### 7.2 Database Connection

File:

```txt
gamevault-backend/config/db.js
```

Uses Mongoose to connect to:

```txt
process.env.MONGO_URI
```

If the database connection fails, the backend logs the error and exits.

### 7.3 Response Format

All normal JSON API responses follow this format:

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error message"
}
```

The frontend API client depends on this envelope.

## 8. Backend Middleware

### 8.1 Authentication Middleware

File:

```txt
gamevault-backend/middleware/authMiddleware.js
```

Checks:

- `Authorization` header exists.
- Header format is `Bearer <token>`.
- Token is valid and not expired.
- User still exists in the database.

If valid, it attaches the user document to:

```js
req.user
```

### 8.2 Role Middleware

File:

```txt
gamevault-backend/middleware/roleMiddleware.js
```

Exports:

```js
authorizeRoles(...roles)
```

Example:

```js
authorizeRoles("developer")
authorizeRoles("admin")
```

Used to protect developer-only and admin-only routes.

### 8.3 Error Middleware

File:

```txt
gamevault-backend/middleware/errorMiddleware.js
```

Handles:

- Unknown routes.
- Mongoose cast errors.
- Mongoose validation errors.
- Duplicate key errors.
- JWT errors.
- General server errors.

Always returns the global error response format.

## 9. Database Models

### 9.1 User Model

File:

```txt
gamevault-backend/models/User.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `username` | String | Username/display name |
| `email` | String | Unique login email |
| `password` | String | Hashed password |
| `role` | String | `customer`, `developer`, or `admin` |
| `profile.fullName` | String | Full display name |
| `profile.avatar` | String | Avatar path/url |
| `profile.bio` | String | User biography |
| `cart` | ObjectId[] | References games in cart |
| `library` | ObjectId[] | References owned games |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

Important behavior:

- Passwords are never stored in plaintext.
- `pre("save")` hashes passwords with bcrypt.
- `password` has `select: false`, so it is not returned by normal queries.
- `matchPassword(password)` compares login password with hashed password.

### 9.2 Game Model

File:

```txt
gamevault-backend/models/Game.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `title` | String | Game title |
| `description` | String | Game description |
| `developer` | ObjectId | Reference to user/developer |
| `developerName` | String | Display name for studio/developer |
| `price` | Number | Game price |
| `category` | String | Game genre/category |
| `coverImage` | String | Cover image path/url |
| `screenshots` | String[] | Screenshot paths/urls |
| `gameFile` | String | Downloadable file path |
| `averageRating` | Number | Average review score |
| `totalReviews` | Number | Number of reviews |
| `totalSales` | Number | Sales/download count |
| `status` | String | `draft` or `published` |
| `tags` | String[] | Search/display tags |
| `isFeatured` | Boolean | Featured carousel flag |
| `releaseDate` | Date | Release date |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

Indexes:

- Text search index on title, description, category, developer name, and tags.

### 9.3 Order Model

File:

```txt
gamevault-backend/models/Order.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `user` | ObjectId | Buyer |
| `games` | Array | Purchased game snapshots |
| `games.game` | ObjectId | Game reference |
| `games.title` | String | Purchased title snapshot |
| `games.price` | Number | Purchased price snapshot |
| `totalAmount` | Number | Total order price |
| `paymentStatus` | String | `pending`, `completed`, or `failed` |
| `paymentMethod` | String | Mock payment method |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

The order stores title and price snapshots so purchase history remains understandable even if the game changes later.

### 9.4 Review Model

File:

```txt
gamevault-backend/models/Review.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `user` | ObjectId | Reviewer |
| `game` | ObjectId | Reviewed game |
| `rating` | Number | Rating from 1 to 5 |
| `comment` | String | Review text |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

Important rule:

```txt
One user can review one game only once.
```

This is enforced with a unique compound index:

```js
{ user: 1, game: 1 }
```

## 10. Backend Controllers

### 10.1 Auth Controller

File:

```txt
gamevault-backend/controllers/authController.js
```

Handles:

- User registration.
- User login.
- Current user retrieval.
- Profile update.
- JWT generation.
- User response formatting.

Main functions:

- `registerUser`
- `loginUser`
- `getCurrentUser`
- `updateProfile`
- `formatUser`

### 10.2 Game Controller

File:

```txt
gamevault-backend/controllers/gameController.js
```

Handles:

- Game list with search/filter/pagination.
- Single game detail.
- Developer game creation.
- Developer game update.
- Developer game deletion.
- Protected game downloads.
- Game response formatting.

Main functions:

- `getGames`
- `getGameById`
- `createGame`
- `updateGame`
- `deleteGame`
- `downloadGame`
- `formatGame`

Developer routes check ownership where required.

### 10.3 Order Controller

File:

```txt
gamevault-backend/controllers/orderController.js
```

Handles:

- Cart viewing.
- Add to cart.
- Remove from cart.
- Clear cart.
- Mock checkout.
- Order creation.
- Library retrieval.
- User order retrieval.

Main functions:

- `getCart`
- `addToCart`
- `removeFromCart`
- `checkout`
- `getUserOrders`
- `getUserLibrary`

### 10.4 Review Controller

File:

```txt
gamevault-backend/controllers/reviewController.js
```

Handles:

- Creating reviews.
- Getting game reviews.
- Updating own reviews.
- Deleting own reviews.
- Admin review deletion.
- Recalculating game average rating.

Main functions:

- `createReview`
- `getGameReviews`
- `updateReview`
- `deleteReview`
- `updateGameRating`

Important rule:

```txt
A user can review a game only if they own it.
```

Ownership is checked through the user's library and completed orders.

### 10.5 Admin Controller

File:

```txt
gamevault-backend/controllers/adminController.js
```

Handles:

- Admin user listing.
- Admin user creation.
- Admin user update.
- Admin user deletion.
- Admin game listing.
- Admin game creation.
- Admin game update.
- Admin game deletion.
- Admin platform statistics.

Main functions:

- `getAdminUsers`
- `createAdminUser`
- `updateAdminUser`
- `deleteAdminUser`
- `getAdminGames`
- `createAdminGame`
- `updateAdminGame`
- `deleteAdminGame`
- `getAdminStats`

## 11. API Routes

### 11.1 Auth Routes

Base path:

```txt
/api/auth
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/register` | Public | Register user |
| POST | `/login` | Public | Login user |
| GET | `/me` | Authenticated | Get current user |
| PUT | `/profile` | Authenticated | Update own profile |

### 11.2 Game Routes

Base path:

```txt
/api/games
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | List games |
| GET | `/:id/reviews` | Public | Get reviews for a game |
| GET | `/:id/download` | Authenticated owner | Download owned game |
| GET | `/:id` | Public | Get game detail |
| POST | `/` | Developer only | Create game |
| PUT | `/:id` | Developer owner only | Update own game |
| DELETE | `/:id` | Developer owner only | Delete own game |

List query supports:

- `page`
- `limit`
- `search` or `q`
- `category` or `genre`
- `minPrice`
- `maxPrice`
- `sort`
- `status`

Sort options include:

- `featured`
- `rating`
- `newest`
- `price_asc`
- `price_desc`
- `popular`
- `title`

### 11.3 Order Routes

Base path:

```txt
/api/orders
```

All order routes require authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/cart` | View cart |
| POST | `/cart` | Add game to cart through body |
| POST | `/cart/:gameId` | Add game to cart through URL param |
| DELETE | `/cart` | Clear cart |
| DELETE | `/cart/:gameId` | Remove one game from cart |
| POST | `/checkout` | Mock checkout and create order |
| GET | `/library` | Get owned games |
| GET | `/` | Get user's orders |

### 11.4 Review Routes

Base path:

```txt
/api/reviews
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/` | Authenticated owner | Create review |
| PUT | `/:id` | Review owner | Update review |
| DELETE | `/:id` | Review owner or admin | Delete review |

### 11.5 Admin Routes

Base path:

```txt
/api/admin
```

All admin routes require:

```txt
Authorization: Bearer <token>
role: admin
```

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/games` | List all games |
| POST | `/games` | Create game |
| PUT | `/games/:id` | Update game |
| DELETE | `/games/:id` | Delete game |
| GET | `/stats` | Get platform statistics |

## 12. Authentication and Authorization

### 12.1 Registration

Registration endpoint:

```txt
POST /api/auth/register
```

Frontend sends:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "password123",
  "role": "customer"
}
```

The backend:

1. Validates name, email, password, and role.
2. Checks if email already exists.
3. Hashes password using bcrypt.
4. Creates user.
5. Signs JWT.
6. Returns token and user.

### 12.2 Login

Login endpoint:

```txt
POST /api/auth/login
```

Frontend sends:

```json
{
  "email": "user@gamevault.com",
  "password": "password123"
}
```

The backend:

1. Finds user by email.
2. Selects password explicitly because password is hidden by default.
3. Compares password using bcrypt.
4. Signs JWT.
5. Returns token and user.

### 12.3 JWT Token

JWT payload includes:

```json
{
  "id": "mongo_user_id",
  "role": "customer"
}
```

The token expires after:

```txt
1h
```

### 12.4 Authorization Header

Protected requests use:

```txt
Authorization: Bearer <token>
```

The frontend attaches this automatically in `api.js`.

### 12.5 Role Rules

| Role | Permissions |
|---|---|
| customer | Browse, cart, checkout, library, reviews, downloads |
| developer | Customer actions plus create/update/delete own games |
| admin | Admin panel, all admin routes |

## 13. Validation

The backend uses `express-validator`.

Validated areas:

- Register
- Login
- Game creation
- Game update
- Review creation
- Review update

Validation failures return:

```json
{
  "success": false,
  "message": "Validation message"
}
```

Database-level validation is also present through Mongoose schemas.

## 14. File Uploads and Downloads

### 14.1 Upload Storage

Multer is configured in:

```txt
gamevault-backend/routes/gameRoutes.js
```

Upload folders:

```txt
gamevault-backend/uploads/games/images
gamevault-backend/uploads/games/files
```

Supported fields:

- `coverImage`
- `image`
- `screenshots`
- `gameFile`

Uploaded files are served through:

```txt
/uploads
```

### 14.2 Download Security

Download endpoint:

```txt
GET /api/games/:id/download
```

Rules:

1. User must be logged in.
2. User must own the game.
3. Game must have a file path.
4. File path must resolve inside the uploads folder.
5. Backend uses `res.download()`.

This prevents users from downloading games they do not own and prevents unsafe path traversal.

## 15. Cart, Orders, and Library Workflow

### 15.1 Add to Cart

Frontend:

```txt
GameCard / GameDetail -> AuthContext.addToCart
```

Backend:

```txt
POST /api/orders/cart
```

Checks:

- Game id is valid.
- Game exists and is published.
- Game is not already owned.
- Game is not already in cart.

### 15.2 Checkout

Frontend:

```txt
Checkout -> AuthContext.purchaseGames
```

Backend:

```txt
POST /api/orders/checkout
```

Backend behavior:

1. Loads user's cart.
2. Removes already-owned games from checkout list.
3. Creates an order.
4. Marks payment as `completed`.
5. Adds purchased games to library.
6. Clears cart.
7. Increments game sales count.
8. Returns order and updated library.

### 15.3 Library

Frontend:

```txt
Library page -> AuthContext.libraryGames
```

Backend:

```txt
GET /api/orders/library
```

The library is the source of truth for:

- Owned status.
- Download permission.
- Review permission.

## 16. Reviews Workflow

### 16.1 View Reviews

Frontend:

```txt
GameDetail -> gamesApi.reviews(id)
```

Backend:

```txt
GET /api/games/:id/reviews
```

### 16.2 Submit Review

Frontend:

```txt
GameDetail -> reviewApi.create
```

Backend:

```txt
POST /api/reviews
```

Rules:

- User must be logged in.
- User must own the game.
- Rating must be 1 to 5.
- Comment must be at least 3 characters.
- User can only review each game once.

After review creation, the backend recalculates:

- `averageRating`
- `totalReviews`

on the `Game` document.

## 17. Admin Workflow

Admins use protected `/admin` frontend routes.

Admin frontend calls protected `/api/admin/*` backend routes.

Admin capabilities:

- View platform stats.
- View recent users.
- View top games.
- Add users.
- Edit users.
- Delete users.
- Add games.
- Edit games.
- Delete games.

Backend admin protection:

```js
router.use(authMiddleware, authorizeRoles("admin"));
```

This means every admin endpoint requires both:

- Valid JWT.
- User role `admin`.

## 18. Developer Workflow

Developers use:

```txt
/developer
```

The frontend protects this route with:

```txt
ProtectedRoute role="developer"
```

Developer game creation uses:

```txt
POST /api/games
```

Backend protection:

```js
authMiddleware
authorizeRoles("developer")
```

Developer update/delete routes additionally enforce ownership:

```txt
Only the developer who owns the game can update or delete it.
```

## 19. Seed Data

Seed script:

```txt
gamevault-backend/scripts/seed.js
```

Run from project root:

```bash
npm run seed
```

The seed script:

1. Connects to MongoDB.
2. Clears users, games, orders, and reviews.
3. Creates demo accounts.
4. Creates catalog games from frontend seed catalog data.
5. Creates a demo downloadable file.
6. Adds some games to the customer library.
7. Creates demo reviews.
8. Creates demo orders.

Demo accounts:

```txt
Customer:  user@gamevault.com / password123
Developer: dev@gamevault.com / password123
Admin:     admin@gamevault.com / password123
```

The seed script imports `mockData.js` only as a convenient source for initial catalog content. Runtime frontend pages load data from MongoDB through the backend API.

## 20. Static and Generated Assets

Frontend public images:

```txt
gamevault-frontend/public/images
gamevault-frontend/public/images/screenshots
```

These are used by seeded games as cover images and screenshots.

Backend upload directory:

```txt
gamevault-backend/uploads
```

This is for uploaded cover images, screenshots, and game files.

Frontend production build output:

```txt
gamevault-frontend/dist
```

This is generated by:

```bash
npm run build
```

## 21. Running the Project

### 21.1 Requirements

Install:

- Node.js
- npm
- MongoDB

MongoDB must be running before the backend can connect.

### 21.2 Install Dependencies

If dependencies are not already installed:

```bash
cd gamevault-backend
npm install
```

```bash
cd ../gamevault-frontend
npm install
```

### 21.3 Seed Database

From project root:

```bash
npm run seed
```

### 21.4 Run Full App

From project root:

```bash
npm run dev
```

This starts:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

Stop both with:

```txt
Ctrl+C
```

### 21.5 Run Apps Separately

Backend only:

```bash
npm run dev:backend
```

Frontend only:

```bash
npm run dev:frontend
```

## 22. Security Features

The project includes:

- Password hashing with bcrypt.
- JWT authentication.
- JWT expiry.
- Bearer token authorization.
- Role-based access control.
- Owner-only developer game edits.
- Owner-only review edits.
- Owner-only downloads.
- Input validation with express-validator.
- Mongoose schema validation.
- Duplicate email protection.
- Duplicate review protection.
- Global error handling.
- File download path safety.
- Hidden password field in user queries.

## 23. Important Data Flows

### 23.1 Login Flow

```txt
Login.jsx
  -> AuthContext.login
    -> authApi.login
      -> POST /api/auth/login
        -> loginUser
          -> User.findOne + bcrypt compare
          -> JWT generated
      <- token + user
    -> token saved in localStorage
    -> cart/library/orders loaded
```

### 23.2 Store Loading Flow

```txt
App.jsx
  -> GameProvider
    -> gamesApi.list
      -> GET /api/games
        -> getGames
          -> Game.find(...)
      <- games
    -> normalizeGame
  -> Home / Store / Navbar search
```

### 23.3 Checkout Flow

```txt
Checkout.jsx
  -> AuthContext.purchaseGames
    -> orderApi.checkout
      -> POST /api/orders/checkout
        -> checkout
          -> create Order
          -> add games to library
          -> clear cart
          -> increment game sales
      <- order + library
    -> update frontend cart/library/orders
```

### 23.4 Review Flow

```txt
GameDetail.jsx
  -> reviewApi.create
    -> POST /api/reviews
      -> createReview
        -> verify ownership
        -> create review
        -> update game rating
      <- review
  -> UI prepends review
```

### 23.5 Admin Flow

```txt
Admin pages
  -> adminApi.*
    -> /api/admin/*
      -> authMiddleware
      -> authorizeRoles("admin")
      -> adminController
```

## 24. Verification Performed

The project was checked with:

```bash
npm run build
```

inside the frontend.

Backend files were checked with:

```bash
node --check
```

Backend modules were imported successfully.

The seed script was run successfully:

```bash
npm run seed
```

A live backend smoke test verified:

- Root health endpoint.
- Games endpoint.
- Login endpoint.
- Authenticated cart endpoint.

## 25. Notes and Current Design Choices

- The frontend uses localStorage only for token/session caching, not as the database.
- Runtime catalog, cart, library, orders, users, and admin data come from the backend.
- `mockData.js` remains useful as seed data and for static genre labels.
- Payment is intentionally mocked and always completes successfully for academic/demo purposes.
- Game file downloads use a seeded demo text file unless a developer uploads a real file.
- Uploaded files are stored locally, not in cloud storage.
- The project is designed for local development with MongoDB on the developer machine.

## 26. Summary

GameVault is now a connected full-stack application:

- React frontend renders the user interface and calls backend APIs.
- Express backend handles auth, RBAC, validation, CRUD, cart, checkout, reviews, downloads, admin logic, and file storage.
- MongoDB stores users, games, orders, reviews, cart references, and library references.
- JWT protects authenticated routes.
- Role middleware protects developer and admin features.
- Seed data provides demo accounts and an initial game catalog.
- One root command can run the full app.

The result is a complete working project suitable for demonstrating frontend integration, backend API design, MongoDB persistence, authentication, authorization, validation, CRUD operations, and role-based workflows.
