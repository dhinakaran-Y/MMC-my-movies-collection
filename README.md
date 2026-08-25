<div align="center">

# 🎬 My Movies Collection (MMC)

**Your personal, full-stack digital entertainment hub and smart watchlist manager.**

Discover, organize, track, and share movies, TV shows, and anime with custom categorization, multi-provider data ingestion, and advanced filtering.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 📌 Overview

Tired of scattered notes, browser bookmarks, or messy screenshot folders to keep track of movies and shows? **My Movies Collection (MMC)** is a dedicated digital entertainment management platform built to centralize your viewing experience. 

MMC aggregates entertainment data across multiple external providers (TMDB, AniList, TVmaze, Watchmode, OMDB) into a unified interface, while giving you the freedom to build custom collections, track watched movies, create custom movie entries, and share your curated playlists.

---

## ✨ Key Features

### 🔍 Multi-Provider Discovery & Smart Filtering
- **Dynamic API Providers:** Seamlessly switch between sources such as **TMDB** (Movies & TV), **AniList** (Anime & Manga), and TV series databases with normalized media views.
- **Deep Filter System:** Filter by genre, language, streaming OTT services (Netflix, Prime, Disney+, etc.), release year range, and rating.
- **Instant Search:** Fast search by title across all supported providers.

### 📁 Custom Collections & Watchlist Management
- **Custom Collections:** Create tailored, themed collections (e.g., *“Sci-Fi Classics”*, *“Weekend Binge”*) with custom names and metadata.
- **Dedicated Watchlist:** Add movies or shows to your personal watchlist with one click.
- **Watched Tracking:** Mark items as watched with dedicated counters and history tracking.
- **Custom Movie Entries:** Manually add custom or indie titles not available on public databases with custom posters and details.

### 🔗 Social & Shareable Playlists
- **Share Collections:** Share your curated lists with friends via unique shareable links.
- **Public & Private Views:** Flexible privacy controls for collections.

### 🛡️ Role-Based Access Control (RBAC)
- **👥 Guest User:** Search, browse, and filter media across providers; view publicly shared collections.
- **👤 Registered User:** Authenticated access (JWT), full CRUD on collections, watchlist management, watched tracking, custom movie creation, and profile customization.
- **👑 Admin:** Dedicated Admin Dashboard with platform-wide analytics (total users, collections, and watched items), user management, and moderation capabilities.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [Jose](https://github.com/panva/jose) |
| **Backend** | [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [Mongoose 9](https://mongoosejs.com/), [JWT](https://jwt.io/), [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| **Data Providers** | [TMDB API](https://www.themoviedb.org/), [AniList API](https://anilist.gitbook.io/anilist-apiv2-docs/), [TVmaze](https://www.tvmaze.com/api), [Watchmode](https://api.watchmode.com/) |
| **Tooling** | Concurrently, ESLint, PostCSS |

---

## 📂 Project Structure

```text
MMC-my-movies-collection/
├── package.json              # Monorepo orchestrator (runs UI & server concurrently)
├── server/                   # Express.js REST API backend
│   ├── controllers/          # Request handlers (auth, collections, movies, admin)
│   ├── db/                   # MongoDB connection logic
│   ├── middleware/           # Auth (JWT) & RBAC middlewares
│   ├── models/               # Mongoose data schemas (User, Collection, etc.)
│   ├── routers/              # API Route definitions
│   ├── schemas/              # Zod validation schemas
│   ├── utils/                # Helper utilities
│   ├── index.js              # Server entry point
│   └── package.json
└── ui/                       # Next.js 16 frontend
    ├── src/
    │   ├── app/              # Next.js App Router (pages & layouts)
    │   │   ├── (auth)/       # Authentication pages (login, register)
    │   │   ├── (main)/       # Main application routes (sites, collections, admin)
    │   │   └── api/          # Internal Next.js API routes & proxies
    │   ├── components/       # UI components (MovieCard, AsideFilter, CollectionGrid, etc.)
    │   ├── context/          # React Context providers (Auth, UI State)
    │   └── lib/              # Client utilities and provider adapters
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- [TMDB API Key](https://www.themoviedb.org/settings/api)

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dhinakaran-Y/MMC-my-movies-collection.git
   cd MMC-my-movies-collection
   ```

2. **Install dependencies for all workspaces:**
   ```bash
   npm install
   cd server && npm install
   cd ../ui && npm install
   cd ..
   ```

3. **Configure Environment Variables:**

   **Server Configuration (`server/.env`):**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

   **Frontend Configuration (`ui/.env`):**
   ```env
   TMDB_API_KEY=your_tmdb_api_key
   WATCHMODE_API_KEY=your_watchmode_key_optional
   JWT_SECRET=your_jwt_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Run the Application:**

   Start both backend and frontend concurrently from the root directory:
   ```bash
   npm run dev
   ```

   - **Frontend:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000`

---

## 🔌 API Reference Overview

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register a new user | ❌ |
| | `POST` | `/api/auth/login` | User login & token generation | ❌ |
| **Collections** | `GET` | `/get-collections/:ownerId` | Get user collections | ✅ |
| | `POST` | `/collection` | Create a new custom collection | ✅ |
| | `GET` | `/collection/:id` | Get details of a single collection | ❌ (Public/Protected) |
| | `PATCH` | `/collection/:id` | Update collection metadata | ✅ |
| | `DELETE` | `/collection/:id` | Delete a collection | ✅ |
| **Watchlist** | `GET` | `/watch-list/:userId` | Get user watchlist items | ✅ |
| | `PATCH` | `/add-movie` | Add movie/show to collection | ✅ |
| | `PATCH` | `/remove-movie` | Remove movie/show from collection | ✅ |
| | `PATCH` | `/add-watched` | Mark item as watched | ✅ |
| | `PATCH` | `/remove-watched` | Remove item from watched list | ✅ |
| **Custom Movies** | `POST` | `/custom-movie` | Create a custom movie entry | ✅ |
| | `GET` | `/custom-movie/:id` | Get custom movie details | ❌ |
| | `PATCH` | `/custom-movie/:id` | Update custom movie entry | ✅ |
| | `DELETE` | `/custom-movie/:id` | Delete custom movie entry | ✅ |
| **Admin** | `GET` | `/users` | Get all registered users | 👑 (Admin) |
| | `GET` | `/admin/users-count` | Total users metric | 👑 (Admin) |
| | `GET` | `/admin/watched-movies-count`| Total watched movies metric | 👑 (Admin) |
| | `GET` | `/admin/collections-count` | Total collections metric | 👑 (Admin) |
| | `DELETE` | `/admin/users/:id` | Delete a user account | 👑 (Admin) |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/dhinakaran-Y/MMC-my-movies-collection/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  Developed with ❤️ by <a href="https://github.com/dhinakaran-Y">Dhinakaran-Y</a>
</div>