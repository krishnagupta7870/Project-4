import User from '../models/User.js';
import Review from '../models/Review.js';
import Report from '../models/Report.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import Conversation from '../models/Conversation.js';

export const calculateTrustScore = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Only calculate trust scores for sellers (users who have listed products)
        // 0. Check New Seller Status
        // If account is < 15 days old OR no reviews, returns null score (indicating New Seller)
        const accountAgeMs = Date.now() - new Date(user.createdAt).getTime();
        const daysOld = accountAgeMs / (1000 * 60 * 60 * 24);
        const reviews = await Review.find({ seller: userId });
        const totalReviews = reviews.length;

        if (daysOld < 15 && totalReviews === 0) {
            // New seller logic
            user.trustScore = undefined;
            user.sellerStats = {
                ratingPoints: 0,
                reviewPoints: 0,
                reportPoints: 10,
                chatPoints: 10,
                soldPoints: 0,
                totalReviews: 0,
                isNewSeller: true
            };
            await user.save();
            return null;
        }

        // Fetch products for stats calculation
        const products = await Product.find({ seller: userId });
        if (products.length === 0) {
            // Not a seller logic could go here, or just continue with 0 sales points
            // But existing logic relied on productIds.
            // If no products, we can probably return early or set stats to default?
            // But user might have reviews from deleted products?
            // Let's assume we proceed but productIds is empty.
        }
        const productIds = products.map(p => p._id);

        // 1. Rating Score (35 pts)
        // Formula: Round((AvgRating / 5.0) * 35), Max 35
        let avgRating = 0;
        if (totalReviews > 0) {
            avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        }

        let ratingPoints = 0;
        if (avgRating > 0) {
            const rawPoints = (avgRating / 5.0) * 35;
            ratingPoints = Math.round(Math.min(rawPoints, 35));
        }

        // 2. Review Sentiment Score (35 pts)
        // Formula: Floor((AvgSentiment / 0.85) * 35), Max 35
        let reviewPoints = 0;
        let avgSentimentScore = 0;

        if (totalReviews > 0) {
            const totalSentiment = reviews.reduce((sum, r) => sum + (r.sentimentScore || 0.5), 0);
            avgSentimentScore = totalSentiment / totalReviews;

            const rawSentimentPoints = (avgSentimentScore / 0.85) * 35;
            reviewPoints = Math.floor(Math.min(rawSentimentPoints, 35)); // "Just cut the number" -> Floor
        }

        // 3. Report Sentiment Score (10 pts)
        // Only count valid negative reports (score < 0.35) AND NOT dismissed
        const reports = await Report.find({
            targetId: userId,
            reportType: 'user',
            status: { $ne: 'dismissed' }
        });

        let validNegativeReports = 0;
        reports.forEach(r => {
            if (r.sentimentScore < 0.35) {
                validNegativeReports++;
            }
        });

        const productReports = await Report.find({
            targetId: { $in: productIds },
            reportType: 'product',
            status: { $ne: 'dismissed' }
        });
        productReports.forEach(r => {
            if (r.sentimentScore < 0.35) {
                validNegativeReports++;
            }
        });

        let reportPoints = 10;
        if (validNegativeReports === 0) reportPoints = 10;
        else if (validNegativeReports <= 2) reportPoints = 7;
        else if (validNegativeReports <= 4) reportPoints = 4;
        else reportPoints = 0;

        // 4. Chat Responsiveness (10 pts)
        // Measure first reply time.
        const sellerConversations = await Conversation.find({
            product: { $in: productIds },
            participants: userId
        }).populate('product');

        let totalReplyTime = 0;
        let fastReplyCount = 0;

        for (const conv of sellerConversations) {
            const messages = await Message.find({ conversation: conv._id }).sort({ createdAt: 1 }).limit(2);
            if (messages.length >= 2) {
                const firstMsg = messages[0];
                const secondMsg = messages[1];

                // Check if user is the replier (second msg sender)
                if (String(secondMsg.sender) === String(userId) && String(firstMsg.sender) !== String(userId)) {
                    const diffMs = new Date(secondMsg.createdAt) - new Date(firstMsg.createdAt);
                    totalReplyTime += diffMs;
                    fastReplyCount++;
                }
            }
        }

        let avgReplyMinutes = 0;
        let chatPoints = 10; // Default max?

        if (fastReplyCount > 0) {
            avgReplyMinutes = (totalReplyTime / fastReplyCount) / (1000 * 60);

            if (avgReplyMinutes <= 10) chatPoints = 10;
            else if (avgReplyMinutes <= 60) chatPoints = 8;
            else if (avgReplyMinutes <= 180) chatPoints = 7; // 3 hrs
            else if (avgReplyMinutes <= 360) chatPoints = 6; // 6 hrs
            else if (avgReplyMinutes <= 720) chatPoints = 5; // 12 hrs
            else if (avgReplyMinutes <= 1440) chatPoints = 3; // 24 hrs
            else chatPoints = 2; // Over 24 hours
        } else {
            // No chats yet - give full points for fairness
            chatPoints = 10;
        }

        // 5. Sold Items (10 pts)
        let totalSales = 0;
        let totalInventory = 0;

        products.forEach(p => {
            totalSales += (p.sales || 0);
            totalInventory += (p.stock || 0) + (p.sales || 0);
        });

        let soldRate = 0;
        if (totalInventory > 0) {
            soldRate = (totalSales / totalInventory) * 100;
        }

        let soldPoints = 0;
        if (soldRate >= 80) soldPoints = 10;
        else if (soldRate >= 60) soldPoints = 7;
        else if (soldRate >= 40) soldPoints = 5;
        else if (soldRate >= 20) soldPoints = 3;
        else soldPoints = 0;

        // "is there is only 1 or 2 item listed then 5 points will be given auto"
        // Ensure fair start for small inventory
        if (products.length > 0 && products.length <= 2) {
            soldPoints = Math.max(soldPoints, 5);
        }

        // Final Calculation
        const finalScore = ratingPoints + reviewPoints + reportPoints + chatPoints + soldPoints;
        const cappedScore = Math.min(100, Math.max(0, finalScore));

        // Update User
        user.trustScore = cappedScore;
        user.sellerStats = {
            ratingPoints,
            reviewPoints,
            reportPoints,
            chatPoints,
            soldPoints,
            totalReviews,
            avgSentimentScore: avgSentimentScore,
            negativeReports: validNegativeReports,
            avgReplyTimeMinutes: avgReplyMinutes,
            soldCount: totalSales,
            totalStock: totalInventory
        };

        await user.save();
        return cappedScore;

    } catch (error) {
        console.error("Trust Score Calculation Error:", error);
    }
};
