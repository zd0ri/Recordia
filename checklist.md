# Admin account

- Email: `admin@recordia.com`
- Password: `admin123`

# Recordia Final Setup and End-to-End Test Checklist

Use this file when setting up Recordia on a new laptop and when testing the complete application.

## Rubric status checklist

Status is based on the current source code. `✅ Implemented` means the feature is wired in the
application and still needs a live test before submission. `⚠️ Partial` means some part of the
requirement exists but the full rubric item is not met. `⬜ Not implemented` means no supporting
implementation was found.

### MP1 — Product/Service CRUD, multiple photos, bulk delete (20 pts)

- [x] ✅ Implemented — Product CRUD datatable: create, read, edit, and delete.
- [x] ✅ Implemented — Upload multiple product photos.
- [x] ✅ Implemented — Select products with checkboxes and bulk delete.
- **Current status: 20/20 pts implemented; perform a live admin CRUD test.**

### MP2 — Filter functions (20 pts)

- [x] ✅ Implemented — Price range filter (5 pts).
- [x] ✅ Implemented — Category/genre filter (5 pts).
- [x] ✅ Implemented — Minimum ratings filter (5 pts).
- [x] ✅ Implemented — Review filters by minimum review count on the homepage and by content,
  product, user, and rating in admin review management (5 pts).
- **Current status: 20/20 pts implemented; perform a live filter test.**

### MP3 — Review ratings (20 pts)

- [x] ✅ Implemented — A user can review/rate a product after a completed transaction (10 pts).
- [x] ✅ Implemented — A user can update their own review/rating (5 pts).
- [x] ✅ Implemented — An admin can delete a review (5 pts).
- **Current status: 20/20 pts implemented; verify authorization and recalculated averages live.**

### Term test lab — Transactions, email, and receipt (30 pts)

- [x] ✅ Implemented — Customer can complete a transaction/order (10 pts).
- [x] ✅ Implemented — Admin can update the transaction status (5 pts).
- [x] ✅ Implemented — Status update email includes products, item totals/subtotals, and grand total
  (5 pts).
- [x] ✅ Implemented — PDF receipt is attached to the status update email (10 pts).
- **Current status: 30/30 pts implemented; configure SMTP and verify delivery plus the PDF attachment.**

### Unit 1 — Bad-word filtering and form validation (20 pts)

- [x] ✅ Implemented — Reviews are filtered with the `bad-words` package (10 pts).
- [x] ✅ Implemented — Yup/Formik validation exists for product CRUD, user login, registration, and
  profile/password forms (10 pts).
- **Current status: 20/20 pts implemented; test invalid inputs and profanity in the UI.**

### Unit 2 — User interface design (20 pts maximum)

- [x] ✅ Implemented — Custom CSS styling is present (10 pts tier).
- [ ] ⬜ Not implemented — Bootstrap components were not found in the rendered application (15 pts tier).
- [x] ✅ Implemented — Material UI (MUI) components are used throughout the application (20 pts tier).
- **Current status: 20/20 pts maximum tier implemented. Do not add the Bootstrap tier on top of this
  unless your instructor grades the tiers cumulatively.**

### Quiz 2 — Sales chart (15 pts)

- [x] ✅ Implemented — Sales line/bar charts with year and start/end date filters (15 pts).
- **Current status: 15/15 pts implemented; verify completed orders only and inclusive date behavior.**

### Quiz 3 — Homepage product loading (15 pts maximum)

- [x] ✅ Implemented — Pagination on the homepage product list (10 pts).
- [x] ✅ Implemented — Infinite scroll on the homepage product list (15 pts tier).
- **Current status: 15/15 pts maximum tier implemented. Do not add the pagination tier on top of
  this unless your instructor grades the tiers cumulatively.**

### Quiz 4 — Social login (15 pts)

- [x] ✅ Implemented — Facebook login through Firebase, available from both login and registration.
- [x] ✅ Implemented — Google login through Firebase, available from both login and registration.
- **Current status: 15/15 pts implemented. Enable both providers, configure their developer apps,
  add the local host to authorized domains, restart the frontend, and complete live tests.**

### Rubric summary

| Requirement | Implemented |
|---|---:|
| MP1 | 20/20 |
| MP2 | 20/20 |
| MP3 | 20/20 |
| Term test lab | 30/30 |
| Unit 1 | 20/20 |
| Unit 2 | 20/20 maximum tier |
| Quiz 2 | 15/15 |
| Quiz 3 | 15/15 maximum tier |
| Quiz 4 | 15/15 |
| **Total using maximum-tier scoring** | **175/175** |

