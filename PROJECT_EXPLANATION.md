# Nutrient Project Explanation

## 1. Project Overview

Nutrient is a full-stack web application for browsing, buying, reviewing, publishing, and managing digital supplements. It is built as a marketplace-style platform with three user roles:

- `customer`: browses supplements, adds supplements to cart, checks out, owns a library, downloads owned supplements, and reviews owned supplements.
- `developer`: has customer-like browsing access plus developer-only supplement publishing and ownership-based supplement management.
- `admin`: manages platform users, supplements, and dashboard statistics through an admin panel.

The project is split into two main applications:

- `Nutrient-frontend/`: React + Vite frontend.
- `Nutrient-backend/`: Node.js + Express + MongoDB backend.

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
MongoDB database: Nutrient
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

- `Nutrient-frontend/src/App.jsx`
- `Nutrient-frontend/src/main.jsx`
- `Nutrient-frontend/src/services/api.js`
- `Nutrient-frontend/src/context/AuthContext.jsx`
- `Nutrient-frontend/src/context/ProductContext.jsx`
- `Nutrient-frontend/src/pages/*`
- `Nutrient-frontend/src/components/*`

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

- `Nutrient-backend/server.js`
- `Nutrient-backend/config/db.js`
- `Nutrient-backend/models/User.js`
- `Nutrient-backend/models/supplement.js`
- `Nutrient-backend/models/Order.js`
- `Nutrient-backend/models/Review.js`
- `Nutrient-backend/controllers/*`
- `Nutrient-backend/routes/*`
- `Nutrient-backend/middleware/*`
- `Nutrient-backend/scripts/seed.js`

## 4. Root Project Runner

The root `package.json` provides commands for working with the full project:

```json
{
  "scripts": {
    "dev": "node scripts/dev-all.js",
    "dev:backend": "npm --prefix Nutrient-backend run dev",
    "dev:frontend": "npm --prefix Nutrient-frontend run dev",
    "seed": "npm --prefix Nutrient-backend run seed"
  }
}
```

### `npm run dev`

Runs both applications at once:

- Backend: `Nutrient-backend`, using `npm run dev`
- Frontend: `Nutrient-frontend`, using `npm run dev`

The runner is implemented in:

```txt
scripts/dev-all.js
```

It spawns both child processes, prefixes terminal logs with `[backend]` and `[frontend]`, and stops both when the user presses `Ctrl+C`.

## 5. Environment Configuration

### Backend Environment

Backend environment file:

```txt
Nutrient-backend/.env
```

Example file:

```txt
Nutrient-backend/.env.example
```

Expected variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/Nutrient
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
Nutrient-frontend/.env.example
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
Nutrient-frontend/src/main.jsx
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
Nutrient-frontend/src/App.jsx
```

Main routes:

| Route | Component | Access |
|---|---|---|
| `/` | `Home` | Public, redirects admin to `/admin` |
| `/store` | `Store` | Public |
| `/supplement/:id` | `ProductDetail` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/cart` | `Cart` | Authenticated |
| `/checkout` | `Checkout` | Authenticated |
| `/library` | `Library` | Authenticated |
| `/profile` | `Profile` | Authenticated |
| `/developer` | `DeveloperHub` | Developer only |
| `/admin` | `AdminDashboard` | Admin only |
| `/admin/supplements` | `Adminsupplements` | Admin only |
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
Nutrient-frontend/src/components/layout/Navbar.jsx
Nutrient-frontend/src/components/layout/Sidebar.jsx
Nutrient-frontend/src/components/layout/Footer.jsx
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
- Admins see dashboard, users, supplements, and analytics links.

### 6.4 API Client

All frontend-backend communication is centralized in:

```txt
Nutrient-frontend/src/services/api.js
```

This file defines:

- `ApiError`
- `setAuthToken`
- `getAuthToken`
- `assetUrl`
- `normalizeProduct`
- `normalizeUser`
- `normalizeReview`
- `authApi`
- `supplementsApi`
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

