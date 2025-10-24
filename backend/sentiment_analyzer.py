from textblob import TextBlob
from typing import Dict


def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of text and return detailed analysis
    
    Returns:
        {
            'polarity': float (-1 to 1, negative to positive),
            'subjectivity': float (0 to 1, objective to subjective),
            'sentiment': str (positive/negative/neutral),
            'emotion': str (predicted emotion)
        }
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Determine sentiment label
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Predict emotion based on polarity and keywords
    emotion = predict_emotion(text.lower(), polarity)
    
    return {
        "polarity": round(polarity, 2),
        "subjectivity": round(subjectivity, 2),
        "sentiment": sentiment,
        "emotion": emotion,
        "needs_attention": polarity < -0.3  # Flag for concerning content
    }


def predict_emotion(text: str, polarity: float) -> str:
    """Predict emotion based on keywords and polarity"""
    
    # Keyword-based emotion detection
    anxiety_keywords = ['anxious', 'worried', 'nervous', 'stressed', 'panic', 'fear']
    sad_keywords = ['sad', 'depressed', 'lonely', 'hopeless', 'cry', 'hurt']
    happy_keywords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'love']
    angry_keywords = ['angry', 'furious', 'mad', 'hate', 'frustrated']
    calm_keywords = ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil']
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in anxiety_keywords):
        return "anxious"
    elif any(word in text_lower for word in sad_keywords):
        return "sad"
    elif any(word in text_lower for word in happy_keywords):
        return "happy"
    elif any(word in text_lower for word in angry_keywords):
        return "stressed"
    elif any(word in text_lower for word in calm_keywords):
        return "calm"
    
    # Fallback to polarity-based prediction
    if polarity > 0.5:
        return "happy"
    elif polarity > 0.1:
        return "calm"
    elif polarity < -0.5:
        return "sad"
    elif polarity < -0.1:
        return "anxious"
    else:
        return "neutral"


def get_supportive_message(sentiment_data: Dict) -> str:
    """Generate supportive message based on sentiment analysis"""
    
    emotion = sentiment_data['emotion']
    sentiment = sentiment_data['sentiment']
    
    messages = {
        'happy': "It's wonderful to see you in such a positive state! Keep embracing these joyful moments.",
        'calm': "Your sense of peace is beautiful. Continue nurturing this tranquility.",
        'sad': "I sense you're going through a difficult time. Remember, it's okay to feel this way. Consider reaching out to someone you trust.",
        'anxious': "You seem worried. Try some breathing exercises, and remember - you're stronger than you think.",
        'stressed': "You're feeling overwhelmed. Take a moment for yourself. Small steps can make a big difference.",
        'neutral': "Thank you for sharing. I'm here to listen whenever you need."
    }
    
    base_message = messages.get(emotion, messages['neutral'])
    
    if sentiment_data['needs_attention']:
        base_message += " If these feelings persist, please consider talking to a trusted adult or mental health professional."
    
    return base_message
