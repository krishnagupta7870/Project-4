import re

def simple_preprocess(text):
    """Enhanced preprocessing with but/however handling and slang normalization"""
    if not isinstance(text, str):
        return ""
    
    original_text = text
    text = text.lower()
    
    # Handle "but/however" sentences - sentiment after these words usually dominates
    # This is an industry-standard heuristic for sentiment analysis
    if " but " in text:
        text = text.split(" but ")[-1]
    elif " however " in text:
        text = text.split(" however ")[-1]
    
    # Normalize common slang and informal language
    slang_mapping = {
        " ok ": " okay ",
        " gud ": " good ",
        " wrst ": " worst ",
        " luv ": " love ",
        " hte ": " hate ",
        " wrth ": " worth ",
        " nt ": " not ",
    }
    for slang, normalized in slang_mapping.items():
        text = text.replace(slang, normalized)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters and digits
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Final whitespace trim
    text = text.strip()
    
    print(f"Original: {original_text}")
    print(f"After preprocessing: {text}")
    print("-" * 70)
    
    return text

# Test problematic cases
test_cases = [
    "Camera is good and performance is fine, but battery drains fast so overall experience is average.",
    "Good for the price, some minor scratches but works fine, I'm mostly satisfied.",
    "Great phone if you enjoy charging it five times a day.",
    "Looks good in photos but actual product quality is disappointing.",
    "item ok working fine",
    "Product is okay, not bad but not good either.",
]

print("=" * 70)
print("PREPROCESSING DEBUG TEST")
print("=" * 70)

for test in test_cases:
    simple_preprocess(test)
