# DK-OctoBot Test Platform TODO

## Database & Backend
- [x] Design and apply database schema (bots, clients, teams, sessions, messages, feedback, notes)
- [x] Create backend query helpers (db.ts)
- [x] Create tRPC routers for all features
- [x] Flowise API proxy endpoint for chat predictions

## Admin Side
- [x] Admin dashboard layout with sidebar navigation
- [x] Bot management: create, edit, delete bots (name, client name, brand logo, Flowise chatflow URL)
- [x] Client/tester management: add/remove testers, assign bots
- [x] Team management: create teams, add members
- [x] Live test sessions view: see all active/completed tests per client
- [x] Test session detail: chat history with ratings, notes, edited messages
- [x] Export test reports as downloadable TXT and MD files
- [x] Admin notes per client and per test session
- [x] Visual analytics dashboard: bot performance, satisfaction trends, engagement patterns
- [x] Assign edit tasks to team members from review submissions

## Client Side
- [x] Shareable link for client to access their assigned bot chat
- [x] Modern chat interface with real-time Flowise AI conversation
- [x] Like button with positive comment modal
- [x] Dislike button with negative comment/edit modal
- [x] Edit button to customize/correct bot response
- [x] Agent notes button for overall chat notes
- [x] Submit review button to send feedback to admin
- [x] Session management with conversation history and timestamps

## Design & UX
- [x] OctoBot color palette (deep navy, tech blue, cyan glow, steel blue)
- [x] Mobile-responsive design for both admin and client sides
- [x] Upload and integrate DK-OctoBot logo
- [x] Dark/light theme support matching OctoBot brand

## Testing & Deployment
- [x] Write vitest tests for backend procedures
- [x] End-to-end verification
- [x] Push to GitHub repo (via Management UI GitHub export)
