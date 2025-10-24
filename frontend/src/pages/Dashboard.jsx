import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, BookOpen, Gamepad2, TrendingUp, Smile, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState({
    total_mood_entries: 0,
    total_journal_entries: 0,
    total_games_played: 0,
    recent_mood: null
  });
  const [moodStats, setMoodStats] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, moodRes, gameRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/moods/stats`),
        axios.get(`${API}/games/stats`)
      ]);

      setStats(dashboardRes.data);
      setMoodStats(moodRes.data);
      setGameStats(gameRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    calm: '😌',
    stressed: '😫',
    peaceful: '🕊️'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fadeIn" data-testid="dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to Your Wellness Dashboard</h1>
        <p className="text-gray-600">Track your mental health journey and find peace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="card-hover border-l-4 border-l-pink-500" data-testid="mood-entries-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mood Entries</CardTitle>
            <Heart className="h-5 w-5 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_mood_entries}</div>
            {stats.recent_mood && (
              <p className="text-xs text-muted-foreground mt-2">
                Latest: {moodEmojis[stats.recent_mood]} {stats.recent_mood}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-blue-500" data-testid="journal-entries-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_journal_entries}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Voice & text combined
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-green-500" data-testid="games-played-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Gamepad2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_games_played}</div>
            {gameStats?.favorite_game && (
              <p className="text-xs text-muted-foreground mt-2">
                Favorite: {gameStats.favorite_game}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-purple-500" data-testid="overall-progress-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wellness Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.min(100, (stats.total_mood_entries + stats.total_journal_entries + stats.total_games_played) * 2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep it up! 🌟
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <Card data-testid="mood-distribution-card">
          <CardHeader>
            <CardTitle>Mood Distribution</CardTitle>
            <CardDescription>Your emotional patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {moodStats?.mood_distribution && Object.keys(moodStats.mood_distribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(moodStats.mood_distribution).map(([mood, count]) => (
                  <div key={mood} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{moodEmojis[mood] || '😐'}</span>
                      <span className="capitalize font-medium">{mood}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / moodStats.total_entries) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Smile className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start tracking your moods to see patterns</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Statistics */}
        <Card data-testid="game-statistics-card">
          <CardHeader>
            <CardTitle>Game Activity</CardTitle>
            <CardDescription>Your stress-relief progress</CardDescription>
          </CardHeader>
          <CardContent>
            {gameStats && gameStats.total_games_played > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Total Games</span>
                  <span className="text-lg font-bold text-purple-600">{gameStats.total_games_played}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Completed</span>
                  <span className="text-lg font-bold text-green-600">{gameStats.games_completed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Time Spent</span>
                  <span className="text-lg font-bold text-blue-600">{Math.floor(gameStats.total_time_spent / 60)} min</span>
                </div>
                {gameStats.game_distribution && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Game Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(gameStats.game_distribution).map(([game, count]) => (
                        <div key={game} className="flex justify-between text-sm">
                          <span className="capitalize">{game}</span>
                          <span className="font-medium">{count} plays</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Gamepad2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Play some games to reduce stress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="mt-6 bg-gradient-to-r from-purple-100 to-blue-100 border-none">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">💡 Daily Wellness Tips</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Take 5 minutes for deep breathing exercises</li>
            <li>• Journal your thoughts to clear your mind</li>
            <li>• Play a quick stress-relief game during breaks</li>
            <li>• Listen to calming sounds while working</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;