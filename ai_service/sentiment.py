from flask import Flask, request, jsonify
import pickle
import os
import re

app = Flask(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl')
MODEL_PATH = os.path.join(MODEL_DIR, 'sentiment_model.pkl')

vectorizer = None
model = None

def load_artifacts():
    global vectorizer, model
    try:
        if os.path.exists(VECTORIZER_PATH) and os.path.exists(MODEL_PATH):
            with open(VECTORIZER_PATH, 'rb') as f:
                vectorizer = pickle.load(f)
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print("Artifacts loaded successfully.")
        else:
            print("Model files not found.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")

def simple_preprocess(text):
    if not isinstance(text, str): return ""
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Slang normalization
    slang_mapping = {
        "ok": "okay", "gud": "good", "wrst": "worst",
        "luv": "love", "hte": "hate", "wrth": "worth", "nt": "not"
    }
    for k, v in slang_mapping.items():
        text = re.sub(r'\b' + k + r'\b', v, text)

    return text.strip()

@app.route('/analyze_sentiment', methods=['POST'])
def analyze():
    if not vectorizer or not model:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.json
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'No text'}), 400
            
        cleaned = simple_preprocess(text)
        vec = vectorizer.transform([cleaned])
        
        # Predict probability
        score = 0.5
        if hasattr(model, 'predict_proba'):
            # Assuming binary classification: [prob_neg, prob_pos]
            proba = model.predict_proba(vec)[0]
            score = float(proba[1])
        else:
            # Fallback
            pred = model.predict(vec)[0]
            score = 1.0 if pred == 1 else 0.0
            
        label = 'neutral'
        if score >= 0.7: label = 'positive'
        elif score <= 0.25: label = 'negative'
        
        return jsonify({
            'sentimentScore': score,
            'sentimentLabel': label
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_artifacts()
    app.run(port=5001, debug=True)
