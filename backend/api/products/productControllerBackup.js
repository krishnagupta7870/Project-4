import Product from '../../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate('seller', 'name email');
    res.json(products);
  } catch (error) {
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
      countInStock,
      location,
      coordinates,
      hidePreciseLocation,
      specifications,
      images,
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

    const safeStock = Number(countInStock);
    const finalStock = !isNaN(safeStock) ? safeStock : 0;

    const product = new Product({
      name: name.trim(),
      price: safePrice,
      description: description || "",
      brand: brand || "",
      category,
      subCategory: subCategory || "",
      thirdCategory: thirdCategory || "",
      location: location || "",
      images: Array.isArray(images) ? images : [],
      seller: req.user._id,
      stock: finalStock,
      countInStock: finalStock,

      // ✅ AI-safe
      specifications:
        specifications && typeof specifications === "object"
          ? specifications
          : {},
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
    const { name, price, description, image, brand, category, subCategory, thirdCategory, countInStock, location, specifications } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      // Check ownership if not admin
      if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this product' });
      }

      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.brand = brand || product.brand;
      product.category = category || product.category;
      product.subCategory = subCategory || product.subCategory;
      product.thirdCategory = thirdCategory || product.thirdCategory;
      product.location = location || product.location;

      if (specifications) {
        product.specifications = specifications;
      }

      if (countInStock !== undefined) {
        product.countInStock = countInStock;
        product.stock = countInStock;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
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
      isActive: true
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
      isActive: true
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
      isActive: true
    }).populate('seller', 'name email').select('-coordinates');

    res.json(products);
  } catch (error) {
    console.error('Error fetching products within 2km:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
