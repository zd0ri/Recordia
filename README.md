# Recordia

Recordia is a music and merchandise store with an Express/MongoDB API and a Vite/React frontend.

## Requirements

- Node.js 20 or newer
- MongoDB (local or hosted)
- A Cloudinary account for image uploads
- A Firebase project for email/password and Google sign-in
- Mailtrap or another SMTP provider for order emails

## Run locally

Install dependencies once:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Start the API in one terminal:

```powershell
cd backend
npm start
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.
The API normally runs at `http://localhost:4001`.

## Backend environment

Create or update `backend/env.txt` with these variables:

```text
PORT=
NODE_ENV=
DB_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
JWT_EXPIRES_TIME=
COOKIE_EXPIRES_TIME=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_EMAIL=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=
FRONTEND_URL=http://localhost:5173
```

For `FIREBASE_PRIVATE_KEY`, keep the escaped newline sequences (`\n`) when placing the service-account key in an environment file. Never commit real credentials. Rotate database, Cloudinary, JWT, Firebase, and SMTP credentials if they have been shared or committed.

## Frontend environment

Create `frontend/.env` with:

```text
VITE_API_URL=https://recordia-seven.vercel.app/api/v1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

After changing Vite variables, restart the frontend development server.

## Deploy the backend to Vercel

1. Import the repository into Vercel and set **Root Directory** to `backend`.
2. Add the backend variables from the environment list above in **Project Settings > Environment Variables**. Use a hosted MongoDB connection string for `DB_URI`; Vercel cannot reach the local MongoDB fallback.
3. Deploy. Visit `https://<your-backend-deployment>.vercel.app/` to verify the API responds. API routes are under `/api/v1` (for example, `/api/v1/products`).
4. In the frontend's Vercel project, set `VITE_API_URL` to `https://<your-backend-deployment>.vercel.app/api/v1`, then redeploy the frontend.
5. Set `FRONTEND_URL` to the deployed frontend URL and allow that URL in Firebase Authentication's authorized domains.

Do not upload `env.txt` or commit credentials. Set secrets in Vercel's environment-variable settings instead.

## Firebase setup

1. Create a Firebase web app and copy its configuration into `frontend/.env`.
2. Enable Email/Password and Google under **Authentication > Sign-in method**.
3. Add `localhost` under **Authentication > Settings > Authorized domains** if it is not already present.
4. Under **Project settings > Service accounts**, generate a private key.
5. Put the service-account project ID, client email, and escaped private key in the backend variables.

## Main features

- Email/password and Google authentication
- Profile and avatar management
- Product, artist, genre, user, order, and review administration
- Database-backed product filters and homepage infinite scrolling
- Homepage price and exact-rating sliders
- Email password-reset links
- Local cart and server-calculated checkout totals
- Order status workflow with stock handling
- Order-status HTML email with PDF receipt attachment
- Completed-order reviews, purchase-history review links, and collector testimonials
- Sales dashboard with year/date filters and line/bar charts

## Validation commands

```powershell
cd backend
node --check server.js
node --check app.js

cd ..\frontend
npm run build
```

The project currently has no automated test script; use [checklist.md](./checklist.md) for manual integration testing.

Product reviews are stored in the MongoDB `reviews` collection, which Mongoose
creates automatically when the first review is saved. Reviews are unique by
checkout and product, so customers can review the same product again after a
separate completed checkout. After upgrading, run `npm run migrate:review-indexes`
from `backend` once to replace the previous product/customer unique index.
To move reviews embedded in older product documents into the collection, run
`npm run migrate:reviews` from `backend` after configuring the database connection.

## Frontend development notes

The frontend uses Vite with React, Material UI, React Router, Redux Toolkit,
Formik, Yup, Firebase, Axios, Recharts, and the React ESLint tooling. The development
server provides hot module replacement while `npm run build` creates the
production bundle.

Useful frontend commands:

```powershell
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```