**Implementation status:** all listed rubric features are wired in source code. Remaining unchecked
items below are environment setup or live/manual verification steps, not known missing features.

## Other requirements — implementation status

- [x] Order status cannot be changed after `Completed` or `Cancelled`.
- [x] Cancelled orders cannot be modified, and stock is restored only when cancellation follows
  stock deduction.
- [x] Admin login redirects to the admin dashboard and uses an admin-only header with logout.
- [x] Stock is deducted once when an order moves to `Processing`.
- [x] Admin user management can change only role and active status; profile fields are not editable.
- [x] The logged-in admin is excluded from the user list.
- [x] Completed order details show links to review each purchased product.
- [x] A user can submit one review per product, update it, and add a JPG/PNG review image.
- [x] Review submission is limited to products in the user's completed orders.

## 1. Requirements

- [ ] Install Node.js 20 or newer.
- [ ] Confirm Node and npm:

```powershell
node --version
npm --version
```

- [ ] Start MongoDB locally, or prepare a hosted MongoDB connection string.
- [ ] Prepare a Cloudinary account.
- [ ] Prepare a Firebase project.
- [ ] Prepare a Mailtrap account or another SMTP provider.
- [ ] Copy the project folder to the new laptop.

## 2. Install backend dependencies

Open PowerShell in the project folder:

```powershell
cd C:\path\to\recordia\backend
npm install
```

The backend dependencies installed by this project are:

```text
bad-words
bcryptjs
cloudinary
cookie-parser
cors
dotenv
express
firebase-admin
jsonwebtoken
mongoose
multer
nodemailer
nodemon
pdfkit
validator
```

If installing the packages manually instead of using `package-lock.json`:

```powershell
npm install bad-words bcryptjs cloudinary cookie-parser cors dotenv express firebase-admin jsonwebtoken mongoose multer nodemailer nodemon pdfkit validator
```

Recommended when `package-lock.json` is available:

```powershell
npm ci
```

## 3. Install frontend dependencies

Open another PowerShell window:

```powershell
cd C:\path\to\recordia\frontend
npm install
```

The main frontend dependencies installed by this project are:

```text
@emotion/react
@emotion/styled
@mui/icons-material
@mui/material
@mui/x-data-grid
axios
firebase
formik
react
react-dom
react-router-dom
recharts
yup
```

Other dependencies already listed in the frontend package include:

```text
cloudinary
countries-list
react-bootstrap
react-helmet
react-toastify
sweetalert2
```

The frontend development dependencies include Vite, React plugins, ESLint, and React type packages.

If installing the requested frontend packages manually:

```powershell
npm install react-router-dom axios @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-data-grid formik yup firebase recharts
```

Recommended when `package-lock.json` is available:

```powershell
npm ci
```

## 4. Configure backend environment

Create or update:

```text
backend\env.txt
```

Add these variable names:

```text
PORT=4001
NODE_ENV=DEVELOPMENT
DB_URI=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
JWT_EXPIRES_TIME=7d
COOKIE_EXPIRES_TIME=7
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
SMTP_HOST=
SMTP_PORT=2525
SMTP_EMAIL=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=
```

Important:

- [ ] Use a strong private `JWT_SECRET`.
- [ ] Do not commit real credentials.
- [ ] For `FIREBASE_PRIVATE_KEY`, preserve escaped newline characters as `\n`.
- [ ] Rotate credentials if they were shared publicly or committed.

## 5. Configure frontend environment

Create or update:

```text
frontend\.env
```

Add these variable names:

```text
VITE_API_URL=http://localhost:4001/api/v1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Restart Vite after changing frontend environment variables.

## 6. Firebase setup

- [ ] Open Firebase Console.
- [ ] Create or select the Firebase project.
- [ ] Create a Firebase Web App.
- [ ] Copy the web app configuration values to `frontend\.env`.
- [ ] Open **Authentication > Sign-in method**.
- [ ] Enable **Email/Password**.
- [ ] Enable **Google**.
- [ ] Add `localhost` under authorized domains if necessary.
- [ ] Open **Project settings > Service accounts**.
- [ ] Generate a private key.
- [ ] Copy the project ID, client email, and private key to `backend\env.txt`.

## 7. Start the application

### Terminal 1: backend

```powershell
cd C:\path\to\recordia\backend
npm start
```

Expected API address:

```text
http://localhost:4001
```

### Terminal 2: frontend

```powershell
cd C:\path\to\recordia\frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

