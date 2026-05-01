import axios from 'axios';

const SENTIMENT_API_URL = 'http://127.0.0.1:5001/analyze_sentiment';

export const analyzeSentiment = async (text, rating = null) => {
    try {
        let score = 0.5;
        let label = 'neutral';

        // 1. Get AI-based sentiment if text exists
        if (text && text.trim().length > 0) {
            try {
                const response = await axios.post(SENTIMENT_API_URL, { text });
                score = response.data.sentimentScore;
                label = response.data.sentimentLabel;
            } catch (err) {
                console.warn('AI Sentiment Service unavailable, falling back to rating alone.', err.message);
            }
        }

        // 2. Apply Rating Override - DISABLED as per user request (prioritize text)
        /* 
        if (rating) {
             // ... (User wants text to be the source of truth, even if rating mismatches)
        } 
        */

        return { score, label };
    } catch (error) {
        console.error('Sentiment Analysis Error:', error.message);

        // Fallback based on rating if everything fails
        if (rating) {
            const numericRating = Number(rating);
            if (numericRating >= 4) return { score: 0.9, label: 'positive' };
            if (numericRating <= 2) return { score: 0.1, label: 'negative' };
        }
        return { score: 0.5, label: 'neutral' };
    }
};
