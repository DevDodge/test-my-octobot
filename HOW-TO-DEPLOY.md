# How to Deploy DK-OctoBot

This guide provides step-by-step instructions for deploying the DK-OctoBot application on a production server. It covers prerequisites, setup, configuration, and running the application.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your server:

- **Node.js**: Version 18.x or later
- **npm** or **pnpm**: For managing packages
- **PostgreSQL**: A running PostgreSQL database instance
- **Git**: For cloning the repository
- **PM2**: (Recommended) A process manager for Node.js to keep the application running

## 2. Server Setup

### Step 2.1: Clone the Repository

Clone the project from GitHub to your server:

```bash
git clone https://github.com/DevDodge/test-my-octobot.git
cd test-my-octobot
```

### Step 2.2: Install Dependencies

Install the required Node.js packages for both the server and the client:

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2.3: Set Up the PostgreSQL Database

1.  Create a new PostgreSQL database and a user with privileges to access it.
2.  Keep the database URL handy. The format is typically:
    `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Step 2.4: Configure Environment Variables

Create a `.env` file in the root of the project directory. This file will store all the necessary environment variables.

```bash
touch .env
```

Copy and paste the following template into your `.env` file and fill in the values accordingly. **Do not commit this file to version control.**

```env
# Application & Authentication
VITE_APP_ID="your_manus_app_id"
JWT_SECRET="a_very_strong_and_long_random_secret_string"
OAUTH_SERVER_URL="https://login.manus.ai"
OWNER_OPEN_ID="your_manus_owner_open_id"

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Node Environment
NODE_ENV="production"

# Built-in Manus Forge APIs (Optional)
# These are pre-configured in the scaffold and may not need changes.
BUILT_IN_FORGE_API_URL=""
BUILT_IN_FORGE_API_KEY=""
```

#### **Environment Variable Details**

| Variable | Description |
| :--- | :--- |
| `VITE_APP_ID` | Your Manus App ID for OAuth integration. |
| `JWT_SECRET` | A long, random, and secret string used to sign session cookies. You can generate one using `openssl rand -hex 32`. |
| `OAUTH_SERVER_URL` | The URL for the Manus OAuth server. Should be `https://login.manus.ai`. |
| `OWNER_OPEN_ID` | The OpenID of the primary admin/owner account from Manus. |
| `DATABASE_URL` | The full connection string for your PostgreSQL database. |
| `NODE_ENV` | Set to `production` to enable production-specific optimizations. |

### Step 2.5: Run Database Migrations

Apply the database schema and any pending migrations to your PostgreSQL database. This will create all the necessary tables.

```bash
npm run db:migrate
```

## 3. Running the Application

### Step 3.1: Build the Client

Create a production-ready build of the React client application:

```bash
npm run build:client
```

This command bundles the client-side assets into the `client/dist` directory, which will be served by the server.

### Step 3.2: Start the Server

You can start the server directly, but for production, it is highly recommended to use a process manager like PM2.

#### **Using PM2 (Recommended for Production)**

1.  Install PM2 globally if you haven\\\\'t already:
    ```bash
    npm install pm2 -g
    ```

2.  Start the application with PM2:
    ```bash
    pm2 start build/server/index.js --name "dk-octobot"
    ```

3.  To ensure your app restarts automatically after a server reboot, run:
    ```bash
    pm2 startup
    pm2 save
    ```

Your application should now be running. You can view logs using `pm2 logs dk-octobot`.

#### **Without PM2 (For testing/development)**

```bash
npm start
```

This will start the server, but it will stop if your terminal session ends. This is not suitable for a production environment.