## 8. Basic build and syntax checks

- [ ] Check backend syntax:

```powershell
cd C:\path\to\recordia\backend
node --check server.js
node --check app.js
node --check controllers\auth.js
node --check controllers\order.js
node --check controllers\product.js
```

- [ ] Build the frontend:

```powershell
cd C:\path\to\recordia\frontend
npm run build
```

- [ ] Confirm the build completes successfully.
- [ ] Treat the large-bundle warning as a warning unless the build fails.

## 9. Registration and login

- [ ] Register with a valid name, email, password, and confirmation.
- [ ] Confirm the account is created and the user is logged in.
- [ ] Register with an avatar.
- [ ] Register without an avatar.
- [ ] Confirm the default avatar is used when no avatar is uploaded.
- [ ] Try an invalid email.
- [ ] Try a short password.
- [ ] Try mismatched password confirmation.
- [ ] Try registering a duplicate email.
- [ ] Log in with valid credentials.
- [ ] Try an incorrect password.
- [ ] Try an unknown email.
- [ ] Confirm an inactive account is blocked.
- [ ] Refresh the browser and confirm the session remains active.
- [ ] Log out and confirm protected pages require login.

## 10. Google and Firebase login

- [ ] Click **Continue with Google**.
- [ ] Complete Google authentication.
- [ ] Confirm a new user is created when appropriate.
- [ ] Log in again with the same Google account.
- [ ] Confirm the existing user account is reused.
- [ ] Test Firebase email/password registration.
- [ ] Test Firebase email/password login.
- [ ] Confirm inactive Firebase-linked users are blocked.
- [ ] Confirm authentication errors show a snackbar or inline message.
- [ ] If Google sign-in fails, record the exact Firebase error code. Check
      `auth/unauthorized-domain`, `auth/popup-blocked`,
      `auth/popup-closed-by-user`, missing `VITE_FIREBASE_*` values, and
      whether the Google provider is enabled in Firebase.
- [ ] Confirm the backend `/firebase-login` request is sent only after Google
      returns an ID token.
- [ ] Confirm the backend Firebase service-account project matches the frontend
      Firebase project.

### Authentication functions without a visible frontend flow

- [ ] Verify the forgot-password API (`POST /password/forgot`) manually with a
      test account and confirm the reset email is delivered.
- [ ] Verify the reset-password API (`PUT /password/reset/:token`) with a
      valid token, expired token, and invalid token.
- [ ] Decide whether forgot/reset password needs a frontend page; no item is
      complete until the intended user-facing flow exists or the API is
      intentionally admin-only/documented.

### Facebook login configuration

- [ ] In Firebase Authentication > Sign-in method > Facebook, enable Facebook
      and enter the Facebook App ID and App Secret.
- [ ] If Firebase reports `auth/invalid-credential` or
      `Error validating client secret`, open Facebook Developer > Settings >
      Basic, reveal or regenerate the current **App Secret**, then copy the
      complete value into Firebase's Facebook provider configuration. Use the
      App Secret, not the App ID, and do not include quotes or extra spaces.
- [ ] Save the Firebase provider configuration, then retry in a fresh browser
      session. If the secret was regenerated, replace it in Firebase immediately;
      the previous secret is invalid.
- [ ] If Facebook still shows the old `auth/invalid-credential` error after
      updating the secret, disable and re-enable the Facebook provider in
      Firebase, re-enter the App ID and newly generated App Secret as a pair,
      save, sign out of Facebook in the popup, clear the site's Firebase/Auth
      cookies, and retry. The Facebook popup login alone is not proof that the
      Firebase token exchange succeeded.
- [ ] In the Facebook Developer app, add the Firebase auth domain to **App Domains**
      as a hostname only:

```text
recordia-b74a5.firebaseapp.com
```

- [ ] In Facebook Login > Settings, add this exact OAuth redirect URI:

```text
https://recordia-b74a5.firebaseapp.com/__/auth/handler
```

- [ ] In Firebase Authentication > Settings > Authorized domains, add `localhost`
      and `recordia-b74a5.firebaseapp.com`.
- [ ] Restart the Vite frontend after changing Firebase or Facebook settings.

## 11. Profile

- [ ] View the profile.
- [ ] Update the name.
- [ ] Update the email.
- [ ] Upload a replacement avatar.
- [ ] Update the profile without selecting an avatar.
- [ ] Confirm the current avatar is preserved when no replacement is uploaded.
- [ ] Change the password successfully.
- [ ] Try an incorrect old password.
- [ ] Try mismatched password confirmation.
- [ ] Confirm success and error feedback is displayed.

