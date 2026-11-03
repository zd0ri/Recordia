# Recordia Code Defense Reviewer

This reviewer explains how the main Recordia features work, where to find them,
why the implementation uses each part, and what to be ready to clarify during a
project defense. Paths are relative to the repository root.

## 1. Project in one minute

Recordia is a music and merchandise storefront. It has a React/Vite frontend, an
Express API, MongoDB documents managed by Mongoose, Cloudinary image storage,
Firebase social/email authentication, and Redux Toolkit state for authentication
and the cart.

The normal request path is:

1. A page or component in `frontend/src` makes an Axios request through
   `frontend/src/api/axios.js`.
2. The Axios instance adds the saved Recordia JWT to the Authorization header
   when one exists.
3. Express receives the request through `backend/app.js`, connects to MongoDB,
   and dispatches it to a router in `backend/routes`.
4. Protected routes pass through authentication/role middleware.
5. A controller in `backend/controllers` validates the request and applies
   business rules using Mongoose models in `backend/models`.
6. The controller returns JSON; the frontend updates Redux or component state
   and renders the result.

## 2. Important folders and files

| Location | Responsibility |
|---|---|
| `frontend/src/pages/` | Storefront, account, checkout, order, and admin screens. |
| `frontend/src/components/` | Shared UI such as the navbar, product card, and route guards. |
| `frontend/src/context/` | Auth, cart, and snackbar behavior shared by many screens. |
| `frontend/src/store.js` | Redux Toolkit store, auth slice, and cart slice. |
| `frontend/src/api/axios.js` | Shared API client and JWT request header. |
| `frontend/src/firebase.js` | Firebase browser SDK and Google/Facebook/email sign-in functions. |
| `backend/app.js` | Express setup, middleware, health checks, and route mounting. |
| `backend/index.js` / `backend/vercel.json` | Serverless entry point and Vercel routing configuration. |
| `backend/server.js` | Local Node server startup. |
| `backend/routes/` | Maps HTTP methods and paths to middleware and controller functions. |
| `backend/controllers/` | Request handling and application/business logic. |
| `backend/models/` | Mongoose schemas and MongoDB document definitions. |
| `backend/middleware/` | JWT authentication, role authorization, and error responses. |
| `backend/utils/` | Shared helpers for database features, email, PDF, images, and review text. |
| `backend/config/database.js` | MongoDB connection and connection reuse. |

## 3. MP1 — Product CRUD, multiple photos, bulk delete (20 pts)

### Admin product table

- **Screen:** `frontend/src/pages/admin/Products.jsx`, component `Products`.
- **API routes:** `backend/routes/product.js`.
- **Controller functions:** `getAdminProducts`, `deleteProduct`,
  `bulkDeleteProducts`, `newProduct`, and `updateProduct` in
  `backend/controllers/product.js`.
- **Product data model:** `backend/models/product.js`.

The admin table loads products, populates artist and genre names, and displays
them with MUI X `DataGrid`. `checkboxSelection` enables selecting multiple
rows. The selected IDs are sent to `DELETE /api/v1/admin/products/bulk`.
Single-item deletion uses `DELETE /api/v1/admin/product/:id`.

The controller verifies all requested products exist, deletes their Cloudinary
images, deletes their reviews, and then deletes the product documents. This
keeps related images/reviews from being left behind when a product is removed.
The product routes are protected by both `isAuthenticatedUser` and
`authorizeRoles('admin')`.

### Create/edit products and images

- **Form:** `frontend/src/pages/admin/ProductForm.jsx`.
- **Image utility:** `backend/utils/productImages.js`.
- **Upload middleware:** `backend/utils/multer.js`.
- **Routes:** `POST /api/v1/admin/product/new` and
  `PUT /api/v1/admin/product/:id`.

The form accepts multiple JPG/PNG image files. It previews images before saving.
The Multer route allows up to 10 files. The backend uploads them to Cloudinary
and stores each image's `public_id` and secure URL in the product document.
Cloudinary stores the actual image; MongoDB stores its reference and URL.

When editing, the form sends IDs of images the admin wants to retain. The
controller combines retained images with newly uploaded images, then deletes
removed Cloudinary images. This avoids re-uploading images that are already
kept.

The product schema in `backend/models/product.js` defines fields such as
`album_title`, `merch_type`, `price`, `stocks`, artist, genre, and images.
Artist/genre are required for vinyl but optional for merchandise.

