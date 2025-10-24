import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Heart, Smile, Frown, Meh, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [intensity, setIntensity] = useState([5]);
  const [note, setNote] = useState('');
  const [recentMoods, setRecentMoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const moods = [
    { name: 'happy', emoji: '😊', color: 'from-yellow-400 to-orange-400', icon: Smile },
    { name: 'calm', emoji: '😌', color: 'from-blue-400 to-cyan-400', icon: Sparkles },
    { name: 'sad', emoji: '😢', color: 'from-blue-600 to-purple-600', icon: Frown },
    { name: 'anxious', emoji: '😰', color: 'from-orange-500 to-red-500', icon: Meh },
    { name: 'stressed', emoji: '😫', color: 'from-red-500 to-pink-500', icon: Frown },
    { name: 'peaceful', emoji: '🕊️', color: 'from-green-400 to-teal-400', icon: Heart },
  ];

  useEffect(() => {
    fetchRecentMoods();
  }, []);

  const fetchRecentMoods = async () => {
    try {
      const response = await axios.get(`${API}/moods?limit=10`);
      setRecentMoods(response.data);
    } catch (error) {
      console.error('Error fetching moods:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/moods`, {
        mood: selectedMood,
        intensity: intensity[0],
        note: note || null
      });

      toast.success('Mood recorded successfully! 🎉');
      setSelectedMood(null);
      setIntensity([5]);
      setNote('');
      fetchRecentMoods();
    } catch (error) {
      console.error('Error saving mood:', error);
      toast.error('Failed to save mood');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-fadeIn" data-testid="mood-tracker-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">How are you feeling today?</h1>
          <p className="text-gray-600">Track your emotional state and understand your patterns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Selection */}
          <div className="lg:col-span-2">
            <Card data-testid="mood-selection-card">
              <CardHeader>
                <CardTitle>Select Your Mood</CardTitle>
                <CardDescription>Choose the emotion that best describes how you feel right now</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {moods.map((mood) => {
                    const Icon = mood.icon;
                    return (
                      <button
                        key={mood.name}
                        onClick={() => setSelectedMood(mood.name)}
                        className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                          selectedMood === mood.name
                            ? `bg-gradient-to-br ${mood.color} text-white border-transparent shadow-lg scale-105`
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                        data-testid={`mood-${mood.name}-button`}
                      >
                        <div className="text-5xl mb-2">{mood.emoji}</div>
                        <div className="font-semibold capitalize">{mood.name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Intensity Slider */}
                {selectedMood && (
                  <div className="mb-6 animate-fadeIn">
                    <label className="block text-sm font-medium mb-3">
                      Intensity: <span className="text-purple-600 font-bold">{intensity[0]}/10</span>
                    </label>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      data-testid="intensity-slider"
                    />
                  </div>
                )}

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Add a note (optional)</label>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full"
                    data-testid="mood-note-textarea"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedMood || loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  size="lg"
                  data-testid="save-mood-button"
                >
                  {loading ? 'Saving...' : 'Save Mood Entry'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Moods */}
          <div>
            <Card data-testid="recent-moods-card">
              <CardHeader>
                <CardTitle>Recent Moods</CardTitle>
                <CardDescription>Your emotional journey</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMoods.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentMoods.map((entry) => {
                      const moodData = moods.find(m => m.name === entry.mood);
                      return (
                        <div
                          key={entry.id}
                          className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{moodData?.emoji}</span>
                              <span className="font-medium capitalize">{entry.mood}</span>
                            </div>
                            <span className="text-sm text-gray-500">{entry.intensity}/10</span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-600 mt-1">{entry.note}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(entry.timestamp), 'MMM dd, hh:mm a')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No mood entries yet</p>
                    <p className="text-sm">Start tracking your emotions!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;