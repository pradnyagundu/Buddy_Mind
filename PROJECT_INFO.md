# Buddy Mind Flow - Mental Wellness Platform

## 🌟 Overview
Buddy Mind Flow is a comprehensive mental health and wellness application designed to help users track their emotional well-being, practice mindfulness, and reduce stress through interactive activities.

## ✨ Features

### 1. **Dashboard** 📊
- Real-time statistics of mood entries, journal entries, and games played
- Wellness score calculation
- Mood distribution visualization
- Game activity tracking
- Daily wellness tips

### 2. **Mood Tracker** 💝
- Track 6 different moods: Happy, Calm, Sad, Anxious, Stressed, Peaceful
- Intensity slider (1-10 scale)
- Optional notes for each mood entry
- Visual mood history with timestamps
- Mood pattern analysis

### 3. **Voice Journal** 🎤
- **Voice Input Feature**: Record journal entries using microphone
- Web Speech API integration for real-time voice-to-text transcription
- Manual text entry option
- Journal history with timestamps
- Voice/text entry indicators
- Delete functionality for journal entries

### 4. **Stress-Relief Games** 🎮

#### a. Breathing Exercise
- Guided breathing with visual animation
- 4-4-4 breathing pattern (inhale-hold-exhale)
- Cycle tracking
- Calming visual feedback

#### b. Memory Card Game
- Match 8 pairs of relaxing emojis
- Move counter and match tracking
- Score calculation based on performance
- "New Game" reset functionality

#### c. Word Search Puzzle
- Find calming words: PEACE, CALM, RELAX, HAPPY, ZEN
- 10x10 grid with random letter placement
- Word highlighting when found
- Timer-based scoring

#### d. Coloring Therapy
- Digital canvas with drawing tools
- 12 color palette + eraser
- Adjustable brush size (2-30px)
- Pre-drawn templates (circle, heart, star, flower, waves)
- Download artwork feature
- Art therapy tips included

### 5. **Calming Soundtracks** 🎵
- 5 pre-loaded relaxing audio tracks:
  - Ocean Waves (Nature)
  - Rain Sounds (Nature)
  - Forest Ambience (Nature)
  - Peaceful Piano (Meditation)
  - Calm Meditation (Meditation)
- Full audio player controls (play, pause, next, previous)
- Progress bar with time display
- Volume control
- Visual track categories
- Benefits of sound therapy information

## 🛠️ Technical Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Features**:
  - RESTful API architecture
  - UUID-based identifiers (no ObjectID)
  - Async/await operations
  - CORS enabled
  - Comprehensive error handling

### Frontend
- **Framework**: React 19
- **UI Components**: Radix UI (shadcn/ui)
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **APIs Used**:
  - Web Speech API (for voice recording)
  - Canvas API (for coloring therapy)
  - Audio API (for soundtracks)
- **State Management**: React Hooks
- **HTTP Client**: Axios

## 📡 API Endpoints

### Mood Tracking
- `POST /api/moods` - Create mood entry
- `GET /api/moods` - Get recent mood entries
- `GET /api/moods/stats` - Get mood statistics

### Journal
- `POST /api/journals` - Create journal entry
- `GET /api/journals` - Get recent journal entries
- `DELETE /api/journals/{id}` - Delete journal entry

### Games
- `POST /api/games/scores` - Save game score
- `GET /api/games/scores` - Get game scores (with optional filter)
- `GET /api/games/stats` - Get overall game statistics

### Audio
- `GET /api/audio/tracks` - Get all audio tracks
- `POST /api/audio/tracks` - Add new audio track

### Dashboard
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics

## 🚀 Running the Application

### Backend
```bash
cd /app/backend
# Install dependencies
pip install -r requirements.txt

# Start server (automatically handled by supervisor)
sudo supervisorctl restart backend
```

### Frontend
```bash
cd /app/frontend
# Install dependencies
yarn install

# Start development server
yarn start
```

### Database
MongoDB runs automatically via supervisor on localhost:27017

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main app component
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── ui/                # Radix UI components
│   │   │   └── games/             # Game components
│   │   │       ├── BreathingExercise.jsx
│   │   │       ├── MemoryGame.jsx
│   │   │       ├── PuzzleGame.jsx
│   │   │       └── ColoringTherapy.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx      # Dashboard page
│   │       ├── MoodTracker.jsx    # Mood tracking
│   │       ├── VoiceJournal.jsx   # Voice journaling
│   │       ├── Games.jsx          # Games hub
│   │       └── AudioPlayer.jsx    # Audio player
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment
│
└── PROJECT_INFO.md       # This file
```

## 🎨 Design Features

- **Gradient Backgrounds**: Soothing purple-blue-pink gradients
- **Card-based Layout**: Modern card design with hover effects
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Fade-in effects and transitions
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Test IDs**: All interactive elements have data-testid attributes

## 🔒 Data Privacy

- All data stored locally in MongoDB
- No external data sharing
- User data stays on the server
- Secure API endpoints

## 🌈 Color Palette

- Primary: Purple (#8B5CF6) to Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Danger: Red (#EF4444)
- Calm: Teal (#14B8A6)

## 📝 Key Features Highlights

### Voice Input 🎤
- Real-time speech recognition
- Continuous recording with auto-restart
- Visual recording indicator
- Error handling for browser compatibility
- Combined with text input option

### Games Scoring System 🏆
- Each game tracks performance
- Scores saved to database
- Statistics displayed on dashboard
- Time tracking for puzzle games
- Cycle/move counting

### Audio Player 🎵
- Embedded free audio tracks
- Full playback controls
- Auto-play next track
- Volume control with slider
- Visual feedback for currently playing track

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://[your-domain].preview.emergentagent.com
WDS_SOCKET_PORT=443
```

## 📱 Browser Compatibility

- **Voice Recognition**: Chrome, Edge (requires webkitSpeechRecognition)
- **Canvas Drawing**: All modern browsers
- **Audio Player**: All modern browsers
- **General UI**: All modern browsers

## 🎯 Future Enhancement Ideas

1. User authentication and profiles
2. Social features (share progress, achievements)
3. More games (Sudoku, Crossword, etc.)
4. Integration with music streaming APIs
5. Export data as PDF reports
6. Meditation timer with guided sessions
7. Daily/weekly challenges
8. Push notifications for reminders
9. Dark mode toggle
10. Multi-language support

## 🤝 Contributing

This is a mental wellness platform designed to help people manage stress and improve their mental health through interactive activities and tracking.

## 📄 License

This project is built for mental wellness and stress relief purposes.

---

**Built with ❤️ for mental wellness and peace of mind** 🧘‍♀️✨




supervisorctl -c supervisord.conf stop backend
supervisord -c supervisord.conf

supervisorctl -c supervisord.conf restart backend


cd /Users/pradnya/Desktop/app/frontend
yarn install
yarn start

