import pickle
import os

MODEL_PATH = 'ai_service/models/sentiment_model.pkl'
VECTORIZER_PATH = 'ai_service/models/tfidf_vectorizer.pkl'

with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
with open(VECTORIZER_PATH, 'rb') as f: vec = pickle.load(f)

# Get words and their weights
feature_names = vec.get_feature_names_out()
coefficients = model.coef_[0]

# Pair them up and sort
word_scores = sorted(zip(coefficients, feature_names))

print("Top 10 NEGATIVE words:", [w for s, w in word_scores[:10]])
print("Top 10 POSITIVE words:", [w for s, w in word_scores[-10:]])

# Check weights of specific words
for word in ['phone', 'mobile', 'laptop', 'tablet', 'screen', 'battery', 'camera', 'device', 'iphone', 'samsung',
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
        'delivery', 'shipping', 'price', 'money', 'cost']:
    if word in feature_names:
        idx = list(feature_names).index(word)
        print(f"Weight of '{word}': {coefficients[idx]:.4f}")
    else:
        print(f"'{word}': SUCCESSFULY IGNORED (Removed from Model)")