## 12. Admin access and user management

- [ ] Try opening an admin route as a normal user.
- [ ] Confirm the normal user is redirected.
- [ ] Log in as an admin.
- [ ] Open the admin dashboard.
- [ ] Search users by name.
- [ ] Search users by email.
- [ ] Edit a user's name.
- [ ] Edit a user's email.
- [ ] Change a user's role.
- [ ] Activate an inactive user.
- [ ] Deactivate an active user.
- [ ] Try to deactivate yourself.
- [ ] Try to demote yourself.
- [ ] Confirm both self-modification actions are blocked.

## 13. Admin products

- [ ] Create a product.
- [ ] Confirm album title is required.
- [ ] Confirm artist is required.
- [ ] Confirm genre is required.
- [ ] Confirm merchandise type is required.
- [ ] Confirm price accepts valid numbers only.
- [ ] Confirm stocks accepts valid non-negative numbers.
- [ ] Upload multiple product images.
- [ ] Confirm image previews appear.
- [ ] Edit a product.
- [ ] Replace product images.
- [ ] Edit without replacing images.
- [ ] Search products with quick search.
- [ ] Select multiple products.
- [ ] Confirm the bulk-delete dialog.
- [ ] Delete selected products.
- [ ] Delete one product.
- [ ] Confirm deleted products disappear.

## 14. Genres and artists

- [ ] Create a genre.
- [ ] Edit a genre.
- [ ] Delete an unused genre.
- [ ] Try to delete a genre used by a product.
- [ ] Confirm the backend error is shown.
- [ ] Create an artist.
- [ ] Edit an artist.
- [ ] Delete an unused artist.
- [ ] Try to delete an artist used by a product.
- [ ] Confirm the backend error is shown.

## 15. Homepage filters, pagination, and infinite scroll

- [ ] Load the homepage.
- [ ] Confirm loading state or skeletons appear.
- [ ] Confirm products display.
- [ ] Search by keyword.
- [ ] Filter by price range.
- [ ] Filter by genre.
- [ ] Filter by artist.
- [ ] Filter by minimum rating.
- [ ] Confirm filters are stored in the URL.
- [ ] Refresh while filters are active.
- [ ] Confirm filters are restored.
- [ ] Confirm no-result searches show an empty state.
- [ ] Use pagination.
- [ ] Move between pages.
- [ ] Switch to infinite scroll.
- [ ] Scroll to the bottom.
- [ ] Confirm the next page loads and appends.
- [ ] Confirm infinite scroll stops when there are no more pages.
- [ ] Change a filter while using infinite scroll.
- [ ] Confirm results reset to the first page.

## 16. Product details and cart

- [ ] Open a product detail page.
- [ ] View product images.
- [ ] Navigate between multiple images.
- [ ] Confirm title, artist, genre, description, price, merchandise type, and stock.
- [ ] Select a quantity.
- [ ] Add the product to the cart.
- [ ] Confirm the Navbar cart count updates.
- [ ] Attempt to exceed available stock.
- [ ] Confirm quantity is capped at stock.
- [ ] Refresh the browser.
- [ ] Confirm the cart persists in local storage.
- [ ] Increase and decrease item quantities.
- [ ] Remove an item.
- [ ] Clear the cart.
- [ ] Confirm the empty-cart state.

## 17. Checkout and customer orders

- [ ] Add an item and open checkout.
- [ ] Confirm shipping fields are required.
- [ ] Try invalid shipping values.
- [ ] Select GCash.
- [ ] Select COD.
- [ ] Confirm unsupported payment methods are rejected.
- [ ] Submit a valid order.
- [ ] Confirm the backend recalculates prices.
- [ ] Confirm client-submitted prices are ignored.
- [ ] Confirm stock is checked.
- [ ] Test an insufficient-stock order.
- [ ] Confirm new orders start as `Pending`.
- [ ] Confirm stock is not deducted when the order is created.
- [ ] Confirm the order success page appears.
- [ ] Confirm the cart clears after checkout.
- [ ] Open My Orders.
- [ ] Confirm only the logged-in user's orders appear.
- [ ] Open an order detail page.
- [ ] Confirm shipping, payment, status, items, and totals.
- [ ] Try to open another user's order.
- [ ] Confirm access is denied.

## 18. Admin orders and stock workflow

