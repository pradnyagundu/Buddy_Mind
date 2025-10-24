import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mic, MicOff, Save, Trash2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VoiceJournal = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchJournals();
    initializeSpeechRecognition();
  }, []);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.');
        } else {
          toast.error(`Error: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        }
      };
    } else {
      toast.error('Speech recognition is not supported in your browser');
    }
  };

  const fetchJournals = async () => {
    try {
      const response = await axios.get(`${API}/journals?limit=20`);
      setJournals(response.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Recording started - Speak now!');
      } else {
        toast.error('Speech recognition not available');
      }
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      toast.error('Please write or record something first');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/journals`, {
        content: transcript,
        is_voice: isRecording || transcript.includes('[Voice]'),
        tags: []
      });

      toast.success('Journal entry saved! 📓');
      setTranscript('');
      fetchJournals();
    } catch (error) {
      console.error('Error saving journal:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/journals/${id}`);
      toast.success('Journal entry deleted');
      fetchJournals();
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Failed to delete journal entry');
    }
  };

  return (
    <div className="p-8 animate-fadeIn" data-testid="voice-journal-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Voice Journal</h1>
          <p className="text-gray-600">Speak your mind or write your thoughts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Entry */}
          <div className="lg:col-span-2">
            <Card data-testid="journal-entry-card">
              <CardHeader>
                <CardTitle>Create Journal Entry</CardTitle>
                <CardDescription>
                  {isRecording ? (
                    <span className="flex items-center text-red-500">
                      <span className="animate-pulse mr-2">•</span>
                      Recording... Speak now
                    </span>
                  ) : (
                    'Click the microphone to start voice recording'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Voice Control */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={toggleRecording}
                    className={`p-8 rounded-full transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse-gentle shadow-lg'
                        : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-md'
                    }`}
                    data-testid="voice-recording-button"
                  >
                    {isRecording ? (
                      <MicOff className="w-12 h-12 text-white" />
                    ) : (
                      <Mic className="w-12 h-12 text-white" />
                    )}
                  </button>
                </div>

                {/* Text Area */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Your Thoughts</label>
                  <Textarea
                    placeholder="Type or speak your journal entry..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={10}
                    className="w-full"
                    data-testid="journal-textarea"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSave}
                    disabled={loading || !transcript.trim()}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    size="lg"
                    data-testid="save-journal-button"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Saving...' : 'Save Entry'}
                  </Button>
                  <Button
                    onClick={() => setTranscript('')}
                    variant="outline"
                    size="lg"
                    data-testid="clear-journal-button"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Journals */}
          <div>
            <Card data-testid="recent-journals-card">
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
                <CardDescription>Your journal history</CardDescription>
              </CardHeader>
              <CardContent>
                {journals.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {journals.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {entry.is_voice ? (
                              <Mic className="w-4 h-4 text-purple-500" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-blue-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {format(new Date(entry.timestamp), 'MMM dd, hh:mm a')}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`delete-journal-${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">{entry.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No journal entries yet</p>
                    <p className="text-sm">Start journaling today!</p>
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

export default VoiceJournal;