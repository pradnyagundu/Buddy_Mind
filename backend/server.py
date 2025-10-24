from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Buddy Mind Flow API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============= MODELS =============

# Mood Tracking Models
class MoodEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mood: str  # happy, sad, anxious, calm, stressed, peaceful
    intensity: int  # 1-10 scale
    note: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MoodEntryCreate(BaseModel):
    mood: str
    intensity: int
    note: Optional[str] = None


# Journal Entry Models
class JournalEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    is_voice: bool = False
    tags: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JournalEntryCreate(BaseModel):
    content: str
    is_voice: bool = False
    tags: List[str] = []


# Game Score Models
class GameScore(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_type: str  # breathing, memory, puzzle, coloring
    score: int
    duration: Optional[int] = None  # seconds
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
    category: str  # nature, meditation, ambient, relaxing
    duration: Optional[int] = None

class AudioTrackCreate(BaseModel):
    title: str
    url: str
    category: str
    duration: Optional[int] = None


# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Welcome to Buddy Mind Flow API", "status": "active"}


# Mood Tracking Endpoints
@api_router.post("/moods", response_model=MoodEntry)
async def create_mood_entry(entry: MoodEntryCreate):
    """Record a new mood entry"""
    mood_obj = MoodEntry(**entry.model_dump())
    doc = mood_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.mood_entries.insert_one(doc)
    return mood_obj

@api_router.get("/moods", response_model=List[MoodEntry])
async def get_mood_entries(limit: int = 50):
    """Get recent mood entries"""
    entries = await db.mood_entries.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for entry in entries:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return entries

@api_router.get("/moods/stats")
async def get_mood_stats():
    """Get mood statistics"""
    entries = await db.mood_entries.find({}, {"_id": 0}).to_list(1000)
    
    if not entries:
        return {
            "total_entries": 0,
            "most_common_mood": None,
            "average_intensity": 0,
            "mood_distribution": {}
        }
    
    mood_counts = {}
    total_intensity = 0
    
    for entry in entries:
        mood = entry['mood']
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
        total_intensity += entry['intensity']
    
    most_common = max(mood_counts, key=mood_counts.get)
    
    return {
        "total_entries": len(entries),
        "most_common_mood": most_common,
        "average_intensity": round(total_intensity / len(entries), 2),
        "mood_distribution": mood_counts
    }


# Journal Endpoints
@api_router.post("/journals", response_model=JournalEntry)
async def create_journal_entry(entry: JournalEntryCreate):
    """Create a new journal entry (text or voice)"""
    journal_obj = JournalEntry(**entry.model_dump())
    doc = journal_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.journal_entries.insert_one(doc)
    return journal_obj

@api_router.get("/journals", response_model=List[JournalEntry])
async def get_journal_entries(limit: int = 20):
    """Get recent journal entries"""
    entries = await db.journal_entries.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for entry in entries:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
    
    return entries

@api_router.delete("/journals/{journal_id}")
async def delete_journal_entry(journal_id: str):
    """Delete a journal entry"""
    result = await db.journal_entries.delete_one({"id": journal_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    return {"message": "Journal entry deleted successfully"}


# Game Score Endpoints
@api_router.post("/games/scores", response_model=GameScore)
async def save_game_score(score: GameScoreCreate):
    """Save a game score"""
    score_obj = GameScore(**score.model_dump())
    doc = score_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.game_scores.insert_one(doc)
    return score_obj

@api_router.get("/games/scores", response_model=List[GameScore])
async def get_game_scores(game_type: Optional[str] = None, limit: int = 20):
    """Get game scores, optionally filtered by game type"""
    query = {"game_type": game_type} if game_type else {}
    scores = await db.game_scores.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    
    for score in scores:
        if isinstance(score['timestamp'], str):
            score['timestamp'] = datetime.fromisoformat(score['timestamp'])
    
    return scores

@api_router.get("/games/stats")
async def get_game_stats():
    """Get overall game statistics"""
    scores = await db.game_scores.find({}, {"_id": 0}).to_list(1000)
    
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


# Audio Track Endpoints
@api_router.get("/audio/tracks", response_model=List[AudioTrack])
async def get_audio_tracks():
    """Get all available audio tracks"""
    tracks = await db.audio_tracks.find({}, {"_id": 0}).to_list(100)
    
    # If no tracks in DB, return default embedded tracks
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
        
        # Store default tracks in DB
        if default_tracks:
            await db.audio_tracks.insert_many(default_tracks)
        
        return [AudioTrack(**track) for track in default_tracks]
    
    return tracks

@api_router.post("/audio/tracks", response_model=AudioTrack)
async def add_audio_track(track: AudioTrackCreate):
    """Add a new audio track"""
    track_obj = AudioTrack(**track.model_dump())
    doc = track_obj.model_dump()
    
    await db.audio_tracks.insert_one(doc)
    return track_obj


# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    mood_count = await db.mood_entries.count_documents({})
    journal_count = await db.journal_entries.count_documents({})
    game_count = await db.game_scores.count_documents({})
    
    # Get recent mood
    recent_mood = await db.mood_entries.find_one({}, {"_id": 0}, sort=[("timestamp", -1)])
    
    return {
        "total_mood_entries": mood_count,
        "total_journal_entries": journal_count,
        "total_games_played": game_count,
        "recent_mood": recent_mood['mood'] if recent_mood else None
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()