**Why this design:** Product information is queryable in MongoDB, while
Cloudinary handles image delivery and avoids storing large binary files in
MongoDB.

## 4. MP2 — Product filters (20 pts)

- **Filter controls and product list:** `frontend/src/pages/Home.jsx`.
- **Navbar filter popover and autocomplete:** `frontend/src/components/Navbar.jsx`.
- **Query parsing:** `backend/utils/apiFeatures.js`.
- **Filter aggregation and product query:** `getProducts` in
  `backend/controllers/product.js`.

The frontend keeps filter state in URL query parameters. This allows filters to
be combined, refreshed, and shared as a URL. The backend adds product criteria
for each provided field, so genre, artist, format, price, search, rating, and
review-count constraints apply together (logical AND across filter groups).

### Price — 5 pts

The homepage price slider writes `price[gte]` and `price[lte]`. The backend
converts them into MongoDB `$gte`/`$lte` comparisons in
`backend/utils/apiFeatures.js`.

### Category/genre — 5 pts

Genres are MongoDB documents referenced by products. The selected genre ID is
sent as `genre`; the backend matches products with that reference. The genre
directory and autocomplete can navigate to the same filtered product list.

### Rating — 5 pts

`Home.jsx` sends `ratings[eq]`. The product controller aggregates reviews per
product, calculates the average rating, and filters on exact equality with the
selected whole-star number.

**Important defense detail:** This is exact-average filtering, not “at least”
filtering. For example, selecting 4 does not include 4.5 or 5. The slider's 0
selection means no rating filter.

### Review count — 5 pts

The homepage can send `reviews[gte]` to require a minimum number of reviews.
Admin review search/filtering is in `frontend/src/pages/admin/Reviews.jsx` and
`getAllReviews` in `backend/controllers/product.js`.

### Search and combined filters

The navbar suggestion request includes active genre, artist, and merchandise
filters. Selecting a genre or artist suggestion applies its database ID; it
does not search only by album title. Product suggestions are implemented by
`getProductSuggestions` in `backend/controllers/product.js`.

**Why query parameters:** They make filter state visible and reproducible, and
let the backend perform filtering before pagination instead of downloading the
entire product collection to the browser.

## 5. MP3 — Product review and rating (20 pts)

- **Review UI:** `frontend/src/pages/ProductDetails.jsx`.
- **Completed-order review links:** `frontend/src/pages/OrderDetails.jsx` and
  `frontend/src/pages/MyOrders.jsx`.
- **API routes:** `backend/routes/product.js`.
- **Business rules:** `createProductReview`, `canReview`, `deleteOwnReview`,
  `deleteReview`, and `syncProductReviewStats` in
  `backend/controllers/product.js`.
- **Review schema:** `backend/models/review.js`.

### Who can review — 10 pts

The UI asks the backend whether a user can review a product for a given order.
The server checks that the order belongs to the authenticated user, is
`Completed`, and contains that product. The backend repeats this eligibility
check when saving a review; it does not rely on the frontend to enforce access.

Review creation validates the rating (1–5), requires a non-empty comment, and
uses an upsert keyed by order and product. That means the same user/order cannot
create duplicate reviews for the same product.

### User can update their review — 5 pts

The same upsert updates the existing review for that order/product. The
product-detail page loads the user's review and presents it for editing.
`DELETE /api/v1/review/me` also supports deleting only the authenticated user's
own matching review.

### Admin can delete reviews — 5 pts

`DELETE /api/v1/reviews` is admin-only. After a review is deleted or updated,
`syncProductReviewStats` recalculates the product's average and review count
from the Review collection. Product list/detail views also calculate current
statistics from reviews.

### Review data

`backend/models/review.js` references the product, order, and user; it also
stores the reviewer's name, numeric rating, comment, optional image, and date.
References make it possible to connect a review to a verified purchase and
show its product/user context in admin tools.

## 6. Orders, status, email, and PDF receipt (30 pts)

- **Cart:** `frontend/src/context/CartContext.jsx` and
  `frontend/src/pages/Cart.jsx`.
- **Checkout:** `frontend/src/pages/Checkout.jsx`.
- **Order confirmation/history:** `frontend/src/pages/OrderSuccess.jsx`,
  `frontend/src/pages/MyOrders.jsx`, and `frontend/src/pages/OrderDetails.jsx`.