#### `normalizeProduct`

Maps backend supplement data into frontend-friendly data:

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
Nutrient-frontend/src/context/AuthContext.jsx
```

It stores and exposes:

- `user`
- `loading`
- `cart`
- `library`
- `librarysupplements`
- `orders`
- `cartTotal`
- `cartCount`
- `login`
- `register`
- `logout`
- `addToCart`
- `removeFromCart`
- `clearCart`
- `purchasesupplements`
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

### 6.7 supplement Context

supplement catalog state is handled in:

```txt
Nutrient-frontend/src/context/ProductContext.jsx
```

It stores:

- `supplements`
- `loading`
- `error`

It exposes:

- `refreshsupplements`
- `addProduct`
- `updateProduct`
- `removeProduct`

It loads supplements from:

```txt
GET /api/supplements?limit=100&sort=featured
```

This context feeds the home page, store page, navbar search, and developer/admin flows.

### 6.8 Frontend Pages

#### Home

File:

```txt
Nutrient-frontend/src/pages/Home.jsx
```

Uses `ProductContext` to show:

- Featured carousel.
- New releases.
- Top sellers.
- Free-to-play supplements.
- Genre links.

supplements are loaded from the backend, not from local mock state.

#### Store

File:

```txt
Nutrient-frontend/src/pages/Store.jsx
```

Uses backend-loaded catalog data and provides frontend-side:

- Search.
- Genre filter.
- Price range filter.
- Free-only filter.
- Sorting.
- Quick filters for new, top, and free supplements.

The store uses `GENRES` from `mockData.js` only for static filter labels.

#### supplement Detail

File:

```txt
Nutrient-frontend/src/pages/ProductDetail.jsx
```

Loads:

- supplement detail from `GET /api/supplements/:id`
- Reviews from `GET /api/supplements/:id/reviews`

Supports:

- Add to cart.
- Download if owned.
- Review submission if owned.
- Screenshot preview.

#### Cart

File:

```txt
Nutrient-frontend/src/pages/Cart.jsx
```

Uses `AuthContext.cart`, which is loaded from:

```txt
GET /api/orders/cart
```

Supports:

- Displaying cart items.
- Removing a supplement from cart.
- Navigating to checkout.

#### Checkout

File:

```txt
Nutrient-frontend/src/pages/Checkout.jsx
```

Uses:

```txt
POST /api/orders/checkout
```

Checkout is mock payment. It always succeeds if the cart is valid, then:

- Creates an order.
- Adds supplements to the user's library.
- Clears cart.
- Updates purchase history.

#### Library

File:

```txt
Nutrient-frontend/src/pages/Library.jsx
```

Uses `AuthContext.librarysupplements`, loaded from:

```txt
GET /api/orders/library
```

Shows owned supplements and supports local library search.

#### Profile

File:

```txt
Nutrient-frontend/src/pages/Profile.jsx
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
Nutrient-frontend/src/pages/DeveloperHub.jsx
```

Developer-only page.

Uses:

```txt
POST /api/supplements
```

Developers can publish new supplements. The backend ensures only users with role `developer` can access this route.

#### Admin Dashboard

File:

```txt
Nutrient-frontend/src/pages/admin/AdminDashboard.jsx
```

Uses:

```txt
GET /api/admin/stats
GET /api/admin/supplements
GET /api/admin/users
```

Shows:

- Total users.
- Total supplements.
- Total orders.
- Total revenue.
- Top selling supplements.
- Genre breakdown.
- Recent users.

#### Admin supplements

File:

```txt
Nutrient-frontend/src/pages/admin/Adminsupplements.jsx
```

Uses:

```txt
GET /api/admin/supplements
POST /api/admin/supplements
PUT /api/admin/supplements/:id
DELETE /api/admin/supplements/:id
```

Admins can:

- View all supplements.
- Search/filter/sort supplements.
- Add supplements.
- Edit supplements.
- Delete supplements.

#### Admin Users

File:

```txt
Nutrient-frontend/src/pages/admin/AdminUsers.jsx
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
Nutrient-backend/server.js
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
/api/supplements
/api/orders
/api/reviews
/api/admin
```

### 7.2 Database Connection

File:

```txt
Nutrient-backend/config/db.js
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
Nutrient-backend/middleware/authMiddleware.js
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
Nutrient-backend/middleware/roleMiddleware.js
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
Nutrient-backend/middleware/errorMiddleware.js
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
Nutrient-backend/models/User.js
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
| `cart` | ObjectId[] | References supplements in cart |
| `library` | ObjectId[] | References owned supplements |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

