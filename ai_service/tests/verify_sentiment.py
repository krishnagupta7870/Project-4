import urllib.request
import json

def test_sentiment(text):
    url = "http://localhost:5001/analyze_sentiment"
    data = json.dumps({'text': text}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                res_body = response.read().decode('utf-8')
                result = json.loads(res_body)
                return result
    except Exception as e:
        return {'error': str(e)}

# Test cases for verification
test_cases = [
    # But/however handling
    ("Good product but terrible quality", "negative", "but handling"),
    ("Nice design however poor build", "negative", "however handling"),
    ("Bad at first but now amazing", "positive", "but flips to positive"),
    
    # Slang normalization
    ("item ok nothing special", "neutral", "slang: ok"),
    ("gud product", "positive", "slang: gud"),
    ("wrst purchase ever", "negative", "slang: wrst"),
    
    # Mixed sentiment
    ("not bad but not great", "neutral", "mixed sentiment"),
    ("average product", "neutral", "neutral single word"),
    
    # Standard cases (no regression)
    ("Amazing product, highly recommend!", "positive", "strong positive"),
    ("Terrible waste of money", "negative", "strong negative"),
    ("Works fine, does the job", "neutral", "basic neutral"),
]

print("=" * 70)
print("SENTIMENT ANALYSIS VERIFICATION TESTS")
print("=" * 70)

passed = 0
failed = 0

for text, expected_label, description in test_cases:
    result = test_sentiment(text)
    
    if 'error' in result:
        print(f"\n❌ ERROR: {description}")
        print(f"   Text: '{text}'")
        print(f"   Error: {result['error']}")
        failed += 1
        continue
    
    score = result.get('sentimentScore', 0)
    label = result.get('sentimentLabel', 'unknown')
    
    # Check if expectation matches
    if label == expected_label:
        status = "✅ PASS"
        passed += 1
    else:
        status = "❌ FAIL"
        failed += 1
    
    print(f"\n{status}: {description}")
    print(f"   Text: '{text}'")
    print(f"   Expected: {expected_label} | Got: {label} (score: {score:.3f})")

print("\n" + "=" * 70)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print("=" * 70)
