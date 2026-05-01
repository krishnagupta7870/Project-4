import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

// Mocking required models and functions for isolation test
// This is easier than trying to boot the whole backend

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

function scoreCandidate(baseProduct, candidate) {
    let score = 0;
    const baseSub = String(baseProduct.subCategory || "").toLowerCase();
    const candSub = String(candidate.subCategory || "").toLowerCase();
    if (baseSub && candSub && baseSub === candSub) score += 2;

    const baseThird = String(baseProduct.thirdCategory || "").toLowerCase();
    const candThird = String(candidate.thirdCategory || "").toLowerCase();
    if (baseThird && candThird && baseThird === candThird) score += 1;

    const baseBrand = String(baseProduct.brand || "").toLowerCase();
    const candBrand = String(candidate.brand || "").toLowerCase();
    if (baseBrand && candBrand && baseBrand === candBrand) score += 2;

    const baseCond = String((baseProduct.specifications && baseProduct.specifications.condition) || baseProduct.condition || "").toLowerCase().trim();
    const candCond = String((candidate.specifications && candidate.specifications.condition) || candidate.condition || "").toLowerCase().trim();
    if (baseCond && candCond && baseCond === candCond) score += 2;

    const baseCoords = baseProduct.coordinates?.coordinates;
    const candCoords = candidate.coordinates?.coordinates;

    if (baseCoords && candCoords && baseCoords.length >= 2 && candCoords.length >= 2) {
        const distKm = haversineKm(baseCoords[1], baseCoords[0], candCoords[1], candCoords[0]);
        if (distKm <= 5) score += 5;
        else if (distKm <= 15) score += 4;
        else if (distKm <= 50) score += 3;
        else if (distKm <= 150) score += 2;
        else if (distKm <= 500) score += 1;
        console.log(`  Distance to ${candidate.name}: ${distKm.toFixed(2)}km -> Score bonus included`);
    } else {
        const baseLoc = String(baseProduct.location || "").toLowerCase().trim();
        const candLoc = String(candidate.location || "").toLowerCase().trim();
        if (baseLoc && candLoc && baseLoc === candLoc) score += 2;
    }

    const basePrice = baseProduct.price;
    const candPrice = candidate.price;
    if (basePrice && candPrice) {
        const diffRatio = Math.abs(candPrice - basePrice) / basePrice;
        if (diffRatio < 0.10) score += 3;
        else if (diffRatio < 0.30) score += 2;
        else if (diffRatio < 0.60) score += 1;
    }

    return score;
}

const baseProduct = {
    name: "Samsung S21",
    subCategory: "Smartphones",
    brand: "Samsung",
    price: 30000,
    specifications: { condition: "Like New" },
    coordinates: { coordinates: [83.9856, 28.2095] } // Pokhara
};

const candidates = [
    {
        name: "S21 Nearby (Same condition)",
        subCategory: "Smartphones",
        brand: "Samsung",
        price: 31000,
        specifications: { condition: "Like New" },
        coordinates: { coordinates: [83.9900, 28.2100] } // ~0.5km away
    },
    {
        name: "S21 Far (Same condition)",
        subCategory: "Smartphones",
        brand: "Samsung",
        price: 31000,
        specifications: { condition: "Like New" },
        coordinates: { coordinates: [85.3240, 27.7172] } // Kathmandu (~150km away)
    },
    {
        name: "S21 Nearby (Used condition)",
        subCategory: "Smartphones",
        brand: "Samsung",
        price: 25000,
        specifications: { condition: "Used" },
        coordinates: { coordinates: [83.9856, 28.2095] } // Same spot
    }
];

console.log("Scoring Candidates for:", baseProduct.name);
candidates.forEach(c => {
    const score = scoreCandidate(baseProduct, c);
    console.log(`Candidate: ${c.name} | Final Score: ${score}`);
});