Important behavior:

- Passwords are never stored in plaintext.
- `pre("save")` hashes passwords with bcrypt.
- `password` has `select: false`, so it is not returned by normal queries.
- `matchPassword(password)` compares login password with hashed password.

### 9.2 supplement Model

File:

```txt
Nutrient-backend/models/supplement.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `title` | String | supplement title |
| `description` | String | supplement description |
| `developer` | ObjectId | Reference to user/developer |
| `developerName` | String | Display name for studio/developer |
| `price` | Number | supplement price |
| `category` | String | supplement genre/category |
| `coverImage` | String | Cover image path/url |
| `screenshots` | String[] | Screenshot paths/urls |
| `ProductFile` | String | Downloadable file path |
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
Nutrient-backend/models/Order.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `user` | ObjectId | Buyer |
| `supplements` | Array | Purchased supplement snapshots |
| `supplements.supplement` | ObjectId | supplement reference |
| `supplements.title` | String | Purchased title snapshot |
| `supplements.price` | Number | Purchased price snapshot |
| `totalAmount` | Number | Total order price |
| `paymentStatus` | String | `pending`, `completed`, or `failed` |
| `paymentMethod` | String | Mock payment method |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

The order stores title and price snapshots so purchase history remains understandable even if the supplement changes later.

### 9.4 Review Model

File:

```txt
Nutrient-backend/models/Review.js
```

Fields:

| Field | Type | Purpose |
|---|---|---|
| `user` | ObjectId | Reviewer |
| `supplement` | ObjectId | Reviewed supplement |
| `rating` | Number | Rating from 1 to 5 |
| `comment` | String | Review text |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

Important rule:

```txt
One user can review one supplement only once.
```

This is enforced with a unique compound index:

```js
{ user: 1, supplement: 1 }
```

## 10. Backend Controllers

### 10.1 Auth Controller

File:

```txt
Nutrient-backend/controllers/authController.js
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

### 10.2 supplement Controller

File:

```txt
Nutrient-backend/controllers/ProductController.js
```

Handles:

- supplement list with search/filter/pagination.
- Single supplement detail.
- Developer supplement creation.
- Developer supplement update.
- Developer supplement deletion.
- Protected supplement downloads.
- supplement response formatting.

Main functions:

- `getsupplements`
- `getProductById`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `downloadProduct`
- `formatProduct`

Developer routes check ownership where required.

### 10.3 Order Controller

File:

```txt
Nutrient-backend/controllers/orderController.js
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
Nutrient-backend/controllers/reviewController.js
```

Handles:

- Creating reviews.
- Getting supplement reviews.
- Updating own reviews.
- Deleting own reviews.
- Admin review deletion.
- Recalculating supplement average rating.

Main functions:

- `createReview`
- `getProductReviews`
- `updateReview`
- `deleteReview`
- `updateProductRating`

Important rule:

```txt
A user can review a supplement only if they own it.
```

Ownership is checked through the user's library and completed orders.

### 10.5 Admin Controller

File:

```txt
Nutrient-backend/controllers/adminController.js
```

Handles:

