import mongoose from 'mongoose';
import fs from 'fs';

const reviewExportSchema = new mongoose.Schema({}, { strict: false });

// Connect to MongoDB and export reviews
mongoose.connect('mongodb://localhost:27017/dealmate').then(async () => {
    console.log('Connected to MongoDB');

    const Review = mongoose.model('Review', reviewExportSchema, 'reviews');

    try {
        const reviews = await Review.find({})
            .select('comment sentimentLabel sentimentScore rating')
            .lean();

        console.log('Found ' + reviews.length + ' reviews');

        if (reviews.length === 0) {
            console.log('No reviews found in database');
            process.exit(0);
        }

        // Display sample reviews
        console.log('\n=== SAMPLE REVIEWS ===');
        reviews.slice(0, 10).forEach((review, idx) => {
            console.log('\n' + (idx + 1) + '. Comment: ' + review.comment);
            console.log('   Sentiment: ' + review.sentimentLabel + ' (Score: ' + review.sentimentScore + ')');
            console.log('   Rating: ' + review.rating);
        });

        // Export to CSV format for training
        const csvLines = ['label,text'];

        reviews.forEach(review => {
            if (review.comment && review.sentimentLabel) {
                // Map sentiment to label: negative=0, positive=1
                const label = review.sentimentLabel === 'positive' ? 1 : (review.sentimentLabel === 'negative' ? 0 : -1);
                if (label !== -1) { // Skip neutral for now
                    const cleanComment = review.comment.replace(/"/g, '""'); // Escape quotes
                    csvLines.push(label + ',"' + cleanComment + '"');
                }
            }
        });

        fs.writeFileSync('dealmate_reviews.csv', csvLines.join('\n'));
        console.log('\n✓ Exported ' + (csvLines.length - 1) + ' reviews to dealmate_reviews.csv');

        // Statistics
        const stats = {
            total: reviews.length,
            positive: reviews.filter(r => r.sentimentLabel === 'positive').length,
            negative: reviews.filter(r => r.sentimentLabel === 'negative').length,
            neutral: reviews.filter(r => r.sentimentLabel === 'neutral').length,
        };

        console.log('\n=== STATISTICS ===');
        console.log('Total: ' + stats.total);
        console.log('Positive: ' + stats.positive + ' (' + (stats.positive / stats.total * 100).toFixed(1) + '%)');
        console.log('Negative: ' + stats.negative + ' (' + (stats.negative / stats.total * 100).toFixed(1) + '%)');
        console.log('Neutral: ' + stats.neutral + ' (' + (stats.neutral / stats.total * 100).toFixed(1) + '%)');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
