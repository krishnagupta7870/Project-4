import Product from '../../models/Product.js';
import ProductView from '../../models/ProductView.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { recordLikeEvent } from '../../services/UserActivityService.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          isBoosted: {
            $cond: {
              if: { $gt: ["$boostedUntil", new Date()] },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          isBoosted: -1,
          likesCount: -1,
          views: -1,
          createdAt: -1
        }
      }
    ]);

    await Product.populate(products, { path: 'seller', select: 'name email' });
    res.json(products);
  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch similar products
// @route   GET /api/products/:id/similar
// @access  Public
export const getSimilarProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find products with same category, excluding current product
    const similarProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active' // Only show active products
    })
      .limit(4)
      .populate('seller', 'name email');

    res.json(similarProducts);
  } catch (error) {
    console.error("Error fetching similar products:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const boostProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 6, amount = 0, provider = 'manual' } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const h = Number(hours);
    const amt = Number(amount);
    if (isNaN(h) || h <= 0) return res.status(400).json({ message: 'Invalid hours' });
    if (isNaN(amt) || amt < 0) return res.status(400).json({ message: 'Invalid amount' });
    const now = Date.now();
    const base = product.boostedUntil && product.boostedUntil > now ? product.boostedUntil.getTime() : now;
    product.boostedUntil = new Date(base + h * 60 * 60 * 1000);
    product.boostAmount = amt;
    product.paymentInfo = { ...(product.paymentInfo || {}), provider, status: 'paid', amount: amt };
    const updated = await product.save();
    res.json({ message: 'Boost applied', product: updated });
  } catch (error) {
    console.error('boostProduct error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getBoostedProducts = async (req, res) => {
  try {
    const now = new Date();
    const products = await Product.find({
      status: 'active',
      boostedUntil: { $gt: now }
    })
      .sort({ boostedUntil: -1 })
      .limit(20)
      .populate('seller', 'name email');
    res.json(products);
  } catch (error) {
    console.error('getBoostedProducts error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller/Admin
export const createProduct = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const {
      name,
      price,
      description,
      brand,
      category,
      subCategory,
      thirdCategory,
      stock,
      location,
      coordinates,
      hidePreciseLocation,
      specifications,
      images,
      payment,
    } = req.body;

    // ✅ Strict required validation
    if (!name || !category || price === undefined) {
      return res.status(400).json({
        message: "Name, price, and category are required",
      });
    }

    const safePrice = Number(price);
    if (isNaN(safePrice)) {
      return res.status(400).json({ message: "Invalid price value" });
    }

    const safeStock = Number(stock);
    const finalStock = !isNaN(safeStock) ? safeStock : 0;

    const uploadedImages = [];
    if (req.file && req.file.path) {
      uploadedImages.push(req.file.path);
    }
    if (Array.isArray(images)) {
      uploadedImages.push(...images);
    } else if (typeof images === "string" && images) {
      uploadedImages.push(images);
    }

    const product = new Product({
      name: name.trim(),
      price: safePrice,
      description: description || "",
      brand: brand || "",
      category,
      subCategory: subCategory || "",
      thirdCategory: thirdCategory || "",
      location: location || "",
      coordinates: coordinates && coordinates.latitude && coordinates.longitude ? {
        type: "Point",
        coordinates: [coordinates.longitude, coordinates.latitude],
        address: coordinates.address || "",
        area: coordinates.area || ""
      } : undefined,
      hidePreciseLocation: hidePreciseLocation || false,
      images: uploadedImages,
      seller: req.user._id,
      seller: req.user._id,
      stock: finalStock,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      status: 'active',
      specifications:
        specifications && typeof specifications === "object"
          ? specifications
          : {},
      paymentInfo: payment,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("❌ Create Product Error:", error);

    if (error.name === "ValidationError") {
      const fields = Object.keys(error.errors);
      return res.status(400).json({
        message: "Validation failed",
        fields,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller/Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const {
      name, price, description, image, brand, category, subCategory, thirdCategory,
      location, coordinates, hidePreciseLocation, specifications,
      status, soldPrice, soldAt, reasonOnHold, buyerInfo,
      stock, sales, expiryDate, viewsCount, chatCount
    } = req.body;

    const product = await Product.findById(id);

    if (product) {
      // Check ownership if not admin
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this product' });
      }

      product.name = name || product.name;
      if (price !== undefined) {
        const safePrice = Number(price);
        if (isNaN(safePrice)) return res.status(400).json({ message: 'Invalid price' });
        product.price = safePrice;
      }
      product.description = description || product.description;
      product.image = image || product.image;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.subCategory = subCategory || product.subCategory;
      product.thirdCategory = thirdCategory || product.thirdCategory;
      product.location = location || product.location;

      // Optional meta fields
      if (typeof viewsCount === "number") product.viewsCount = viewsCount;
      if (typeof chatCount === "number") product.chatCount = chatCount;
      if (expiryDate) product.expiryDate = new Date(expiryDate);

      if (status) {
        const allowed = ["active", "on_hold", "sold", "expired"];
        if (!allowed.includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        product.status = status;
      }
      if (soldPrice !== undefined) {
        const safeSoldPrice = Number(soldPrice);
        if (isNaN(safeSoldPrice)) return res.status(400).json({ message: 'Invalid soldPrice' });
        product.soldPrice = safeSoldPrice;
      }
      if (soldAt) product.soldAt = soldAt;
      if (reasonOnHold) product.reasonOnHold = reasonOnHold;
      if (buyerInfo) product.buyerInfo = buyerInfo;

      if (specifications) {
        product.specifications = specifications;
      }

      // Stock updates
      if (stock !== undefined) {
        const safe = Number(stock);
        if (isNaN(safe) || safe < 0) return res.status(400).json({ message: 'Invalid stock' });
        product.stock = safe;
      }

      if (sales !== undefined) {
        const safeSales = Number(sales);
        if (!isNaN(safeSales)) product.sales = safeSales;
      }

      const updatedProduct = await product.save();

      // Trigger trust score recalculation if sales or stock changed
      if (status === 'sold' || sales !== undefined || stock !== undefined) {
        // Import dynamically to avoid circular dependency
        import('../../services/TrustScoreService.js').then(({ calculateTrustScore }) => {
          calculateTrustScore(product.seller).catch(err =>
            console.error('Failed to update trust score:', err)
          );
        });
      }

      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Seller/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Check ownership if not admin
      if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to delete this product' });
      }

      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch products within radius
// @route   GET /api/products/nearby
// @access  Public
export const getProductsNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 1 } = req.query; // radius in km, default 1km

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const radiusInMeters = radius * 1000; // Convert km to meters

    const products = await Product.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'active'
    }).populate('seller', 'name email').select('-coordinates'); // Hide exact coordinates from buyers

    res.json(products);
  } catch (error) {
    console.error('Error fetching nearby products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch products within 1km radius
// @route   GET /api/products/nearby/1km
// @access  Public
export const getProductsWithin1km = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const radiusInMeters = 1000; // 1km in meters

    const products = await Product.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'active'
    }).populate('seller', 'name email').select('-coordinates');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products within 1km:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch products within 2km radius
// @route   GET /api/products/nearby/2km
// @access  Public
export const getProductsWithin2km = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const radiusInMeters = 2000; // 2km in meters

    const products = await Product.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      },
      status: 'active'
    }).populate('seller', 'name email').select('-coordinates');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products within 2km:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Increment product view count
// @route   PUT /api/products/:id/view
// @access  Public (with optional auth)
export const incrementProductView = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', '_id');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Filter 1: Don't count if user is the seller
    if (req.user && product.seller._id.toString() === req.user._id.toString()) {
      return res.json({ views: product.views, message: 'Seller view not counted' });
    }

    // Filter 2: Don't count admin views
    if (req.user && req.user.role === 'admin') {
      return res.json({ views: product.views, message: 'Admin view not counted' });
    }

    // Filter 3: Bot detection via User-Agent
    const userAgent = req.headers['user-agent'] || '';
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /crawling/i,
      /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
      /baiduspider/i, /yandexbot/i, /sogou/i, /exabot/i,
      /facebookexternalhit/i, /facebot/i, /twitterbot/i,
      /linkedinbot/i, /whatsapp/i, /telegrambot/i,
      /slackbot/i, /discordbot/i,
      /prerender/i, /phantomjs/i, /headless/i,
      /semrush/i, /ahrefs/i, /majestic/i, /mj12bot/i,
      /archive\.org_bot/i, /ia_archiver/i
    ];

    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    if (isBot) {
      return res.json({ views: product.views, message: 'Bot view not counted' });
    }

    // Get IP address (handle proxies)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim()
      || req.headers['x-real-ip']
      || req.connection.remoteAddress
      || req.socket.remoteAddress
      || 'unknown';

    // Filter 4: Check for duplicate views within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    let existingView;
    if (req.user) {
      // For logged-in users: check by user ID + product
      existingView = await ProductView.findOne({
        product: req.params.id,
        user: req.user._id,
        timestamp: { $gte: oneHourAgo }
      });
    } else {
      // For guests: check by IP + User-Agent + product
      existingView = await ProductView.findOne({
        product: req.params.id,
        ipAddress: ipAddress,
        userAgent: userAgent,
        timestamp: { $gte: oneHourAgo }
      });
    }

    if (existingView) {
      return res.json({ views: product.views, message: 'Duplicate view within 1 hour not counted' });
    }

    // All filters passed - count the view!

    // Create view record
    await ProductView.create({
      product: req.params.id,
      user: req.user?._id || null,
      ipAddress: ipAddress,
      userAgent: userAgent,
      timestamp: new Date()
    });

    // Increment product view count
    product.views = (product.views || 0) + 1;
    await product.save();

    res.json({ views: product.views, counted: true });
  } catch (error) {
    console.error('Error incrementing product view:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle like/unlike product
// @route   PUT /api/products/:id/like
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Please login to save products' });
    }

    const product = await Product.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = req.user._id;
    const likeIndex = (product.likes || []).indexOf(userId);
    const wishlistIndex = (user.wishlist || []).findIndex(id => id.toString() === product._id.toString());

    let liked = false;

    if (likeIndex > -1) {
      product.likes.splice(likeIndex, 1);
      if (wishlistIndex > -1) user.wishlist.splice(wishlistIndex, 1);
      liked = false;
    } else {
      if (!product.likes) product.likes = [];
      product.likes.push(userId);
      if (wishlistIndex === -1) user.wishlist.push(product._id);
      liked = true;
    }

    await Promise.all([product.save(), user.save()]);
    recordLikeEvent(userId, product._id, liked).catch(() => { });
    res.json({ liked, likes: product.likes.length });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    List products by seller
// @route   GET /api/products/by-seller/:sellerId
// @access  Public
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required' });
    const products = await Product.find({ seller: sellerId })
      .select('name price images status category seller')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(products);
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
