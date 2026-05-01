import pickle
import sys
import os

path = r"e:/DEALMATE/ai_service/models/tfidf_vectorizer.pkl"

try:
    with open(path, "rb") as f:
        obj = pickle.load(f)
        print(f"Type: {type(obj)}")
        print(f"Content: {obj}")
        if hasattr(obj, "predict_proba"):
            print("Has predict_proba: Yes")
        else:
            print("Has predict_proba: No")
except Exception as e:
    print(f"Error: {e}")
