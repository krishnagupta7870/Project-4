import requests
import json

url = "http://localhost:5002/content_recommend"
payload = {
    "base": {
        "id": "1",
        "title": "Samsung Galaxy Phone!!!",
        "description": "Excellent Android smartphone! 8GB RAM. Buy here."
    },
    "candidates": [
        {
            "id": "2",
            "title": "iPhone 14 Pro",
            "description": "Apple iOS smartphone great camera"
        },
        {
            "id": "3",
            "title": "Wooden Study Table",
            "description": "Brown furniture for bedroom!"
        },
        {
            "id": "4",
            "title": "Samsung Galaxy S22 Ultra",
            "description": "Android phone samsung brand original"
        }
    ]
}

try:
    response = requests.post(url, json=payload)
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
