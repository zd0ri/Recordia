# Recordia Final Setup and End-to-End Test Checklist

Use this file when setting up Recordia on a new laptop and when testing the complete application.

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
- [ ] No unexpected browser console errors remain.
- [ ] No credentials are committed.
- [ ] All critical checklist items above pass.
