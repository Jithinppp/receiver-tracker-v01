# Receiver Tracker

Conference issue-desk app for Bosch LBB receivers. Admins create one project
per event, open its kiosk address on the table iPad, and guests collect and
return receivers themselves. Everything is recorded in Firebase with live
counts, a full issue log, and CSV export.

## Features

- Admin sign-in with Firebase Auth (email + password)
- One project per conference: name, venue, date, notes, total receiver count
- iPad kiosk per project at `/project-slug`
  - **Collect** — first name, last name, mobile, receiver number (validated,
    duplicate issues blocked)
  - **Return** — search by receiver number or name, confirm to mark returned
- Admin dashboard per project: out-now / left-in-stock counts, live record
  table, search + filters, CSV export, manual mark-returned / undo
- Project controls: pause/resume, finish event (closes the kiosk), delete
  project (type-the-name confirmation)
- All routes require sign-in; Firestore rules enforce auth-only access

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Firebase Auth +
Firestore · TypeScript

## Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Admin sign-in |
| `/admin` | Signed in | Project list + create project |
| `/admin/[slug]` | Signed in | Dashboard, record, CSV, finish, delete |
| `/[slug]` | Signed in | Kiosk home (Collect / Return) |
| `/[slug]/collect` | Signed in | Collect form |
| `/[slug]/return` | Signed in | Return search + confirm |

## Prerequisites

- Node.js 20+
- A Firebase project (free Spark plan works)

## Firebase setup (one time)

1. **Authentication** — Firebase Console → Build → Authentication →
   Sign-in method → enable **Email/Password**. Then Users → Add user to
   create your admin login.
2. **Firestore** — Build → Firestore Database → Create database
   (production mode, pick the region closest to you).
3. **Rules** — Firestore Database → Rules tab → paste the contents of
   `firestore.rules` from this repo → Publish. No composite indexes are
   needed (the app only uses single-field queries).

## Local setup

```bash
npm install
cp .env.example .env.local
# paste your Firebase web-app config into .env.local
npm run dev
```

Open `http://localhost:3000`, sign in, create a project.

## Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same |

`.env.local` is git-ignored and never committed.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Vercel → Add New → Project → Import the repo
   (framework is auto-detected as Next.js; `vercel.json` is included).
3. Environment Variables → add the six `NEXT_PUBLIC_FIREBASE_*` values
   (same values as your `.env.local`).
4. Deploy. Every `git push` to the connected branch redeploys automatically.

After deploy, sign in on the company iPad once and open
`your-app.vercel.app/your-conference-slug` for the kiosk.

## Data model (Firestore)

```
projects/{projectId}
  name, slug, location, details, eventDate,
  totalReceivers, isActive, finished, finishedAt,
  createdBy, createdAt

projects/{projectId}/issues/{issueId}
  firstName, lastName, fullNameLower, mobile,
  receiverNumber, issuedAt, returned, returnedAt
```

## Scripts

```bash
npm run dev     # local dev server
npm run lint    # eslint
npm run build   # production build
npm run start   # serve the production build
```
