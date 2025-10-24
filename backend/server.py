from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

# Import custom modules
from auth_utils import get_password_hash, verify_password, create_access_token, decode_token
from sentiment_analyzer import analyze_sentiment, get_supportive_message

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Buddy Mind Flow API")
api_router = APIRouter(prefix="/api")

# LLM Configuration
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')


# ============= MODELS =============

# User Models
class EmergencyContact(BaseModel):
    name: str
    relationship: str  # parent, teacher, guardian
    email: EmailStr
    phone: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    age: Optional[int] = None
    emergency_contacts: List[EmergencyContact] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    emergency_contacts: List[EmergencyContact] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    age: Optional[int]
    emergency_contacts: List[EmergencyContact]


# Chat Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    response: str
    sentiment: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    message: str


# Mood Models
class MoodEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    mood: str
    intensity: int
    note: Optional[str] = None
    sentiment: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoodEntryCreate(BaseModel):
    mood: str
    intensity: int
    note: Optional[str] = None


# Journal Models
class JournalEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    is_voice: bool = False
    tags: List[str] = []
    sentiment: Optional[dict] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JournalEntryCreate(BaseModel):
    content: str
    is_voice: bool = False
    tags: List[str] = []


# Game Models
class GameScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_type: str
    score: int
    duration: Optional[int] = None
    completed: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameScoreCreate(BaseModel):
    game_type: str
    score: int
    duration: Optional[int] = None
    completed: bool = False


# Audio Track Models
class AudioTrack(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    category: str
    duration: Optional[int] = None

class AudioTrackCreate(BaseModel):
    title: str
    url: str
    category: str
    duration: Optional[int] = None


# ============= AUTH DEPENDENCIES =============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Welcome to Buddy Mind Flow API with AI Therapist", "status": "active"}


# ============= AUTH ROUTES =============

@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_obj = User(
        name=user_data.name,
        email=user_data.email,
        age=user_data.age,
        emergency_contacts=user_data.emergency_contacts
    )
    
    user_dict = user_obj.model_dump()
    user_dict['password'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    # Convert emergency contacts to dicts
    user_dict['emergency_contacts'] = [contact.model_dump() for contact in user_obj.emergency_contacts]
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"user_id": user_obj.id})
    
    return {
        "token": token,
        "user": {
            "id": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "age": user_obj.age
        }
    }


@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user.get('password', '')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user['id']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "age": user.get('age')
        }
    }


@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user)


# ============= AI THERAPIST CHATBOT =============

@api_router.post("/chat", response_model=ChatMessage)
async def chat_with_therapist(message: ChatMessageCreate, current_user: dict = Depends(get_current_user)):
    """Chat with AI therapist"""
    
    # Analyze sentiment
    sentiment = analyze_sentiment(message.message)
    supportive_msg = get_supportive_message(sentiment)
    
    # Initialize AI chat
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"therapy_{current_user['id']}",
            system_message=f"""You are a compassionate, professional AI therapist helping {current_user['name']}, 
a young person seeking mental health support. Your role is to:

1. Listen empathetically and validate their feelings
2. Ask thoughtful follow-up questions to understand their situation
3. Provide gentle guidance and coping strategies
4. Recognize signs of crisis and recommend professional help when needed
5. Use age-appropriate language and maintain a warm, supportive tone
6. Never judge or criticize
7. Encourage healthy habits like exercise, sleep, and social connection
8. Celebrate their strengths and progress

Important: If the user expresses thoughts of self-harm or suicide, immediately encourage them to reach out to their emergency contacts or call a crisis helpline.

Current sentiment analysis: {sentiment['sentiment']} (emotion: {sentiment['emotion']})
{supportive_msg}"""
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=message.message)
        ai_response = await chat.send_message(user_msg)
        
    except Exception as e:
        logging.error(f"AI Chat error: {str(e)}")
        # Fallback response
        ai_response = f"I understand you're sharing something important. {supportive_msg} While I'm experiencing technical difficulties, please know that your feelings are valid. Would you like to try expressing your thoughts in your journal instead?"
    
    # Save chat to database
    chat_obj = ChatMessage(
        user_id=current_user['id'],
        message=message.message,
        response=ai_response,
        sentiment=sentiment
    )
    
    doc = chat_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.chat_history.insert_one(doc)
    
    return chat_obj


