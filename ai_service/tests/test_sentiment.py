import urllib.request
import json
import sys

def test_sentiment():
    url = "http://localhost:5001/analyze_sentiment"
    print(f"Connecting to Sentiment Service at {url}...")
    print("Type 'exit' or 'quit' to stop.\n")

    while True:
        try:
            text = input("Enter review text > ")
            if text.lower() in ('exit', 'quit'):
                break
                
            if not text.strip():
                continue

            data = json.dumps({'text': text}).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
            
            with urllib.request.urlopen(req) as response:
                if response.status == 200:
                    res_body = response.read().decode('utf-8')
                    result = json.loads(res_body)
                    print(f"Analysis Result:")
                    print(f"  Score: {result.get('sentimentScore', 'N/A')}")
                    print(f"  Label: {result.get('sentimentLabel', 'N/A')}")
                    print("-" * 30)
                else:
                    print(f"Error: {response.status}")

        except urllib.error.URLError as e:
            print(f"Error: Could not connect to the server. Is 'ai_service/sentiment.py' running? Details: {e}")
            # break # Don't break, maybe it comes up
        except Exception as e:
            print(f"An error occurred: {e}")
            break

if __name__ == "__main__":
    test_sentiment()
