import os
import re
import pickle
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl')
MODEL_PATH = os.path.join(MODEL_DIR, 'sentiment_model.pkl')

# Marketplace Stopwords
STOPWORDS = {
    "buy", "sell", "sale", "selling", "purchase", "deal", "offer", "offers", 
    "price", "priced", "cost", "rate", "charge", "available", "stock", "urgent", 
    "quick", "good", "great", "best", "excellent", "nice", "perfect", "genuine",
    "original", "real", "top", "quality", "high", "premium", "product", "item", 
    "thing", "stuff", "piece", "set", "condition", "new", "used", "brand",
    "contact", "call", "message", "whatsapp", "dm", "inbox", "interested", 
    "serious", "buyer", "seller", "dealmate", "marketplace", "nepal", "pokhara", 
    "kathmandu", "lalitpur", "bhaktapur", "chitwan", "biratnagar", "dharan", "butwal"
}

# --- LOAD ARTIFACTS ---
vectorizer_sentiment = None
model_sentiment = None

def load_sentiment_artifacts():
    global vectorizer_sentiment, model_sentiment
    try:
        if os.path.exists(VECTORIZER_PATH) and os.path.exists(MODEL_PATH):
            with open(VECTORIZER_PATH, 'rb') as f:
                vectorizer_sentiment = pickle.load(f)
            with open(MODEL_PATH, 'rb') as f:
                model_sentiment = pickle.load(f)
            print("Sentiment artifacts loaded.")
    except Exception as e:
        print(f"Error loading sentiment artifacts: {e}")

load_sentiment_artifacts()

# --- UTILS ---
def preprocess_text(text: str) -> str:
    text = str(text or "").lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [w for w in text.split() if len(w) > 1 and w not in STOPWORDS]
    return " ".join(tokens)

def build_recommend_text(item: dict) -> str:
    title = preprocess_text(item.get("title") or "")
    description = preprocess_text(item.get("description") or "")
    return f"{title} {title} {description}"

def simple_preprocess_sentiment(text):
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z\s]', '', text)
    slang_mapping = {"ok": "okay", "gud": "good", "wrst": "worst", "nt": "not"}
    for k, v in slang_mapping.items():
        text = re.sub(r'\b' + k + r'\b', v, text)
    return text.strip()

# --- ROUTES ---

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-unified"})

@app.route("/content_recommend", methods=["POST"])
def content_recommend():
    payload = request.get_json(silent=True) or {}
    base = payload.get("base") or {}
    candidates = payload.get("candidates") or []

    if not candidates:
        return jsonify({"ranked": [], "rankedIds": []})

    texts = [build_recommend_text(base)] + [build_recommend_text(c) for c in candidates]
    vectorizer = TfidfVectorizer(max_features=8000, ngram_range=(1, 2), sublinear_tf=True)

    try:
        matrix = vectorizer.fit_transform(texts)
        similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()
        indexed = list(enumerate(similarities))
        indexed.sort(key=lambda x: x[1], reverse=True)
        ranked = [{"id": candidates[i]["id"], "score": float(sim)} for i, sim in indexed]
        return jsonify({"ranked": ranked, "rankedIds": [item["id"] for item in ranked]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze_sentiment', methods=['POST'])
def analyze_sentiment():
    if not vectorizer_sentiment or not model_sentiment:
        return jsonify({'error': 'Sentiment model not loaded'}), 500
    
    try:
        data = request.json
        text = data.get('text', '')
        if not text: return jsonify({'error': 'No text'}), 400
            
        cleaned = simple_preprocess_sentiment(text)
        vec = vectorizer_sentiment.transform([cleaned])
        
        score = 0.5
        if hasattr(model_sentiment, 'predict_proba'):
            proba = model_sentiment.predict_proba(vec)[0]
            score = float(proba[1])
        else:
            pred = model_sentiment.predict(vec)[0]
            score = 1.0 if pred == 1 else 0.0
            
        label = 'neutral'
        if score >= 0.7: label = 'positive'
        elif score <= 0.25: label = 'negative'
        
        return jsonify({'sentimentScore': score, 'sentimentLabel': label})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port)