- Admin user listing.
- Admin user creation.
- Admin user update.
- Admin user deletion.
- Admin supplement listing.
- Admin supplement creation.
- Admin supplement update.
- Admin supplement deletion.
- Admin platform statistics.

Main functions:

- `getAdminUsers`
- `createAdminUser`
- `updateAdminUser`
- `deleteAdminUser`
- `getAdminsupplements`
- `createAdminProduct`
- `updateAdminProduct`
- `deleteAdminProduct`
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

### 11.2 supplement Routes

Base path:

```txt
/api/supplements
```

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/` | Public | List supplements |
| GET | `/:id/reviews` | Public | Get reviews for a supplement |
| GET | `/:id/download` | Authenticated owner | Download owned supplement |
| GET | `/:id` | Public | Get supplement detail |
| POST | `/` | Developer only | Create supplement |
| PUT | `/:id` | Developer owner only | Update own supplement |
| DELETE | `/:id` | Developer owner only | Delete own supplement |

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
| POST | `/cart` | Add supplement to cart through body |
| POST | `/cart/:ProductId` | Add supplement to cart through URL param |
| DELETE | `/cart` | Clear cart |
| DELETE | `/cart/:ProductId` | Remove one supplement from cart |
| POST | `/checkout` | Mock checkout and create order |
| GET | `/library` | Get owned supplements |
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
| GET | `/supplements` | List all supplements |
| POST | `/supplements` | Create supplement |
| PUT | `/supplements/:id` | Update supplement |
| DELETE | `/supplements/:id` | Delete supplement |
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
  "email": "user@Nutrient.com",
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
| developer | Customer actions plus create/update/delete own supplements |
| admin | Admin panel, all admin routes |

## 13. Validation

The backend uses `express-validator`.

Validated areas:

- Register
- Login
- supplement creation
- supplement update
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
Nutrient-backend/routes/ProductRoutes.js
```

Upload folders:

```txt
Nutrient-backend/uploads/supplements/images
Nutrient-backend/uploads/supplements/files
```

Supported fields:

- `coverImage`
- `image`
- `screenshots`
- `ProductFile`

Uploaded files are served through:

```txt
/uploads
```

### 14.2 Download Security

Download endpoint:

```txt
GET /api/supplements/:id/download
```

Rules:

1. User must be logged in.
2. User must own the supplement.
3. supplement must have a file path.
4. File path must resolve inside the uploads folder.
5. Backend uses `res.download()`.

This prevents users from downloading supplements they do not own and prevents unsafe path traversal.

## 15. Cart, Orders, and Library Workflow

### 15.1 Add to Cart

Frontend:

```txt
ProductCard / ProductDetail -> AuthContext.addToCart
```

Backend:

```txt
POST /api/orders/cart
```

Checks:

- supplement id is valid.
- supplement exists and is published.
- supplement is not already owned.
- supplement is not already in cart.

### 15.2 Checkout

Frontend:

```txt
Checkout -> AuthContext.purchasesupplements
```

Backend:

```txt
POST /api/orders/checkout
```

Backend behavior:

1. Loads user's cart.
2. Removes already-owned supplements from checkout list.
3. Creates an order.
4. Marks payment as `completed`.
5. Adds purchased supplements to library.
6. Clears cart.
7. Increments supplement sales count.
8. Returns order and updated library.

### 15.3 Library

Frontend:

```txt
Library page -> AuthContext.librarysupplements
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
ProductDetail -> supplementsApi.reviews(id)
```

Backend:

```txt
GET /api/supplements/:id/reviews
```

### 16.2 Submit Review

Frontend:

```txt
ProductDetail -> reviewApi.create
```

Backend:

```txt
POST /api/reviews
```

Rules:

- User must be logged in.
- User must own the supplement.
- Rating must be 1 to 5.
- Comment must be at least 3 characters.
- User can only review each supplement once.

After review creation, the backend recalculates:

- `averageRating`
- `totalReviews`

on the `supplement` document.

## 17. Admin Workflow