- [ ] Open the admin orders page.
- [ ] Filter orders by status.
- [ ] Confirm customer name and email are shown.
- [ ] Open an order detail page.
- [ ] Change `Pending` to `Processing`.
- [ ] Confirm stock is deducted once.
- [ ] Repeat the update request.
- [ ] Confirm stock is not deducted twice.
- [ ] Change the order to `Shipped`.
- [ ] Change the order to `Completed`.
- [ ] Confirm `deliveredAt` is set only when completed.
- [ ] Try to modify a completed order.
- [ ] Confirm the modification is blocked.
- [ ] Create another order and process it.
- [ ] Cancel it after stock deduction.
- [ ] Confirm stock is restored.
- [ ] Try an invalid status.
- [ ] Confirm the backend rejects it.

## 19. Order email and PDF receipt

- [ ] Configure valid Mailtrap credentials.
- [ ] Update an order status as an admin.
- [ ] Open the Mailtrap inbox.
- [ ] Confirm the customer receives an HTML email.
- [ ] Confirm the email includes product, quantity, price, subtotal, tax, shipping, grand total, payment method, and status.
- [ ] Download the PDF attachment.
- [ ] Confirm the PDF includes Recordia branding, order ID, date, customer name, item table, totals, payment method, and status.
- [ ] Temporarily use invalid SMTP credentials.
- [ ] Confirm the order update still succeeds.
- [ ] Confirm a warning is returned instead of failing the update.

## 20. Reviews and bad-word filtering

- [ ] Confirm logged-out users can view product reviews.
- [ ] Confirm a user cannot review a product without a completed order.
- [ ] Complete an order containing a product.
- [ ] Confirm the user can now review that product.
- [ ] Submit a rating and comment.
- [ ] Confirm the review appears.
- [ ] Edit the review.
- [ ] Confirm only one review exists for the user/product pair.
- [ ] Delete the user's own review.
- [ ] Confirm the review is removed.
- [ ] Confirm product rating and review count recalculate.
- [ ] Delete the last review.
- [ ] Confirm the product rating becomes zero.
- [ ] Submit profanity in a review.
- [ ] Confirm profanity is replaced with `***`.
- [ ] Open admin reviews.
- [ ] Confirm product, user, rating, and comment appear.
- [ ] Delete a review as an admin.

## 21. Sales dashboard

- [ ] Create completed orders in more than one month.
- [ ] Create pending, cancelled, and shipped orders.
- [ ] Open the admin dashboard.
- [ ] Confirm only completed orders are counted.
- [ ] Confirm all 12 labels appear: Jan through Dec.
- [ ] Confirm months without sales are zero-filled.
- [ ] Confirm total sales.
- [ ] Confirm completed order count.
- [ ] Select another year.
- [ ] Apply a start and end date.
- [ ] Confirm orders outside the range are excluded.
- [ ] Confirm the end date is inclusive.
- [ ] Try an end date before the start date.
- [ ] Confirm validation prevents the request.
- [ ] Reset the date range.
- [ ] Toggle between line and bar charts.
- [ ] Confirm loading state appears while data loads.
- [ ] Confirm the empty state appears when there are no completed sales.

## 22. Mobile testing

Test using browser responsive mode or a real phone:

- [ ] Homepage works at a narrow width.
- [ ] Navbar wraps without hiding essential actions.
- [ ] Product cards fit the screen.
- [ ] Product details stack correctly.
- [ ] Filters are usable on mobile.
- [ ] Cart and checkout forms fit without horizontal scrolling.
- [ ] Admin sidebar wraps into a usable mobile layout.
- [ ] DataGrid pages can be horizontally scrolled when necessary.
- [ ] Dialogs fit the viewport.
- [ ] Dashboard controls wrap correctly.
- [ ] Charts remain readable on mobile.
- [ ] Snackbar messages are visible on mobile.

## 23. Final result

- [ ] Backend starts without fatal errors.
- [ ] Frontend starts without fatal errors.
- [ ] Production build succeeds.
- [ ] Frontend lint completes with no errors; review the existing hook warnings
      in `admin/Dashboard`, `admin/Orders`, and `admin/Users`.
- [ ] No unexpected browser console errors remain.
- [ ] No credentials are committed.
- [ ] All critical checklist items above pass.

## Failure report template

Use this for every unchecked or failed item:

```text
Feature:
Environment:
Route/action:
Steps to reproduce:
Expected result:
Actual result:
HTTP status:
Browser console error:
Backend log/error:
Screenshot or request ID:
```
