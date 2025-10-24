import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, Send, Bot, User, Heart, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AITherapist = () => {
  const { getAuthHeader, user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history?limit=50`, {
        headers: getAuthHeader()
      });
      setChatHistory(response.data.reverse());
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);

    // Optimistically add user message to UI
    const tempMessage = {
      id: 'temp-' + Date.now(),
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isLoading: true
    };
    setChatHistory(prev => [...prev, tempMessage]);

    try {
      const response = await axios.post(
        `${API}/chat`,
        { message: userMessage },
        { headers: getAuthHeader() }
      );

      // Replace temp message with real response
      setChatHistory(prev => {
        const filtered = prev.filter(msg => msg.id !== tempMessage.id);
        return [...filtered, response.data];
      });

      // Show supportive message if sentiment is negative
      if (response.data.sentiment?.needs_attention) {
        toast.info('Remember, you can reach out to your emergency contacts if you need immediate support 💜');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setChatHistory(prev => prev.filter(msg => msg.id !== tempMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'gray';
    if (sentiment.sentiment === 'positive') return 'green';
    if (sentiment.sentiment === 'negative') return 'red';
    return 'yellow';
  };

  const getSentimentEmoji = (sentiment) => {
    if (!sentiment) return '😊';
    const emotion = sentiment.emotion;
    const emojis = {
      happy: '😊',
      sad: '😢',
      anxious: '😰',
      calm: '😌',
      stressed: '😫',
      neutral: '😐'
    };
    return emojis[emotion] || '😊';
  };

  if (fetchingHistory) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fadeIn h-screen flex flex-col" data-testid="ai-therapist-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">AI Therapist</h1>
            <p className="text-gray-600">Your personal mental health companion</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col" data-testid="chat-container">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chat with Your Therapist</CardTitle>
              <CardDescription>
                Share your thoughts freely. Everything is confidential and analyzed to support you better.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {chatHistory.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-purple-500 opacity-50" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Conversation</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Hi {user?.name}! I'm here to listen and support you. Feel free to share anything on your mind.
                </p>
                <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                  <p className="text-sm text-gray-600">You can talk about:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• How you're feeling today</li>
                    <li>• Challenges you're facing</li>
                    <li>• Things that worry you</li>
                    <li>• Your goals and achievements</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="max-w-[70%]">
                        <div className="flex items-start justify-end space-x-2 mb-1">
                          <div>
                            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                              <p className="text-sm">{chat.message}</p>
                            </div>
                            {chat.sentiment && (
                              <div className="flex items-center justify-end space-x-2 mt-1 text-xs text-gray-500">
                                <span>{getSentimentEmoji(chat.sentiment)}</span>
                                <span className="capitalize">{chat.sentiment.emotion}</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Response */}
                    {chat.isLoading ? (
                      <div className="flex justify-start">
                        <div className="max-w-[70%]">
                          <div className="flex items-start space-x-2">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-full flex-shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[70%]">
                          <div className="flex items-start space-x-2 mb-1">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-full flex-shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{chat.response}</p>
                              </div>
                              <p className="text-xs text-gray-400 mt-1 ml-2">
                                {format(new Date(chat.timestamp), 'MMM dd, hh:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex space-x-3">
              <Textarea
                placeholder="Share what's on your mind..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                className="flex-1 resize-none"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || loading}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                size="lg"
                data-testid="send-message-button"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              Your conversation is private and secure
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-4 bg-gradient-to-r from-purple-100 to-blue-100 border-none">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">AI-Powered Sentiment Analysis</h4>
              <p className="text-sm text-gray-700">
                Your messages are analyzed to understand your emotional state and provide better support. 
                If you're experiencing a crisis, please reach out to your emergency contacts immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITherapist;
