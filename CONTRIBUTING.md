# Contributing to Nutrient 💊

First off, thanks for taking the time to contribute! This is a beginner-friendly project and all skill levels are welcome.

---

## What Can I Work On?

Check the [Issues](https://github.com/Rafique610/nutrient-store-web/issues) tab for tasks labeled:

- `good first issue` — small, well-defined tasks perfect for first-time contributors
- `help wanted` — areas where input is especially welcome
- `ui/ux` — design and styling improvements
- `bug` — something broken that needs fixing

If you have an idea not listed, open an issue first and describe what you want to do. That way we can discuss before you spend time building it.

---

## Getting Started Locally

### Prerequisites

- Node.js 18+
- A free [MongoDB Atlas](https://cloud.mongodb.com) account
- Git

### 1. Fork the repo

Click the **Fork** button at the top right of this page, then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/nutrient-store-web.git
cd nutrient-store-web
```

### 2. Set up the backend

```bash
cd nutrient-backend
npm install
```

Create a `.env` file inside `nutrient-backend/`:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_random_string
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Seed the database with sample data (optional but recommended):

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Set up the frontend

```bash
cd ../nutrient-frontend
npm install
```

Create a `.env` file inside `nutrient-frontend/`:

```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Making a Pull Request

1. Create a new branch from `main`:

```bash
git checkout -b fix/your-feature-name
```

2. Make your changes
3. Test that everything still works locally
4. Commit with a clear message:

```bash
git commit -m "fix: improve mobile layout on Store page"
```

5. Push your branch and open a Pull Request against `main`

In your PR description, briefly explain **what** you changed and **why**.

---

## Commit Message Format

Use this simple format:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `ui:` | Design or styling change |
| `docs:` | Documentation update |
| `refactor:` | Code cleanup, no behavior change |

Example: `ui: add skeleton loading to Store page`

---

## Project Structure (Quick Reference)

```
nutrient-frontend/src/
├── components/       # Reusable UI components (Navbar, ProductCard, etc.)
├── context/          # Auth and Product global state
├── pages/            # One file per page/route
└── services/api.js   # All API calls live here

nutrient-backend/
├── controllers/      # Business logic
├── models/           # MongoDB schemas
├── routes/           # Express route definitions
└── middleware/       # Auth, role checks, error handling
```

---

## Questions?

Open an issue and tag it `question`. Happy to help you get started.
