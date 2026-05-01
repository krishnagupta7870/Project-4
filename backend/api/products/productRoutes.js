import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSimilarProducts,
  getProductsNearby,
  getProductsWithin1km,
  getProductsWithin2km,
  incrementProductView,
  toggleLike,
  getProductsBySeller,
  boostProduct,
  getBoostedProducts,
} from './productController.js';
import { protect, adminOnly, sellerOnly, optionalAuth } from '../../middleware/auth.js';
import upload, { conditionalUploadSingle } from "../../middleware/upload.js";

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, conditionalUploadSingle("image"), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

// Similar products
router.get('/:id/similar', getSimilarProducts);
router.post('/:id/boost', protect, sellerOnly, boostProduct);
router.get('/boosted/list', getBoostedProducts);

// View tracking (public, but checks if user is seller using optional auth)
router.put('/:id/view', optionalAuth, incrementProductView);

// Like/Unlike product (requires login)
router.put('/:id/like', protect, toggleLike);

// Location-based search routes
router.get('/nearby', getProductsNearby);
router.get('/nearby/1km', getProductsWithin1km);
router.get('/nearby/2km', getProductsWithin2km);
router.get('/by-seller/:sellerId', getProductsBySeller);

export default router;
