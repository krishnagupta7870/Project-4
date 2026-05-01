import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;

    // Update lastActive timestamp (fire and forget for performance)
    User.findByIdAndUpdate(user._id, { lastActive: Date.now() }).catch(console.error);

    next();
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

export const sellerOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Seller access required' });
  }
};

// Optional authentication - populates req.user if token exists, but doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    if (!header || !header.startsWith('Bearer ')) {
      // No token present, continue without req.user
      return next();
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    // Invalid token, but continue anyway (optional auth)
    next();
  }
};

export default protect;
