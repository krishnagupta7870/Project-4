import axios from "axios";
import mongoose from "mongoose";
import Product from "../../models/Product.js";
import ProductView from "../../models/ProductView.js";
import { getCollaborativeRecommendations } from "../../services/UserActivityService.js";
import UserActivityProfile from "../../models/UserActivityProfile.js";

const RECOMMENDER_URL = process.env.RECOMMENDER_SERVICE_URL || "http://localhost:5002";

// ── Haversine distance formula ───────────────────────────────────────────────
// Returns distance in kilometres between two (lat, lng) points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Rule-based query builder ─────────────────────────────────────────────────
function buildRuleQuery(baseProduct) {
  const query = {
    _id: { $ne: baseProduct._id },
    status: "active",
    category: baseProduct.category,
  };
  return query;
}

// ── Candidate scorer ─────────────────────────────────────────────────────────
// Returns a numeric score representing how "rule-matched" a candidate is
// to the base product. Higher = more relevant.
function scoreCandidate(baseProduct, candidate) {
  let score = 0;

  // ── Category match (+3 same category already guaranteed by query, +2 sub) ──
  const baseSub = String(baseProduct.subCategory || "").toLowerCase();
  const candSub = String(candidate.subCategory || "").toLowerCase();
  if (baseSub && candSub && baseSub === candSub) score += 2;

  // ── Sub-sub-category ──────────────────────────────────────────────────────
  const baseThird = String(baseProduct.thirdCategory || "").toLowerCase();
  const candThird = String(candidate.thirdCategory || "").toLowerCase();
  if (baseThird && candThird && baseThird === candThird) score += 1;

  // ── Brand match ────────────────────────────────────────────────────────────
  const baseBrand = String(baseProduct.brand || "").toLowerCase();
  const candBrand = String(candidate.brand || "").toLowerCase();
  if (baseBrand && candBrand && baseBrand === candBrand) score += 2;

  // ── Condition match (from specifications.condition) ───────────────────────
  // e.g. "like new", "used", "refurbished", "for parts"
  const baseCond = String(
    (baseProduct.specifications && baseProduct.specifications.condition) ||
    baseProduct.condition ||
    ""
  )
    .toLowerCase()
    .trim();
  const candCond = String(
    (candidate.specifications && candidate.specifications.condition) ||
    candidate.condition ||
    ""
  )
    .toLowerCase()
    .trim();
  if (baseCond && candCond && baseCond === candCond) score += 2;

  // ── Geospatial proximity ───────────────────────────────────────────────────
  // GeoJSON stores as [longitude, latitude]
  const baseCoords =
    baseProduct.coordinates && Array.isArray(baseProduct.coordinates.coordinates)
      ? baseProduct.coordinates.coordinates
      : null;
  const candCoords =
    candidate.coordinates && Array.isArray(candidate.coordinates.coordinates)
      ? candidate.coordinates.coordinates
      : null;

  if (baseCoords && candCoords && baseCoords.length >= 2 && candCoords.length >= 2) {
    // GeoJSON order: [lng, lat]
    const distKm = haversineKm(
      baseCoords[1], baseCoords[0],
      candCoords[1], candCoords[0]
    );
    if (distKm <= 5) score += 5; // same neighbourhood
    else if (distKm <= 15) score += 4; // same city area
    else if (distKm <= 50) score += 3; // same district
    else if (distKm <= 150) score += 2; // same region
    else if (distKm <= 500) score += 1; // same country zone
  } else {
    // Fallback: city-string match when no coordinates available
    const baseLoc = String(baseProduct.location || "").toLowerCase().trim();
    const candLoc = String(candidate.location || "").toLowerCase().trim();
    if (baseLoc && candLoc && baseLoc === candLoc) score += 2;
  }

  // ── Price proximity ────────────────────────────────────────────────────────
  const basePrice = typeof baseProduct.price === "number" ? baseProduct.price : null;
  const candPrice = typeof candidate.price === "number" ? candidate.price : null;
  if (basePrice && candPrice && basePrice > 0) {
    const diffRatio = Math.abs(candPrice - basePrice) / basePrice;
    if (diffRatio < 0.10) score += 3;
    else if (diffRatio < 0.30) score += 2;
    else if (diffRatio < 0.60) score += 1;
  }

  // ── Popularity bonus ───────────────────────────────────────────────────────
  const views = typeof candidate.views === "number" ? candidate.views : 0;
  if (views > 0) {
    score += Math.min(Math.floor(views / 10), 3);
  }

  return score;
}

