import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import VoiceJournal from './pages/VoiceJournal';
import Games from './pages/Games';
import AudioPlayer from './pages/AudioPlayer';
import Sidebar from './components/Sidebar';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="App">
      <BrowserRouter>
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
          
          <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-16'
          }`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/mood" element={<MoodTracker />} />
              <Route path="/journal" element={<VoiceJournal />} />
              <Route path="/games" element={<Games />} />
              <Route path="/audio" element={<AudioPlayer />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;