- **Admin status UI:** `frontend/src/pages/admin/Orders.jsx` and
  `frontend/src/pages/admin/OrderDetail.jsx`.
- **Backend:** `backend/controllers/order.js` and `backend/models/order.js`.
- **Email/PDF helpers:** `backend/utils/orderEmail.js`,
  `backend/utils/sendEmail.js`, and `backend/utils/generateReceipt.js`.

### Completed transaction/order — 10 pts

The cart is managed by Redux and mirrored to local storage. At checkout, the
frontend sends only product IDs and quantities plus shipping/payment selections.
The server reloads products from MongoDB, checks existence and stock, and
calculates item subtotal, tax, shipping, and total. It saves a snapshot of item
names/prices in the order, so later product edits do not rewrite the order
receipt.

### Admin updates transaction status — 5 pts

The order controller enforces allowed transitions:

`Pending → Processing → Shipped → Completed`

An order can also move from `Pending` to `Cancelled`. Completed and cancelled
orders are terminal. Stock is deducted once on the move to `Processing`, using
the `stockDeducted` flag to prevent repeat deductions.

### Status email contents — 5 pts

After a status change, the backend loads the customer email and calls
`createOrderEmail`. The email lists each item, quantity, unit price, line
subtotal, items total, tax, shipping, grand total, and current status.

### PDF receipt attachment — 10 pts

`generateReceipt` builds a PDF buffer with PDFKit. `sendEmail` sends the
HTML email and attaches that buffer as a PDF. Email failures are caught and
returned as a warning because the order/status has already been saved; check
server logs and SMTP settings during live verification.

### Important payment caveat

The current checkout records `COD` or `GCash` as the selected payment method.
There is no payment-gateway SDK or server-side payment verification in this
implementation. Do not claim that GCash is actually charged or verified. It is
a recorded payment choice unless a separate payment integration is added.

## 7. Unit 1 — Review text filtering and form validation (20 pts)

### Profanity filtering — 10 pts

The review controller calls `filterBadWords` from
`backend/utils/filterBadWords.js` before saving review text. The helper masks
listed individual words and phrases with asterisks. It uses the installed
`Filter` class from the `bad-words` package, adds the project's additional
English and Filipino terms with `addWords()`, and applies the custom phrase
patterns for multi-word expressions. The package filters its built-in list;
the custom additions extend it for the project's language needs.

A blocklist is not a complete language moderation system: it may miss variants
or mask harmless words. The code should be tested with both expected matches
and normal review text.

### Form validation — 10 pts

Forms use Formik to manage values/submission and Yup schemas to validate:

- Product create/edit: `frontend/src/pages/admin/ProductForm.jsx`.
- Login: `frontend/src/pages/Login.jsx`.
- Registration: `frontend/src/pages/Register.jsx`.
- Profile and password: `frontend/src/pages/Profile.jsx`.
- Checkout: `frontend/src/pages/Checkout.jsx`.
- Review rating/comment: `frontend/src/pages/ProductDetails.jsx`.

Yup improves client-side feedback, but the backend must still validate
important rules because API requests can be sent without using the UI. Product
schema constraints and controller checks provide server-side validation for
many operations.

## 8. Unit 2 — UI design (20 pts maximum)

- **Theme:** `frontend/src/theme.js`.
- **Global and page styling:** `frontend/src/index.css` and
  `frontend/src/App.css`.
- **Shared component examples:** `frontend/src/components/Navbar.jsx`,
  `ProductCard.jsx`, and `AdminLayout.jsx`.

MUI provides layout, inputs, buttons, dialogs, tables, ratings, and other
accessible UI primitives. The project applies custom CSS and theme styles to
create a consistent Recordia visual identity. In the rubric, the MUI tier is
the 20-point maximum tier; it should not be added to lower UI tiers unless the
instructor explicitly says the tiers are cumulative.

## 9. Quiz 1 — Sales chart and date filtering (15 pts)

- **Dashboard UI:** `frontend/src/pages/admin/Dashboard.jsx`.
- **Sales aggregation:** `salesPerMonth` in `backend/controllers/order.js`.
- **Route:** `GET /api/v1/admin/sales`.

The admin dashboard offers a year selector, optional start/end dates, and a
line/bar chart (Recharts). The server aggregates completed orders by month or
by day. It makes the selected end date inclusive by adding one day to the
exclusive database query boundary, and returns zero-valued periods so chart
axes remain continuous.