// ── Build rule-based candidate pool ─────────────────────────────────────────
export async function getRuleBasedCandidates(productId, limit = 50) {
  const baseProduct = await Product.findById(productId).lean();
  if (!baseProduct) {
    return { baseProduct: null, products: [] };
  }

  const query = buildRuleQuery(baseProduct);

  const raw = await Product.find(query)
    .limit(limit * 3)
    .lean();

  const products = raw
    .map((p) => ({
      ...p,
      _score: scoreCandidate(baseProduct, p),
    }))
    .sort((a, b) => b._score - a._score || (b.views || 0) - (a.views || 0))
    .slice(0, limit);

  return { baseProduct, products };
}

// ── Cold-start: popular + trusted products ───────────────────────────────────
async function getColdStartRecommendations(limit) {
  const base = await Product.find({ status: "active" })
    .populate({ path: "seller", select: "trustScore" })
    .sort({ boostedUntil: -1, createdAt: -1 })
    .lean();

  if (!base.length) return [];

  const scored = base.map((p) => {
    const views = typeof p.views === "number" ? p.views : 0;
    const likes = Array.isArray(p.likes) ? p.likes.length : 0;
    const trust =
      p.seller && p.seller.trustScore != null ? Number(p.seller.trustScore) : 0;
    const score = 0.5 * views + 0.3 * likes + 0.2 * trust;
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Add slight randomization to top candidates to avoid "static" feel
  const topPool = scored.slice(0, limit * 2);
  for (let i = topPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topPool[i], topPool[j]] = [topPool[j], topPool[i]];
  }

  return topPool.slice(0, limit).map((x) => ({ ...x.product, _score: x.score }));
}

// ── Refined Guest Recommendations (Logged-out) ──────────────────────────────
export async function getGuestRecommendations(limit = 10, lat = null, lng = null) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Pool: Active products from last 30 days or simply top active ones
  const candidates = await Product.find({ status: "active" })
    .populate({ path: "seller", select: "trustScore" })
    .sort({ boostedUntil: -1, createdAt: -1 })
    .limit(100)
    .lean();

  if (!candidates.length) return [];

  // Find max values for normalization
  let maxViews = 1;
  let maxLikes = 1;
  candidates.forEach(p => {
    if (p.views > maxViews) maxViews = p.views;
    const likes = Array.isArray(p.likes) ? p.likes.length : 0;
    if (likes > maxLikes) maxLikes = likes;
  });

  const scored = candidates.map(p => {
    const views = typeof p.views === "number" ? p.views : 0;
    const likes = Array.isArray(p.likes) ? p.likes.length : 0;
    const trust = p.seller && p.seller.trustScore != null ? Number(p.seller.trustScore) : 0;

    // Base scoring (Normalized)
    let score = (0.3 * (views / maxViews)) + (0.4 * (likes / maxLikes)) + (0.3 * (trust / 100));

    // Recency Boost (Last 7 days gets +2 units)
    if (p.createdAt >= since) {
      score += 2;
    }

    // Location Priority
    if (lat !== null && lng !== null && p.coordinates?.coordinates?.length >= 2) {
      const distKm = haversineKm(
        lat, lng,
        p.coordinates.coordinates[1], p.coordinates.coordinates[0]
      );
      if (distKm <= 10) score += 10;
      else if (distKm <= 50) score += 5;
      else if (distKm <= 150) score += 2;
    }

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Slight randomization for top candidates
  const topPool = scored.slice(0, limit * 2);
  for (let i = topPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topPool[i], topPool[j]] = [topPool[j], topPool[i]];
  }

  return topPool.slice(0, limit).map(x => ({ ...x.product, _score: x.score }));
}

// ── Profile-based: search history + category/brand/seller stats ──────────────
async function getProfileBasedRecommendations(userId, limit) {
  const profile = await UserActivityProfile.findOne({ user: userId }).lean();
  if (!profile) return [];

  const now = Date.now();
  const history = Array.isArray(profile.searchHistory)
    ? profile.searchHistory.slice().reverse()
    : [];

  // Check if user searched something within last 30 min
  let recentSearch = null;
  for (const item of history) {
    if (!item || !item.timestamp) continue;
    const ts = new Date(item.timestamp).getTime();
    if (!Number.isFinite(ts)) continue;
    if (now - ts <= 30 * 60 * 1000) {
      recentSearch = item;
      break;
    }
  }

  if (recentSearch && recentSearch.filters) {
    const f = recentSearch.filters || {};
    const query = { status: "active" };
    const and = [];

    const cat = typeof f.category === "string" ? f.category.trim() : null;
    const brand = typeof f.brand === "string" ? f.brand.trim() : null;
    const minPrice = typeof f.minPrice === "number" ? f.minPrice : null;
    const maxPrice = typeof f.maxPrice === "number" ? f.maxPrice : null;

    if (cat) {
      const catRegex = new RegExp(cat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      and.push({
        $or: [
          { category: catRegex },
          { subCategory: catRegex },
          { thirdCategory: catRegex },
        ],
      });
    }
    if (brand) {
      const brandRegex = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      and.push({ brand: brandRegex });
    }
    if (minPrice !== null || maxPrice !== null) {
      const priceFilter = {};
      if (minPrice !== null) priceFilter.$gte = minPrice;
      if (maxPrice !== null) priceFilter.$lte = maxPrice;
      and.push({ price: priceFilter });
    }

    if (and.length) {
      query.$and = and;
      const searchProducts = await Product.find(query)
        .sort({ boostedUntil: -1, views: -1, createdAt: -1 })
        .limit(limit * 2)
        .lean();
      if (searchProducts.length) return searchProducts.slice(0, limit);
    }
  }

  // Fall back to top category/brand/seller affinity
  const topCategories = (Array.isArray(profile.categoryStats) ? profile.categoryStats : [])
    .filter((c) => c && c.category)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)
    .map((c) => c.category);

  const topBrands = (Array.isArray(profile.brandStats) ? profile.brandStats : [])
    .filter((b) => b && b.brand)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)
    .map((b) => b.brand);

  const topSellers = (Array.isArray(profile.sellerStats) ? profile.sellerStats : [])
    .filter((s) => s && s.seller)
    .sort((a, b) => (b.interactions || 0) - (a.interactions || 0))
    .slice(0, 3)
    .map((s) => s.seller);

  const query = { status: "active" };
  const or = [];
  if (topCategories.length) or.push({ category: { $in: topCategories } });
  if (topBrands.length) or.push({ brand: { $in: topBrands } });
  if (topSellers.length) or.push({ seller: { $in: topSellers } });
  if (!or.length) return [];
  query.$or = or;

  const products = await Product.find(query)
    .sort({ boostedUntil: -1, views: -1, createdAt: -1 })
    .limit(limit * 2)
    .lean();

  return products.slice(0, limit);
}

