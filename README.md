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
```

For `FIREBASE_PRIVATE_KEY`, keep the escaped newline sequences (`\n`) when placing the service-account key in an environment file. Never commit real credentials. Rotate database, Cloudinary, JWT, Firebase, and SMTP credentials if they have been shared or committed.

## Frontend environment

Create `frontend/.env` with:

```text
VITE_API_URL=http://localhost:4001/api/v1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

After changing Vite variables, restart the frontend development server.

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
- Product filters, pagination, and infinite scrolling
- Local cart and server-calculated checkout totals
- Order status workflow with stock handling
- Order-status HTML email with PDF receipt attachment
- Completed-order review eligibility and profanity masking
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

## Frontend development notes

The frontend uses Vite with React, Material UI, React Router, Formik, Yup,
Firebase, Axios, Recharts, and the React ESLint tooling. The development
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