**Date interpretation caveat:** The aggregate currently matches completed
orders by `createdAt`, not `deliveredAt`/completion timestamp. Be prepared to
explain that the report groups completed orders by order creation date, or
change the reporting definition if the instructor expects completion date.

## 10. Quiz 2 — Homepage infinite scroll (15 pts maximum)

- **Implementation:** `frontend/src/pages/Home.jsx`.
- **Backend pagination:** `getProducts` in `backend/controllers/product.js`.

The homepage requests a page of products and uses `IntersectionObserver` on a
sentinel near the end of the list. When it enters the viewport, the next page is
requested and appended. Filter changes reset the effective page to 1; requests
include a fixed page size. This avoids loading every product at once.

## 11. Quiz 3 — Google/Facebook authentication (15 pts)

- **Browser provider setup:** `frontend/src/firebase.js`.
- **Login/register UI:** `frontend/src/pages/Login.jsx` and
  `frontend/src/pages/Register.jsx`.
- **Shared auth state:** `frontend/src/context/AuthContext.jsx`.
- **Server verification and account mapping:** `firebaseLogin` in
  `backend/controllers/auth.js` and `backend/utils/firebaseAdmin.js`.

The browser uses Firebase Auth popup providers to authenticate with Google or
Facebook, then sends the Firebase ID token to the backend. The backend verifies
that token with Firebase Admin, finds or creates the corresponding MongoDB user,
and issues the application's own JWT. The app JWT then protects Recordia API
routes.

**Why verify on the server:** The client must not be trusted to assert a user
identity. The server verifies the token signature/claims before linking it to a
Recordia account.

Provider use depends on Firebase console configuration, authorized domains,
and Google/Facebook developer app credentials. Source code alone cannot prove
those settings or a successful production login.

## 12. Quiz 4 — Redux state management (15 pts)

- **Store and slices:** `frontend/src/store.js`.
- **Provider:** `frontend/src/main.jsx`.
- **Consumers:** `frontend/src/context/AuthContext.jsx` and
  `frontend/src/context/CartContext.jsx`.

Redux Toolkit's `configureStore` combines `auth` and `cart` slices.
`AuthContext` dispatches auth actions and reads the current user/token;
`CartContext` dispatches cart actions and exposes cart operations to components.
Cart state is also saved to local storage so it survives a page reload.

**Why Redux:** It gives shared state one predictable store and avoids passing
auth/cart data through many unrelated component props. Contexts expose
application-specific operations while Redux owns the underlying state.

## 13. Authentication, authorization, and API errors

- **JWT middleware:** `backend/middleware/auth.js`.
- **Auth endpoints/controller:** `backend/routes/auth.js` and
  `backend/controllers/auth.js`.
- **User schema:** `backend/models/user.js`.
- **Error handling:** `backend/utils/catchAsync.js`,
  `backend/utils/ErrorHandler.js`, and `backend/middleware/errorHandler.js`.

Email/password users are stored in MongoDB; the User model hashes passwords
with bcrypt before saving. Login returns a JWT. Protected routes verify the
JWT, load the current user, reject inactive accounts, and attach the user to
the request. `authorizeRoles('admin')` adds a separate role check. A valid
login is not automatically admin access.

Controllers are wrapped with `catchAsync` so rejected async operations reach the
central error handler. The handler maps common validation, cast, duplicate,
JWT, and upload errors to appropriate HTTP status responses.

## 14. Database, images, and Vercel

- **MongoDB connection:** `backend/config/database.js`.
- **Express API and health checks:** `backend/app.js`.
- **Serverless entry:** `backend/index.js` and `backend/vercel.json`.
- **Local startup:** `backend/server.js`.
- **Environment variable guidance:** `README.md`.

`backend/app.js` exports the Express app, while `server.js` starts a local HTTP
listener. Vercel imports the app through `index.js` as a serverless function.
The database helper reuses a connected Mongoose connection and requires a
configured hosted `DB_URI` on Vercel. Cloudinary stores product, avatar, and
review images. SMTP settings are used by Nodemailer.

Never put backend secrets in frontend `VITE_` variables. Vite-prefixed
variables are delivered to the browser. Store `DB_URI`, JWT secret, Firebase
service credentials, Cloudinary secret, and SMTP password in backend hosting
environment settings.

