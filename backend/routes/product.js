const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const {
    newProduct,
    getSingleProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    updateProductStock,
    getAdminProducts,
    createProductReview,
    getProductReviews,
    deleteReview,
    deleteOwnReview,
    canReview,
    getAllReviews,



} = require('../controllers/product');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth')


router.post('/admin/product/new', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), newProduct);
router.get('/product/:id', getSingleProduct)
router.get('/products', getProducts)
router.put('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateProduct);
router.put('/admin/product/:id/stock', isAuthenticatedUser, authorizeRoles('admin'), updateProductStock);
router.delete('/admin/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.delete('/admin/products/bulk', isAuthenticatedUser, authorizeRoles('admin'), bulkDeleteProducts);
router.get('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts)
router.put('/review', isAuthenticatedUser, upload.single('image'), createProductReview);
router.get('/reviews', getProductReviews)
router.get('/review/can-review', isAuthenticatedUser, canReview)
router.delete('/review/me', isAuthenticatedUser, deleteOwnReview)
router.delete('/reviews', isAuthenticatedUser, authorizeRoles('admin'), deleteReview)
router.get('/admin/reviews', isAuthenticatedUser, authorizeRoles('admin'), getAllReviews)
module.exports = router