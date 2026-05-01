import pandas as pd
import numpy as np
import pickle
import os
import re
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
TRAIN_DATA_PATH = os.path.join(DATA_DIR, 'train.csv')

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

def simple_preprocess(text):
    """Enhanced preprocessing with but/however handling and slang normalization"""
    if not isinstance(text, str):
        return ""
    
    text = text.lower()

    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters and digits
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Remove special characters and digits
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Normalize common slang and informal language
    slang_mapping = {
        "ok": "okay",
        "gud": "good",
        "wrst": "worst",
        "luv": "love",
        "hte": "hate",
        "wrth": "worth",
        "nt": "not",
    }
    for slang, normalized in slang_mapping.items():
        text = re.sub(r'\b' + slang + r'\b', normalized, text)
    
    # Final whitespace trim
    text = text.strip()
    
    return text

def train():
    print("Loading data...")
    # Load a subset of data for faster training/demonstration. Adjust nrows as needed.
    # The dataset has no headers, assuming column 1 is label, 2 is title, 3 is text.
    # Labels: 1 (negative), 2 (positive) -> convert to 0 and 1
    df = pd.read_csv(TRAIN_DATA_PATH, header=None, names=['label', 'title', 'text'])
    
    print("Preprocessing...")
    df['clean_text'] = df['text'].apply(simple_preprocess)
    # Convert labels: 1 -> 0 (negative), 2 -> 1 (positive)
    df['target'] = df['label'].apply(lambda x: 0 if x == 1 else 1)
    
    X = df['clean_text']
    y = df['target']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Vectorizing...")
    # Improved vectorizer:
    # 1. ngram_range=(1, 2) captures phrases like "very good", "not bad"
    # 2. Removed stop_words='english' to keep negations like "not" which are critical for sentiment
    # 3. Increased max_features to 15000 for better phrase coverage
        # Define objects/nouns to ignore (Extracted from DEALMATE categories)
    custom_stop_words = [
        # Electronics & Brands
        'phone', 'mobile', 'laptop', 'tablet', 'screen', 'battery', 'camera', 'device', 'iphone', 'samsung',
        'hp', 'dell', 'lenovo', 'asus', 'acer', 'apple', 'msi', 'canon', 'nikon', 'sony', 'fujifilm',
        'gopro', 'dji', 'hdd', 'ssd', 'ram', 'processor', 'cpu', 'motherboard', 'psu', 'gpu',
        
        # Vehicles & Parts
        'bike', 'cycle', 'car', 'vehicle', 'engine', 'tire', 'motorcycle', 'yamaha', 'honda',
        'bajaj', 'hero', 'ktm', 'tvs', 'suzuki', 'jawa', 'piaggio', 'vespa', 'aprilia',
        'toyota', 'kia', 'hyundai', 'tata', 'mahindra', 'maruti', 'ford', 'volkswagen',
        
        # Home & Kitchen
        'fridge', 'refrigerator', 'washing', 'machine', 'ac', 'conditioner', 'mixer', 'grinder',
        'oven', 'juicer', 'blender', 'furniture', 'sofa', 'dining', 'bed', 'wardrobe', 'cabinet',
        
        # Fashion & Others
        'clothing', 'shoes', 'watch', 'shirt', 'pants', 'dress', 'jacket', 'book', 'movie', 'game',
        'pets', 'cat', 'dog', 'fish', 'property', 'house', 'apartment', 'land', 'plot',
        
        # Shopping & Platforms
        'product', 'item', 'thing', 'purchase', 'order', 'seller', 'dealmate', 'amazon', 'ebay', 
        'delivery', 'shipping', 'price', 'money', 'cost',

        # Transactional & Neutral Marketplace Terms
        'selling', 'available', 'sale', 'for', 'months', 'years', 'used', 'purchased', 
        'upgraded', 'condition', 'reason', 'need', 'needs', 'needed', 'want', 'wants', 
        'wanted', 'description', 'details', 'info', 'location', 'pick', 'pickup', 
        'exchange', 'warranty', 'bill', 'box', 'negotiable', 'fixed', 'price'
    ]

    # Update the Vectorizer
    vectorizer = TfidfVectorizer(
        max_features=15000, 
        ngram_range=(1, 2), 
        stop_words=custom_stop_words  # Use the list above
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    print("Training model...")
    # Use class_weight='balanced' to handle imbalanced datasets
    # Increased max_iter for better convergence with more features
    model = LogisticRegression(max_iter=2000, class_weight='balanced')
    model.fit(X_train_vec, y_train)
    
    print("Evaluating...")
    preds = model.predict(X_test_vec)
    acc = accuracy_score(y_test, preds)
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test, preds))
    
    print("Saving artifacts...")
    with open(os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'), 'wb') as f:
        pickle.dump(vectorizer, f)
    
    with open(os.path.join(MODEL_DIR, 'sentiment_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
        
    print("Training complete.")

if __name__ == "__main__":
    train()