## 15. Likely defense questions

### “Why do you store product images in Cloudinary instead of MongoDB?”

MongoDB stores structured product data and image references; Cloudinary stores
and serves the binary images. This keeps database documents smaller and gives
the app image delivery/transform features.

### “How do you stop a user from reviewing an item they did not buy?”

The backend checks that the order belongs to the current authenticated user,
is Completed, and contains the requested product. The frontend check only
controls the UI; server-side validation is the actual enforcement.

### “Can someone become an admin by changing frontend state?”

No. Admin routes call the server's JWT authentication and role middleware. UI
visibility is not the security boundary.

### “How is the order total protected from browser tampering?”

The browser submits product IDs and quantities. The backend reloads prices and
stock from MongoDB and calculates totals itself; it does not trust a client
subtotal/total.

### “How does infinite scroll know when to load more?”

An `IntersectionObserver` watches a sentinel. When the sentinel is close to
the viewport, the next API page is requested and appended.

### “What happens when SMTP fails after an order is saved?”

The order remains saved. Email failure is logged and a warning is returned so
the frontend can distinguish successful order creation from failed email
delivery.

### “Is the payment actually processed?”

No payment gateway is integrated in the current code. COD/GCash is a recorded
method selection. A real GCash payment would require a payment provider,
server-side verification, and a verified payment state.

### “Does the code use the `bad-words` package?”

Yes. `backend/utils/filterBadWords.js` imports `Filter` from `bad-words`,
creates a filter instance, adds the project's custom English/Filipino terms
with `addWords()`, and calls `.clean()` before saving a review. Separate custom
phrase patterns cover multi-word expressions.

### “What should you test before presenting?”

Use a real test environment and verify:

1. Admin can create, edit, upload multiple images, delete one, and bulk-delete
   products; check Cloudinary cleanup.
2. Genre, artist, format, price, rating, review count, and search filters can
   be combined and return only matching products.
3. Only a customer with a completed order can write/update a review; check
   ratings and review counts after changes/deletion.
4. A customer can place an order; server totals and stock are correct.
5. Admin status changes follow allowed transitions, stock is not deducted
   twice, and the customer receives the email plus readable PDF.
6. Google and Facebook sign-in both work on the deployed authorized domain.
7. Sales chart date boundaries and completed-order selection match the
   intended reporting definition.

## 16. Defense summary

The key design idea is separation of responsibility: React renders the
experience, Redux/context share client state, Express routes requests, the
middleware handles identity/roles, controllers enforce business rules,
Mongoose models define persisted data, and external services handle images,
email, and identity providers.

When presenting a feature, explain both the user flow and the backend rule that
makes it reliable. Be transparent about configuration-dependent live tests,
the lack of a real payment gateway, the limits of blocklist-based profanity
filtering, and the sales-date definition.

## 17. Annotated code walkthrough

The snippets below show key lines from the implementation; surrounding code is
sometimes omitted for readability. Line numbers refer to the current source
files. If code changes, use the function name to find the updated location.

### A. Express app and route mounting

**File:** `backend/app.js`, around lines 20–56

```js
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res, next) => {
    await connectDatabase();
    next();
});

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
```

- `cors()` allows the browser frontend to call the API from its origin.
- `express.json()` parses JSON request bodies before controllers read `req.body`.
- The async middleware waits for MongoDB before continuing to a database route.
- The `/api/v1` prefix groups API routes under one versioned base path. For
  example, the product router's `/products` endpoint becomes `/api/v1/products`.
- The root health route is above the database middleware; `/api/v1` is below it
  and serves as a database-connected health check.

### B. Route → authorization → controller

**Files:** `backend/routes/product.js:30,36,39` and
`backend/middleware/auth.js:4–43`

```js
router.post(
    '/admin/product/new',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    upload.array('images', 10),
    newProduct
);
```

Read this route from left to right:

1. `POST` creates a resource.
2. `isAuthenticatedUser` verifies the Recordia JWT and loads the user.
3. `authorizeRoles('admin')` rejects non-admin users.
4. Multer accepts up to 10 uploaded files under the `images` field.
5. `newProduct` performs the database/image work and sends the response.

The route is the wiring; the middleware is the access control; the controller
is the feature's business logic. This separation is a useful pattern to explain
in a defense.

### C. Product form validation and multiple uploads

**File:** `frontend/src/pages/admin/ProductForm.jsx:22–38, 185–193**

```js
const schema = Yup.object({
  album_title: Yup.string().trim().required('Album title is required'),
  artist: Yup.string().when('merch_type', {
    is: 'Vinyl',
    then: (field) => field.required('Artist is required'),
    otherwise: (field) => field.notRequired(),
  }),
  merch_type: Yup.string().oneOf(MERCH_TYPES).required('Merchandise type is required'),
  price: Yup.number().typeError('Price must be a number').min(0, 'Price cannot be negative').required('Price is required'),
  description: Yup.string().trim().required('Description is required'),
  stocks: Yup.number().typeError('Stocks must be a number').integer('Stocks must be a whole number').min(0, 'Stocks cannot be negative').required('Stocks are required'),
});
```

The actual schema also validates genre. `.when()` makes artist and genre
conditional: required for vinyl, optional for non-vinyl merchandise.
The form connects the schema with Formik using `validationSchema={schema}`.

The file input uses `multiple`, reads selected images, creates preview data, and
puts the image list in Formik state. On submit, the API sends those image
sources to the protected route. The backend's Cloudinary helper returns
`public_id`/URL references for storage in MongoDB.

**Why both Formik/Yup and server checks?** Formik/Yup gives immediate, helpful
feedback in the browser. The backend still needs validation because a caller
can bypass the UI and send an API request directly.

### D. Bulk delete

**Frontend:** `frontend/src/pages/admin/Products.jsx:59–72, 136–145`  
**Backend:** `backend/controllers/product.js:349–380`

```js
const deleteSelected = async () => {
  const selectedIds = Array.from(selection.ids);
  await api.delete('/admin/products/bulk', {
    data: { ids: selectedIds },
  });
};
```

The grid's `checkboxSelection` builds the selection. The frontend converts its
set of IDs into an array, and sends the IDs in a DELETE request body. The
backend rejects an empty or invalid selection, confirms every ID exists,
deletes associated Cloudinary images and reviews, then deletes the product
documents. The backend check is important: the UI selection is not trusted as
authorization or validation.

### E. Combining product filters

**Frontend:** `frontend/src/pages/Home.jsx:29–52,61–77`  
**Backend:** `backend/utils/apiFeatures.js:25–66` and
`backend/controllers/product.js:107–151`

```js
const params = {
  page,
  limit: LIMIT,
  ...(filters.genre && { genre: filters.genre }),
  ...(filters.artist && { artist: filters.artist }),
  ...(searchParams.get('merch_type')
    && { merch_type: searchParams.get('merch_type') }),
  ...(filters.rating && { 'ratings[eq]': filters.rating }),
  ...(filters.reviewCount && { 'reviews[gte]': filters.reviewCount }),
  ...(filters.price[0] > priceBounds[0]
    && { 'price[gte]': filters.price[0] }),
  ...(filters.price[1] < priceBounds[1]
    && { 'price[lte]': filters.price[1] }),
};

const { data } = await api.get('/products', { params });
```

The conditional object properties omit filters that are not active. The
backend builds a MongoDB filter from the supplied parameters. When genre,
artist, and merchandise are all present, they become separate criteria in the
same query, so a product must match all of them.

Review count/rating need an aggregation because those values are derived from
the Review collection. The backend groups reviews by product, calculates
average rating/count, and intersects the matching product IDs with the other
product criteria.

**Example to say aloud:** “If I select Pop, Arctic Monkeys, and Poster, the
request contains all three fields. The backend applies all three together, so
it returns only products matching that combination.”

### F. Purchase-verified review and upsert

**File:** `backend/controllers/product.js:424–468`

```js
const eligibleOrder = await Order.exists({
    _id: orderId,
    user: req.user._id,
    orderStatus: 'Completed',
    'orderItems.product': productId
});