Admins use protected `/admin` frontend routes.

Admin frontend calls protected `/api/admin/*` backend routes.

Admin capabilities:

- View platform stats.
- View recent users.
- View top supplements.
- Add users.
- Edit users.
- Delete users.
- Add supplements.
- Edit supplements.
- Delete supplements.

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

Developer supplement creation uses:

```txt
POST /api/supplements
```

Backend protection:

```js
authMiddleware
authorizeRoles("developer")
```

Developer update/delete routes additionally enforce ownership:

```txt
Only the developer who owns the supplement can update or delete it.
```

## 19. Seed Data

Seed script:

```txt
Nutrient-backend/scripts/seed.js
```

Run from project root:

```bash
npm run seed
```

The seed script:

1. Connects to MongoDB.
2. Clears users, supplements, orders, and reviews.
3. Creates demo accounts.
4. Creates catalog supplements from frontend seed catalog data.
5. Creates a demo downloadable file.
6. Adds some supplements to the customer library.
7. Creates demo reviews.
8. Creates demo orders.

Demo accounts:

```txt
Customer:  user@Nutrient.com / password123
Developer: dev@Nutrient.com / password123
Admin:     admin@Nutrient.com / password123
```

The seed script imports `mockData.js` only as a convenient source for initial catalog content. Runtime frontend pages load data from MongoDB through the backend API.

## 20. Static and Generated Assets

Frontend public images:

```txt
Nutrient-frontend/public/images
Nutrient-frontend/public/images/screenshots
```

These are used by seeded supplements as cover images and screenshots.

Backend upload directory:

```txt
Nutrient-backend/uploads
```

This is for uploaded cover images, screenshots, and supplement files.

Frontend production build output:

```txt
Nutrient-frontend/dist
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
cd Nutrient-backend
npm install
```

```bash
cd ../Nutrient-frontend
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
- Owner-only developer supplement edits.
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
  -> ProductProvider
    -> supplementsApi.list
      -> GET /api/supplements
        -> getsupplements
          -> supplement.find(...)
      <- supplements
    -> normalizeProduct
  -> Home / Store / Navbar search
```

### 23.3 Checkout Flow

```txt
Checkout.jsx
  -> AuthContext.purchasesupplements
    -> orderApi.checkout
      -> POST /api/orders/checkout
        -> checkout
          -> create Order
          -> add supplements to library
          -> clear cart
          -> increment supplement sales
      <- order + library
    -> update frontend cart/library/orders
```

### 23.4 Review Flow

```txt
ProductDetail.jsx
  -> reviewApi.create
    -> POST /api/reviews
      -> createReview
        -> verify ownership
        -> create review
        -> update supplement rating
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
- supplements endpoint.
- Login endpoint.
- Authenticated cart endpoint.

## 25. Notes and Current Design Choices

- The frontend uses localStorage only for token/session caching, not as the database.
- Runtime catalog, cart, library, orders, users, and admin data come from the backend.
- `mockData.js` remains useful as seed data and for static genre labels.
- Payment is intentionally mocked and always completes successfully for academic/demo purposes.
- supplement file downloads use a seeded demo text file unless a developer uploads a real file.
- Uploaded files are stored locally, not in cloud storage.
- The project is designed for local development with MongoDB on the developer machine.

## 26. Summary

Nutrient is now a connected full-stack application:

- React frontend renders the user interface and calls backend APIs.
- Express backend handles auth, RBAC, validation, CRUD, cart, checkout, reviews, downloads, admin logic, and file storage.
- MongoDB stores users, supplements, orders, reviews, cart references, and library references.
- JWT protects authenticated routes.
- Role middleware protects developer and admin features.
- Seed data provides demo accounts and an initial supplement catalog.
- One root command can run the full app.

The result is a complete working project suitable for demonstrating frontend integration, backend API design, MongoDB persistence, authentication, authorization, validation, CRUD operations, and role-based workflows.