@api_router.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Get chat history"""
    history = await db.chat_history.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    for entry in history:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return history


# ============= MOOD TRACKING =============

@api_router.post("/moods", response_model=MoodEntry)
async def create_mood_entry(entry: MoodEntryCreate, current_user: dict = Depends(get_current_user)):
    """Record a new mood entry with sentiment analysis"""
    
    # Analyze sentiment if note exists
    sentiment = None
    if entry.note:
        sentiment = analyze_sentiment(entry.note)
    
    mood_obj = MoodEntry(
        user_id=current_user['id'],
        mood=entry.mood,
        intensity=entry.intensity,
        note=entry.note,
        sentiment=sentiment
    )
    
    doc = mood_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.mood_entries.insert_one(doc)
    
    return mood_obj


@api_router.get("/moods", response_model=List[MoodEntry])
async def get_mood_entries(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """Get recent mood entries"""
    entries = await db.mood_entries.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    for entry in entries:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return entries


@api_router.get("/moods/stats")
async def get_mood_stats(current_user: dict = Depends(get_current_user)):
    """Get mood statistics with sentiment insights"""
    entries = await db.mood_entries.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).to_list(1000)
    
    if not entries:
        return {
            "total_entries": 0,
            "most_common_mood": None,
            "average_intensity": 0,
            "mood_distribution": {},
            "sentiment_trend": "neutral"
        }
    
    mood_counts = {}
    total_intensity = 0
    sentiment_scores = []
    
    for entry in entries:
        mood = entry['mood']
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
        total_intensity += entry['intensity']
        
        if entry.get('sentiment'):
            sentiment_scores.append(entry['sentiment']['polarity'])
    
    most_common = max(mood_counts, key=mood_counts.get)
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    
    sentiment_trend = "positive" if avg_sentiment > 0.1 else "negative" if avg_sentiment < -0.1 else "neutral"
    
    return {
        "total_entries": len(entries),
        "most_common_mood": most_common,
        "average_intensity": round(total_intensity / len(entries), 2),
        "mood_distribution": mood_counts,
        "sentiment_trend": sentiment_trend,
        "average_sentiment_score": round(avg_sentiment, 2)
    }


# ============= JOURNAL =============

@api_router.post("/journals", response_model=JournalEntry)
async def create_journal_entry(entry: JournalEntryCreate, current_user: dict = Depends(get_current_user)):
    """Create a new journal entry with sentiment analysis"""
    
    # Analyze sentiment
    sentiment = analyze_sentiment(entry.content)
    
    journal_obj = JournalEntry(
        user_id=current_user['id'],
        content=entry.content,
        is_voice=entry.is_voice,
        tags=entry.tags,
        sentiment=sentiment
    )
    
    doc = journal_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.journal_entries.insert_one(doc)
    
    return journal_obj


@api_router.get("/journals", response_model=List[JournalEntry])
async def get_journal_entries(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Get recent journal entries"""
    entries = await db.journal_entries.find(
        {"user_id": current_user['id']}, 
        {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    
    for entry in entries:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return entries


@api_router.delete("/journals/{journal_id}")
async def delete_journal_entry(journal_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a journal entry"""
    result = await db.journal_entries.delete_one({
        "id": journal_id, 
        "user_id": current_user['id']
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    return {"message": "Journal entry deleted successfully"}


# ============= GAMES =============

@api_router.post("/games/scores", response_model=GameScore)
async def save_game_score(score: GameScoreCreate, current_user: dict = Depends(get_current_user)):
    """Save a game score"""
    score_obj = GameScore(
        user_id=current_user['id'],
        game_type=score.game_type,
        score=score.score,
        duration=score.duration,
        completed=score.completed
    )
    
    doc = score_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.game_scores.insert_one(doc)
    
    return score_obj


@api_router.get("/games/scores", response_model=List[GameScore])
async def get_game_scores(
    game_type: Optional[str] = None, 
    limit: int = 20, 
    current_user: dict = Depends(get_current_user)
):
    """Get game scores"""
    query = {"user_id": current_user['id']}
    if game_type:
        query["game_type"] = game_type
    
    scores = await db.game_scores.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for score in scores:
        if isinstance(score['timestamp'], str):
            score['timestamp'] = datetime.fromisoformat(score['timestamp'])
    
    return scores


@api_router.get("/games/stats")
async def get_game_stats(current_user: dict = Depends(get_current_user)):
    """Get overall game statistics"""
    scores = await db.game_scores.find({"user_id": current_user['id']}, {"_id": 0}).to_list(1000)
    
    if not scores:
        return {
            "total_games_played": 0,
            "games_completed": 0,
            "total_time_spent": 0,
            "favorite_game": None
        }
    
    game_counts = {}
    total_time = 0
    completed = 0
    
    for score in scores:
        game_type = score['game_type']
        game_counts[game_type] = game_counts.get(game_type, 0) + 1
        if score.get('duration'):
            total_time += score['duration']
        if score.get('completed'):
            completed += 1
    
    favorite = max(game_counts, key=game_counts.get) if game_counts else None
    
    return {
        "total_games_played": len(scores),
        "games_completed": completed,
        "total_time_spent": total_time,
        "favorite_game": favorite,
        "game_distribution": game_counts
    }


# ============= AUDIO =============

@api_router.get("/audio/tracks", response_model=List[AudioTrack])
async def get_audio_tracks():
    """Get all available audio tracks"""
    tracks = await db.audio_tracks.find({}, {"_id": 0}).to_list(100)
    
    if not tracks:
        default_tracks = [
            {
                "id": str(uuid.uuid4()),
                "title": "Ocean Waves",
                "url": "https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3",
                "category": "nature",
                "duration": 180
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Rain Sounds",
                "url": "https://assets.mixkit.co/active_storage/sfx/2410/2410-preview.mp3",
                "category": "nature",
                "duration": 240
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Forest Ambience",
                "url": "https://assets.mixkit.co/active_storage/sfx/2459/2459-preview.mp3",
                "category": "nature",
                "duration": 200
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Peaceful Piano",
                "url": "https://assets.mixkit.co/active_storage/sfx/2458/2458-preview.mp3",
                "category": "meditation",
                "duration": 220
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Calm Meditation",
                "url": "https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3",
                "category": "meditation",
                "duration": 300
            }
        ]
        
        if default_tracks:
            await db.audio_tracks.insert_many(default_tracks)
        
        return [AudioTrack(**track) for track in default_tracks]
    
    return tracks


# ============= DASHBOARD =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard statistics"""
    mood_count = await db.mood_entries.count_documents({"user_id": current_user['id']})
    journal_count = await db.journal_entries.count_documents({"user_id": current_user['id']})
    game_count = await db.game_scores.count_documents({"user_id": current_user['id']})
    chat_count = await db.chat_history.count_documents({"user_id": current_user['id']})
    
    recent_mood = await db.mood_entries.find_one(
        {"user_id": current_user['id']}, 
        {"_id": 0}, 
        sort=[("timestamp", -1)]
    )
    
    return {
        "total_mood_entries": mood_count,
        "total_journal_entries": journal_count,
        "total_games_played": game_count,
        "total_chat_messages": chat_count,
        "recent_mood": recent_mood['mood'] if recent_mood else None,
        "user_name": current_user['name']
    }


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()