await Review.findOneAndUpdate(
    { order: orderId, product: product._id },
    {
        $set: { ...update, user: req.user._id },
        $setOnInsert: { order: orderId, product: product._id }
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
);
```

`Order.exists()` checks all required facts in the database: the order ID, its
owner, its completed status, and that it contains the product. If any part
doesn't match, the request is rejected. This is the security/business rule;
hiding the review form in React alone would not be enough.

`findOneAndUpdate()` with `upsert: true` means “update the review for this order
and product, or create it if none exists.” This supports editing while avoiding
a second review document for the same order/product pair. The code then
recalculates the product's average and count.

### G. Server-side order totals

**File:** `backend/controllers/order.js:11–108**

```js
const product = productMap.get(String(item.product));
const quantity = Number(item.quantity);

if (product.stocks < quantity) {
    return res.status(400).json({
        message: `Insufficient stock for ${product.album_title}`
    });
}

const itemsPrice = normalizedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
);
const taxPrice = Number((itemsPrice * 0.12).toFixed(2));
const shippingPrice = 0;
const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));
```

The browser sends product IDs and quantities, not trusted prices or totals.
The server reads current product prices and stock from MongoDB, rejects an
invalid quantity or insufficient stock, then calculates totals. The saved order
contains a snapshot of the product name and price at purchase time.

### H. Order status transitions and email/PDF

**File:** `backend/controllers/order.js:192–254`

```js
const allowedTransitions = {
    Pending: ['Processing', 'Cancelled'],
    Processing: ['Shipped'],
    Shipped: ['Completed'],
    Completed: [],
    Cancelled: []
};

if (!allowedTransitions[order.orderStatus].includes(nextStatus)) {
    return res.status(400).json({
        message: `Orders cannot move from ${order.orderStatus} to ${nextStatus}`
    });
}
```

This state-transition table prevents illegal backwards or repeated state
changes. The controller also deducts stock only when moving to Processing and
only if `stockDeducted` is false.

After saving the status, the controller builds the customer email with
`backend/utils/orderEmail.js`, generates a PDF buffer with
`backend/utils/generateReceipt.js`, and sends it through
`backend/utils/sendEmail.js`. Nodemailer attaches the PDF using a filename,
buffer, and `application/pdf` content type. If SMTP fails, the order/status is
still saved and the API returns a warning; the email is not silently treated as
delivered.

### I. Redux slices and persistence

**File:** `frontend/src/store.js:12–62**

```js
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: localStorage.getItem('recordia_token') },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
  },
});

const store = configureStore({
  reducer: { auth: authSlice.reducer, cart: cartSlice.reducer },
});
```

`createSlice()` groups a state shape and the actions that modify it.
`configureStore()` combines the slices into one store. React components read
state with `useSelector` and change it with `useDispatch`. The app is wrapped in
Redux's `Provider` in `frontend/src/main.jsx`. Cart data is separately mirrored
to local storage by `frontend/src/context/CartContext.jsx` so it can survive a
refresh.

### J. Firebase sign-in and backend token verification

**Browser:** `frontend/src/firebase.js:12–39`  
**Backend:** `backend/controllers/auth.js:108–145`

```js
export const signInWithFirebaseGoogle = () =>
  signInWithPopup(firebaseAuth, googleProvider);

export const signInWithFirebaseFacebook = () =>
  signInWithPopup(firebaseAuth, facebookProvider);
```

After Firebase signs the user in, the frontend obtains a Firebase ID token and
sends it to `/firebase-login`. The backend verifies the ID token with Firebase
Admin, finds/creates the local Recordia user, then issues a Recordia JWT. The
browser uses that Recordia JWT for later API requests.

**Key distinction:** Firebase proves the external identity; the Recordia JWT
is what this API's own middleware uses to authenticate subsequent requests.

### K. Infinite scroll

**File:** `frontend/src/pages/Home.jsx:135–146`

```js
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting && !requestPending.current) {
    requestPending.current = true;
    setPagination({ filterKey, page: page + 1 });
  }
}, { rootMargin: '240px' });
observer.observe(sentinel);
```

The browser watches a sentinel near the end of the product list. When it
approaches the viewport, the page number increments and the product-loading
effect requests the next API page. `requestPending` prevents overlapping page
requests; `rootMargin` starts loading slightly before the user reaches the end.
The observer is disconnected when its effect is cleaned up.

### L. Sales aggregation

**Frontend chart:** `frontend/src/pages/admin/Dashboard.jsx:90–109`  
**Backend aggregation:** `backend/controllers/order.js:377–445`

The UI selects line or bar mode and supplies a year or date range. The API
matches only `Completed` orders in the selected interval, groups by month or
day, sums `totalPrice`, and counts orders. Recharts then renders the returned
`sales` and `orders` series.

**Be precise in the defense:** The current date filter uses order `createdAt`
for completed orders. It does not group on a dedicated completion timestamp.
