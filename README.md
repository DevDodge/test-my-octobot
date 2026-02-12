# DK-OctoBot Test Platform

A premium AI bot testing platform built by **DK-OctoBot** for managing, testing, and reviewing AI agents powered by Flowise AI. The platform features a stunning dark-themed client chat interface and a comprehensive admin dashboard.

## Features

### Client Side (Arabic RTL Interface)
- **Stunning AI-focused dark theme** with animated particle effects
- **Real-time chat** with Flowise AI-powered bots
- **Message feedback** - Like/Dislike with comments
- **Message editing** - Customize bot responses
- **Session notes** - Add notes for the admin team
- **Review submission** - Rate the bot experience (1-5 stars)
- **Brand collaboration header** - Shows both OctoBot and client brand logos

### Admin Side
- **Dashboard** with real-time analytics
- **Bot management** - Create, edit, delete bots with Flowise API integration
- **Test link generation** - Instantly generate shareable test links after bot creation
- **Tester management** - Add/remove client testers
- **Team management** - Create teams and assign members
- **Session monitoring** - View all live/completed/reviewed test sessions
- **Session detail** - Full chat history with feedback, edits, and notes
- **Export reports** - Download session reports as TXT or MD files
- **Analytics dashboard** - Bot performance and engagement metrics

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui |
| Backend | Express + tRPC |
| Database | MySQL / TiDB Cloud |
| ORM | Drizzle ORM |
| Auth | OAuth (Manus) |
| AI Integration | Flowise AI API |
| Animations | Framer Motion |

## Local Deployment

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MySQL/TiDB database

### Step 1: Clone the Repository

```bash
git clone https://github.com/DevDodge/test-my-octobot.git
cd test-my-octobot
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database (MySQL/TiDB)
DATABASE_URL=mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}

# OAuth (optional for local dev)
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://your-oauth-server.com

# Port (optional, defaults to 3000)
PORT=3000
```

### Step 4: Run Database Migrations

```bash
npx drizzle-kit push
```

### Step 5: Start Development Server

```bash
# Development mode (with hot reload)
NODE_ENV=development npx tsx server/_core/index.ts

# Or use pnpm script
pnpm dev
```

The server will start at `http://localhost:3000`

### Step 6: Build for Production

```bash
# Build the client
npx vite build

# Start production server
npx tsx server/_core/index.ts
```

## Project Structure

```
test-my-octobot/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ClientChat.tsx    # ★ Client chat interface (dark theme)
│   │   │   ├── Home.tsx          # Admin dashboard
│   │   │   ├── Bots.tsx          # Bot management
│   │   │   ├── Testers.tsx       # Tester management
│   │   │   ├── Teams.tsx         # Team management
│   │   │   ├── Sessions.tsx      # Session list
│   │   │   ├── SessionDetail.tsx # Session detail view
│   │   │   └── Analytics.tsx     # Analytics dashboard
│   │   ├── components/           # Shared UI components
│   │   └── lib/                  # Utilities (tRPC client)
│   └── index.html
├── server/                 # Backend Express + tRPC
│   ├── _core/              # Server core (auth, vite, etc.)
│   ├── routers.ts          # tRPC API routes
│   ├── db.ts               # Database queries
│   └── storage.ts          # File storage helpers
├── drizzle/                # Database schema & migrations
│   └── schema.ts           # Drizzle ORM schema
├── shared/                 # Shared types & constants
└── package.json
```

## API Routes

| Route | Type | Description |
|-------|------|-------------|
| `/chat/:token` | Public | Client chat interface |
| `/` | Admin | Dashboard |
| `/bots` | Admin | Bot management |
| `/testers` | Admin | Tester management |
| `/teams` | Admin | Team management |
| `/sessions` | Admin | Session list |
| `/sessions/:id` | Admin | Session detail |
| `/analytics` | Admin | Analytics |

## Creating a Test Bot

1. Go to the admin dashboard → **Bots**
2. Click **Create Bot**
3. Fill in the bot details (name, client name, Flowise API URL)
4. After creation, a dialog appears to generate a **test link**
5. Enter the tester name and click **Generate Test Link**
6. Copy the link and share it with the client

## License

Private - DK-OctoBot
