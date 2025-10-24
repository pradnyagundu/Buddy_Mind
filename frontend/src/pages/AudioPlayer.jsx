import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AudioPlayer = () => {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  const fetchTracks = async () => {
    try {
      const response = await axios.get(`${API}/audio/tracks`);
      setTracks(response.data);
      if (response.data.length > 0) {
        setCurrentTrack(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast.error('Failed to load audio tracks');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        toast.error('Failed to play audio. Please try another track.');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(false);
  };

  const playPrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(false);
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      nature: 'from-green-400 to-teal-400',
      meditation: 'from-purple-400 to-blue-400',
      ambient: 'from-blue-400 to-cyan-400',
      relaxing: 'from-pink-400 to-purple-400'
    };
    return colors[category] || 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-8 animate-fadeIn" data-testid="audio-player-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Calming Soundtracks</h1>
          <p className="text-gray-600">Relax with soothing sounds and peaceful melodies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player */}
          <div className="lg:col-span-2">
            <Card className="border-2" data-testid="audio-player-card">
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
                <CardDescription>
                  {currentTrack ? currentTrack.title : 'Select a track to begin'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentTrack && (
                  <>
                    {/* Album Art */}
                    <div className={`w-full h-64 rounded-lg bg-gradient-to-br ${
                      getCategoryColor(currentTrack.category)
                    } flex items-center justify-center mb-6 shadow-lg`}>
                      <Music className="w-24 h-24 text-white opacity-50" />
                    </div>

                    {/* Track Info */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">{currentTrack.title}</h3>
                      <p className="text-sm text-gray-500 capitalize">{currentTrack.category}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const audio = audioRef.current;
                          audio.currentTime = e.target.value;
                          setCurrentTime(e.target.value);
                        }}
                        className="w-full"
                        data-testid="progress-bar"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <Button
                        onClick={playPrevious}
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        data-testid="previous-button"
                      >
                        <SkipBack className="w-5 h-5" />
                      </Button>
                      
                      <Button
                        onClick={togglePlay}
                        size="icon"
                        className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        data-testid="play-pause-button"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </Button>
                      
                      <Button
                        onClick={playNext}
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        data-testid="next-button"
                      >
                        <SkipForward className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-3">
                      <Volume2 className="w-5 h-5 text-gray-600" />
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                        data-testid="volume-slider"
                      />
                      <span className="text-sm text-gray-600 w-12">{volume[0]}%</span>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio
                      ref={audioRef}
                      src={currentTrack.url}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Playlist */}
          <div>
            <Card data-testid="playlist-card">
              <CardHeader>
                <CardTitle>Playlist</CardTitle>
                <CardDescription>{tracks.length} tracks available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => selectTrack(track)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        currentTrack?.id === track.id
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      data-testid={`track-${track.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded bg-gradient-to-br ${
                          getCategoryColor(track.category)
                        } flex items-center justify-center flex-shrink-0`}>
                          <Music className={`w-5 h-5 ${
                            currentTrack?.id === track.id ? 'text-white' : 'text-white opacity-70'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{track.title}</p>
                          <p className={`text-xs capitalize ${
                            currentTrack?.id === track.id ? 'text-white opacity-90' : 'text-gray-500'
                          }`}>
                            {track.category}
                          </p>
                        </div>
                        {currentTrack?.id === track.id && isPlaying && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-4 bg-white animate-pulse"></div>
                            <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <Card className="mt-6 bg-gradient-to-r from-blue-100 to-purple-100 border-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Music className="w-5 h-5 mr-2 text-purple-600" />
              Benefits of Sound Therapy:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-medium mb-1">🧘 Reduces Stress</p>
                <p className="text-gray-600">Calming sounds lower cortisol levels</p>
              </div>
              <div>
                <p className="font-medium mb-1">😴 Improves Sleep</p>
                <p className="text-gray-600">Peaceful melodies promote better rest</p>
              </div>
              <div>
                <p className="font-medium mb-1">🧠 Enhances Focus</p>
                <p className="text-gray-600">Background sounds boost concentration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioPlayer;