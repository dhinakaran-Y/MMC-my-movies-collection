<div align="center">

# 🎬 My Movies Collection (MMC)

**Your personal, full-stack digital entertainment hub and smart watchlist manager.**

Discover, organize, track, clone, and share movies, TV shows, and anime with custom categorization, multi-provider data ingestion, and peer-to-peer collection sharing.

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

MMC aggregates entertainment data across multiple external providers (**TMDB**, **AniList**, **TVmaze**, **Watchmode**, and **OMDb**) into a unified, high-performance interface. Build custom collections, track watched items, request and clone friend collections with granular permissions, create custom movie entries, and share your curated playlists.

---

## ✨ Key Features

### 🔍 Multi-Provider Discovery & Smart Ingestion
- **Unified Providers:** Seamlessly search and browse across **TMDB** (Movies & TV), **AniList** (Anime & Manga GraphQL), **TVmaze** (Series & Episodes), **Watchmode** (Streaming OTT Availability), and **OMDb** (IMDb & Critic Ratings).
- **Source Badges:** Movie and series cards display distinct, color-coded badges indicating their source provider (**TMDB**, **AniList**, **TVmaze**, **Watchmode**, **OMDb**, or **Custom**).
- **Deep Filter System:** Filter by genre, original language, streaming OTT services (Netflix, Prime, Disney+, etc.), release year range, and user ratings.
- **Provider Resilience & Auto-Retry:** Integrated 3-attempt exponential backoff system for transient server errors (HTTP 500, 502, 503, 504) and safe fallback cards during upstream outages (e.g., AniList API maintenance) so your collection never drops items.

### 👥 Peer-to-Peer Collection Cloning
- **2-Step Collaboration Flow:**
  1. **Request:** Request to clone another user's collections simply by entering their email address.
  2. **Grant & Filter:** The owner receives the request and filters which collections to share (**All**, **Public Only**, **Private Only**, or **Custom Selection**).
  3. **Preview & Confirm:** The requester previews individual movies inside the shared collections before confirming the final clone into their library.
- **Live Notifications:** Numbered badge indicators on the header profile avatar notify users of incoming requests and approvals in real time.
- **Auto Duplicate Handling:** Cloned collections automatically append `(cloned)` tags to ensure clean library organization without name conflicts.

### 📁 Custom Collections & Watchlist Tracking
- **Themed Collections:** Create public or private collections (e.g., *"Cyberpunk Classics"*, *"Weekend Binge"*) with custom names and privacy controls.
- **Smart Watchlist & History:** Add movies or shows with one click. Track what you've watched with dedicated counters and history logs.
- **Custom Movie Entries:** Manually register indie films, local releases, or unlisted media with custom posters, synopsis, and metadata.
- **Shareable Playlists:** Generate direct shareable links to showcase your public collections with friends.

