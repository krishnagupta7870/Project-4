import re
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# ── Marketplace-specific stopwords ──────────────────────────────────────────
# These words are too generic in a second-hand marketplace context and add
# noise to TF-IDF vectors instead of helping similarity.
STOPWORDS = {
    # Transactional / listing filler
    "buy", "sell", "sale", "selling", "selling", "purchase", "deal",
    "offer", "offers", "price", "priced", "cost", "rate", "charge",
    "available", "availability", "stock", "urgent", "quick",
    # Quality descriptors that everything claims
    "good", "great", "best", "excellent", "nice", "perfect", "genuine",
    "original", "real", "top", "quality", "high", "premium",
    # Product/item generics
    "product", "item", "thing", "stuff", "piece", "set",
    # Condition generics (handled separately in scoring)
    "condition", "new", "used", "brand",
    # Contact & action words
    "contact", "call", "message", "whatsapp", "dm", "inbox",
    "interested", "serious", "buyer", "seller",
    # Platform-specific
    "dealmate", "marketplace",
    # Common Nepali location names that dilute similarity
    "nepal", "pokhara", "kathmandu", "lalitpur", "bhaktapur",
    "chitwan", "biratnagar", "dharan", "butwal",
    # Common single letters / short tokens are filtered by len check
}


def preprocess_text(text: str) -> str:
    """
    Lowercase → remove punctuation → strip extra whitespace →
    remove stopwords and single-character tokens.
    """
    text = str(text or "").lower()
    # Replace punctuation (keep alphanumeric + spaces)
    text = re.sub(r"[^\w\s]", " ", text)
    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [w for w in text.split() if len(w) > 1 and w not in STOPWORDS]
    return " ".join(tokens)


def build_text(item: dict) -> str:
    title = preprocess_text(item.get("title") or "")
    description = preprocess_text(item.get("description") or "")
    # Weight title more by repeating it
    return f"{title} {title} {description}"


@app.route("/content_recommend", methods=["POST"])
def content_recommend():
    payload = request.get_json(silent=True) or {}
    base = payload.get("base") or {}
    candidates = payload.get("candidates") or []

    if not candidates:
        return jsonify({"ranked": [], "rankedIds": []})

    # Build corpus: base product first, then all candidates
    texts = [build_text(base)] + [build_text(c) for c in candidates]

    # TF-IDF with unigrams + bigrams for better phrase matching
    # (e.g. "samsung galaxy", "android phone")
    vectorizer = TfidfVectorizer(
        max_features=8000,
        ngram_range=(1, 2),       # unigrams + bigrams
        min_df=1,
        sublinear_tf=True,        # apply log to term frequency
    )

    try:
        matrix = vectorizer.fit_transform(texts)
    except ValueError:
        # If vocab is empty after preprocessing, return original order
        ranked = [{"id": c["id"], "score": 0.0} for c in candidates]
        return jsonify({"ranked": ranked, "rankedIds": [c["id"] for c in candidates]})

    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    indexed = list(enumerate(similarities))
    indexed.sort(key=lambda x: x[1], reverse=True)

    ranked = [
        {"id": candidates[i]["id"], "score": float(sim)}
        for i, sim in indexed
    ]
    ranked_ids = [item["id"] for item in ranked]

    return jsonify({"ranked": ranked, "rankedIds": ranked_ids})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "recommend"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
