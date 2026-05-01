import urllib.request
import json

url = "http://localhost:5001/analyze_sentiment"
tests = [
    "Phone used for 6 months, selling because upgraded",
    "Bike is 2 years old, documents available",
    "Laptop purchased last year, used occasionally",
    "Mobile with charger and box",
    "Screen replaced once, working fine now",
    "Battery changed recently",
    "Bike serviced last month",
    "Used phone, no major issues",
    "Laptop used for online classes",
    "Selling as no longer needed"
]

print(f"{'Review':<60} | {'Score':<10} | {'Label'}")
print("-" * 85)

for t in tests:
    try:
        data = json.dumps({"text": t}).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode("utf-8"))
            score = result.get('sentimentScore', 'N/A')
            label = result.get('sentimentLabel', 'N/A')
            print(f"{t:<60} | {score:<10.4f} | {label}")
    except Exception as e:
        print(f"Error testing '{t}': {e}")