### 🔐 Authentication & Account Management
- **Google OAuth 2.0 & Local Auth:** Sign in with one click via Google or traditional email/password credentials.
- **Account Disambiguation:** Handles scenarios where both a Google account and a local account share the same email address, displaying clear badges and provider indicators during requests.
- **Role-Based Access Control (RBAC):**
  - **Guest:** Browse and search providers; view publicly shared collections.
  - **User:** Full CRUD on personal collections, watchlist tracking, clone requests, and profile customization.
  - **Admin:** Platform-wide analytics dashboard (total users, collections, and watched items), user management, and moderation tools.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [Jose](https://github.com/panva/jose) |
| **Backend** | [Node.js](https://nodejs.org/), [Express 5](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [Mongoose 9](https://mongoosejs.com/), [JWT](https://jwt.io/), [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs), [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| **Data Providers** | [TMDB API](https://www.themoviedb.org/), [AniList GraphQL](https://anilist.gitbook.io/anilist-apiv2-docs/), [TVmaze API](https://www.tvmaze.com/api), [Watchmode API](https://api.watchmode.com/), [OMDb API](https://www.omdbapi.com/) |
| **Tooling** | Concurrently, ESLint, PostCSS |

---

## 📂 Project Structure

```text
MMC-my-movies-collection/
├── package.json              # Root monorepo runner (concurrently runs UI & Server)
├── server/                   # Express 5 REST API backend
│   ├── controllers/          # Controllers (auth, googleAuth, collections, cloneRequest, admin)
│   ├── db/                   # MongoDB connection logic
│   ├── middleware/           # JWT verification & RBAC middlewares
│   ├── models/               # Mongoose schemas (User, Collection, CloneRequest, WatchList)
│   ├── routers/              # API route definitions
│   ├── schemas/              # Zod request validation schemas
│   └── index.js              # Server entry point
└── ui/                       # Next.js 16 frontend
    ├── src/
    │   ├── app/              # Next.js App Router
    │   │   ├── (auth)/       # Authentication pages (login, register)
    │   │   ├── (main)/       # Application routes (collections, watchlist, profile, admin)
    │   │   └── api/          # Internal Next.js API routes & auth callbacks
    │   ├── components/       # Reusable components (MovieCard, CollectionMovieCard, Modals)
    │   ├── context/          # React Context providers (AuthContext, CollectionModalContext)
    │   └── lib/providers/    # Provider adapters (TMDB, AniList, TVmaze, Watchmode, OMDb)
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local database or MongoDB Atlas URI)
- [TMDB API Key](https://www.themoviedb.org/settings/api)
- [Google Cloud Console Credentials](https://console.cloud.google.com/) (OAuth 2.0 Client ID & Secret)

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
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

   **Frontend Configuration (`ui/.env`):**
   ```env
   TMDB_API_KEY=your_tmdb_api_key
   WATCHMODE_API_KEY=your_watchmode_api_key
   JWT_SECRET=your_jwt_secret_key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   ```

4. **Run the Application:**

   Start both backend and frontend concurrently from the root directory:
   ```bash
   npm run dev
   ```

   - **Frontend UI:** `http://localhost:3000`
   - **Backend API:** `http://localhost:5000`

---

## 🔌 API Reference Overview

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|---|
| **Auth** | `POST` | `/register` | Register a local user account | ❌ |
| | `POST` | `/login` | User login with email & password | ❌ |
| | `POST` | `/google-login` | Exchange Google OAuth code for session | ❌ |
| | `GET` | `/me` | Get current authenticated user session | ✅ |
| | `POST` | `/logout` | Clear user session & cookies | ❌ |
| **Collections** | `GET` | `/get-collections/:ownerId` | Retrieve all collections for a user | ✅ |
| | `POST` | `/collection` | Create a new custom collection | ✅ |
| | `GET` | `/collection/:id` | Fetch details & movies of a single collection | ❌ (Public/Protected) |
| | `PATCH` | `/collection/:id` | Update collection name & privacy settings | ✅ |
| | `DELETE` | `/collection/:id` | Delete a collection | ✅ |
| **Clone Requests**| `POST` | `/clone-request` | Send a collection clone request to a user | ✅ |
| | `GET` | `/clone-requests/incoming` | Fetch pending requests received by the user | ✅ |
| | `GET` | `/clone-requests/sent` | Fetch requests sent by the user | ✅ |
| | `GET` | `/clone-requests/notifications` | Get count of unread requests for header badge | ✅ |
| | `PATCH`| `/clone-request/:id/respond`| Accept (with permission filter) or reject request | ✅ |
| | `GET` | `/clone-request/:id/shared-collections`| Preview collections & movies shared by giver | ✅ |
| | `PATCH`| `/clone-request/:id/confirm`| Confirm final selection & clone into library | ✅ |
| | `DELETE`| `/clone-request/:id` | Dismiss a completed or rejected clone request | ✅ |
| **Watchlist** | `GET` | `/watch-list/:userId` | Get user's personal watchlist items | ✅ |
| | `PATCH` | `/add-movie` | Add a movie or series to a collection | ✅ |
| | `PATCH` | `/remove-movie` | Remove a movie or series from a collection | ✅ |
| | `PATCH` | `/add-watched` | Mark an item as watched | ✅ |
| | `PATCH` | `/remove-watched` | Remove an item from the watched history | ✅ |
| **Custom Movies**| `POST` | `/custom-movie` | Register a custom indie title or media entry | ✅ |
| | `GET` | `/custom-movie/:id` | Fetch custom movie details | ❌ |
| | `PATCH` | `/custom-movie/:id` | Update custom movie metadata & poster | ✅ |
| | `DELETE` | `/custom-movie/:id` | Delete a custom movie entry | ✅ |
| **Admin** | `GET` | `/users` | Get all registered accounts | 👑 (Admin) |
| | `GET` | `/admin/users-count` | Platform total users metric | 👑 (Admin) |
| | `GET` | `/admin/watched-movies-count` | Platform total watched items metric | 👑 (Admin) |
| | `GET` | `/admin/collections-count` | Platform total collections metric | 👑 (Admin) |
| | `DELETE` | `/admin/users/:id` | Delete a user account and associated data | 👑 (Admin) |

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