// ── Rank candidates using Flask TF-IDF cosine similarity ────────────────────
async function rankByContent(baseProduct, candidates) {
  if (!baseProduct || !candidates.length) return candidates;

  try {
    const response = await axios.post(
      `${RECOMMENDER_URL}/content_recommend`,
      {
        base: {
          id: baseProduct._id.toString(),
          title: baseProduct.name,
          description: baseProduct.description,
        },
        candidates: candidates.map((p) => ({
          id: p._id.toString(),
          title: p.name,
          description: p.description,
        })),
      },
      { timeout: 3000 }
    );

    const data = response.data || {};
    const ranked = Array.isArray(data.ranked) ? data.ranked : [];
    if (!ranked.length) return candidates;

    const contentMap = new Map(
      ranked.map((item) => [
        String(item.id),
        typeof item.score === "number" ? item.score : 0,
      ])
    );

    // Normalise rule scores to [0, 1]
    let maxRule = 0;
    for (const c of candidates) {
      const rs = typeof c._score === "number" ? c._score : 0;
      if (rs > maxRule) maxRule = rs;
    }

    // Hybrid score: 60% rule-based + 40% content-based
    const scored = candidates.map((c) => {
      const id = c._id.toString();
      const ruleScore = typeof c._score === "number" ? c._score : 0;
      const ruleNorm = maxRule > 0 ? ruleScore / maxRule : 0;
      const contentScore = contentMap.get(id) || 0;
      const finalScore = 0.6 * ruleNorm + 0.4 * contentScore;
      return { product: c, score: finalScore };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((x) => x.product);
  } catch {
    // Flask service unavailable — gracefully fall back to rule-based order
    return candidates;
  }
}

// ── PUBLIC: Similar products for a product page ──────────────────────────────
export async function getHybridSimilarProducts(productId, limit = 10) {
  const { baseProduct, products } = await getRuleBasedCandidates(
    productId,
    limit * 5 // fetch wider pool for content ranking
  );

  if (!baseProduct || !products.length) {
    return Product.find({
      _id: { $ne: productId },
      status: "active",
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  const ranked = await rankByContent(baseProduct, products);
  return ranked.slice(0, limit);
}

// ── PUBLIC: Personalised recommendations for a user ──────────────────────────
export async function getHybridRecommendationsForUser(userId, limit = 10) {
  if (!mongoose.isValidObjectId(userId)) return [];

  // Fetch user's recent views
  const views = await ProductView.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  if (!views.length) {
    // Cold-start: try profile first, then collaborative, then popular
    const profileRecs = await getProfileBasedRecommendations(userId, limit);
    const cfOnly = await getCollaborativeRecommendations(userId, limit);

    const merged = [];
    const seenIds = new Set();

    for (const p of profileRecs) {
      const id = String(p._id);
      if (seenIds.has(id)) continue;
      merged.push(p);
      seenIds.add(id);
      if (merged.length >= limit) break;
    }
    for (const p of cfOnly) {
      if (merged.length >= limit) break;
      const id = String(p._id);
      if (seenIds.has(id)) continue;
      merged.push(p);
      seenIds.add(id);
    }

    if (merged.length) return merged.slice(0, limit);
    return getGuestRecommendations(limit);
  }

  // Seeding: Identify top unique categories looking at "RIGHT NOW"
  const profile = await UserActivityProfile.findOne({ user: userId }).select("recentClicks searchHistory").lean();

  // 1. Instant Clicks
  const clickCats = (profile?.recentClicks || [])
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(c => c.category)
    .filter(Boolean);

  // 2. Recent Searches (last 30 minutes)
  const now = Date.now();
  const searchCats = (profile?.searchHistory || [])
    .filter(s => s && s.timestamp && (now - new Date(s.timestamp).getTime()) < 30 * 60 * 1000)
    .map(s => s.filters?.category)
    .filter(Boolean)
    .reverse(); // most recent search first

  // 3. Formal Views
  const viewsWithCat = await ProductView.find({ user: userId })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate("product", "name description category")
    .lean();

  const viewCats = viewsWithCat.map((v) => v.product?.category).filter(Boolean);

  // Combine Priority: Clicks > Searches > Views
  console.log(`[RecEngine] Trace for ${userId}:`, {
    clicks: clickCats,
    searches: searchCats,
    views: viewCats
  });

  const recentCategories = [
    ...new Set([...clickCats, ...searchCats, ...viewCats]),
  ].slice(0, 3); // Take top 3 unique categories

  console.log(`[RecEngine] User ${userId} recent categories:`, recentCategories);

  let recs = [];
  const seenIds = new Set();

  if (recentCategories.length > 0) {
    // Fetch candidates for these categories in parallel
    const pools = await Promise.all(
      recentCategories.map(async (cat, index) => {
        // Find a representative product from this category
        // check formal views first
        let seedProduct = viewsWithCat.find(v => v.product?.category === cat)?.product;

        // if not in formal views, check recent clicks (we need to populate product in clicks too if we want full seeding, 
        // but for now we just need any Product ID from that category)
        if (!seedProduct && profile.recentClicks) {
          const clickMatch = profile.recentClicks.find(c => c.category === cat);
          if (clickMatch) {
            seedProduct = { _id: clickMatch.product };
          }
        }

        if (!seedProduct) return [];

        const { products } = await getRuleBasedCandidates(seedProduct._id, limit);

        // 🔥 HOT PRIORITY BOOST:
        // Products in the absolute most recent category get +10.
        // Products in the 2nd most recent get +5.
        const boost = index === 0 ? 10 : 5;
        return products.map(p => ({
          ...p,
          _score: (p._score || 0) + boost
        }));
      })
    );

    // Merge pools
    for (const pool of pools) {
      for (const p of pool) {
        const id = p._id.toString();
        if (!seenIds.has(id)) {
          recs.push(p);
          seenIds.add(id);
        }
      }
    }

    // Rank the merged pool using the most recent product as the primary seed for content similarity
    const primarySeed = viewsWithCat[0].product;
    recs = await rankByContent(primarySeed, recs);
  } else {
    // Fallback if views exist but no category info (edge case)
    const lastView = views[0];
    recs = await getHybridSimilarProducts(lastView.product, limit);
    recs.forEach(p => seenIds.add(p._id.toString()));
  }

  // Blend in collaborative-filtering results
  const cfRecs = await getCollaborativeRecommendations(userId, limit * 2);
  const merged = [...recs];
  for (const p of cfRecs) {
    const id = String(p._id);
    if (seenIds.has(id)) continue;
    merged.push(p);
    seenIds.add(id);
    if (merged.length >= limit) break;
  }

  // Fill any remaining slots with profile-based recs
  if (merged.length < limit) {
    const profileRecs = await getProfileBasedRecommendations(userId, limit * 2);
    for (const p of profileRecs) {
      const id = String(p._id);
      if (seenIds.has(id)) continue;
      merged.push(p);
      seenIds.add(id);
      if (merged.length >= limit) break;
    }
  }

  if (merged.length >= limit) return merged.slice(0, limit);

  // Final fallback: popular active products not already shown
  const remainingCount = limit - merged.length;
  const fallback = await Product.find({
    status: "active",
    _id: { $nin: Array.from(seenIds) },
  })
    .sort({ views: -1, createdAt: -1 })
    .limit(remainingCount)
    .lean();

  return [...merged, ...fallback];
}

// ── PUBLIC: Trending products ────────────────────────────────────────────────
export async function getTrendingProducts(limit = 10) {
  // Aggregate view counts from the ProductView collection (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const agg = await ProductView.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: "$product", views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: limit * 3 },
  ]);

  const ids = agg.map((a) => a._id);

  if (!ids.length) {
    // Fallback: use the views field on Product itself
    return Product.find({ status: "active" })
      .sort({ views: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  const products = await Product.find({
    _id: { $in: ids },
    status: "active",
  }).lean();

  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  const ordered = [];
  for (const item of agg) {
    const p = byId.get(item._id.toString());
    if (p) ordered.push(p);
    if (ordered.length >= limit) break;
  }

  return ordered;
}
