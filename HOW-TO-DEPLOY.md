# How to Deploy DK-OctoBot

This guide provides step-by-step instructions for deploying the DK-OctoBot application on a production server. It covers prerequisites, setup, configuration, and running the application.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your server:

- **Node.js**: Version 18.x or later
- **pnpm**: For managing packages
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

Install the required Node.js packages:

```bash
pnpm install
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
# Authentication
JWT_SECRET="a_very_strong_and_long_random_secret_string"

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Node Environment
NODE_ENV="production"

# Built-in Storage APIs (Optional - for image uploads)
BUILT_IN_FORGE_API_URL=""
BUILT_IN_FORGE_API_KEY=""
```

#### **Environment Variable Details**

| Variable | Description |
| :--- | :--- |
| `JWT_SECRET` | A long, random, and secret string used to sign session cookies. You can generate one using `openssl rand -hex 32`. |
| `DATABASE_URL` | The full connection string for your PostgreSQL database. |
| `NODE_ENV` | Set to `production` to enable production-specific optimizations. |

### Step 2.5: Run Database Migrations

The application will automatically run migrations and seed the default admin account on startup.

The default admin credentials are:
- **Email:** `DK-OctoBot-Tests@Gmail.com`
- **Password:** `Eng.OCTOBOT.DK.Company.Dodge.Kareem.12.it.com`

> **Important:** Change the default password after first login via the Admin Management page.

### Step 2.6: Authentication

The platform uses simple email/password authentication. No OAuth or external auth providers are needed.

- **Login:** Navigate to `/login` to sign in with email and password.
- **Admin Management:** Logged-in admins can add other admins from the "المسؤولون" (Admins) page in the sidebar.
- **No Register Page:** Only existing admins can create new admin accounts.

## 3. Running the Application

### Step 3.1: Build the Application

Create a production-ready build:

```bash
pnpm run build
```

### Step 3.2: Start the Server

#### **Using PM2 (Recommended for Production)**

1.  Install PM2 globally if you haven't already:
    ```bash
    npm install pm2 -g
    ```

2.  Start the application with PM2:
    ```bash
    pm2 start dist/index.js --name "dk-octobot"
    ```

3.  To ensure your app restarts automatically after a server reboot, run:
    ```bash
    pm2 startup
    pm2 save
    ```

Your application should now be running. You can view logs using `pm2 logs dk-octobot`.

#### **Without PM2 (For testing/development)**

```bash
pnpm start
```

#### **Development Mode**

```bash
pnpm dev
```

This will start the server in development mode with hot reload.
