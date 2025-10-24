import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Play, Pause } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BreathingExercise = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
  const [count, setCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [timer, setTimer] = useState(null);

  const phases = {
    inhale: { duration: 4, text: 'Breathe In', color: 'from-blue-400 to-cyan-400' },
    hold: { duration: 4, text: 'Hold', color: 'from-purple-400 to-pink-400' },
    exhale: { duration: 4, text: 'Breathe Out', color: 'from-green-400 to-teal-400' }
  };

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCount((prev) => {
          const nextCount = prev + 1;
          const currentPhase = phases[phase];
          
          if (nextCount > currentPhase.duration) {
            // Move to next phase
            if (phase === 'inhale') {
              setPhase('hold');
            } else if (phase === 'hold') {
              setPhase('exhale');
            } else if (phase === 'exhale') {
              setPhase('inhale');
              setCycles((c) => c + 1);
            }
            return 0;
          }
          return nextCount;
        });
      }, 1000);
      
      setTimer(interval);
      return () => clearInterval(interval);
    } else {
      if (timer) clearInterval(timer);
    }
  }, [isActive, phase]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('inhale');
    setCount(0);
    toast.success('Breathing exercise started. Follow the rhythm!');
  };

  const handleStop = async () => {
    setIsActive(false);
    if (timer) clearInterval(timer);
    
    if (cycles > 0) {
      try {
        await axios.post(`${API}/games/scores`, {
          game_type: 'breathing',
          score: cycles * 10,
          duration: cycles * 12,
          completed: true
        });
        toast.success(`Great job! You completed ${cycles} breathing cycles 🌿`);
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }
    
    setCycles(0);
    setCount(0);
    setPhase('inhale');
  };

  const currentPhase = phases[phase];
  const scale = isActive ? (phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 1) : 1;

  return (
    <div className="text-center" data-testid="breathing-exercise">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Breathing Exercise</h2>
      <p className="text-gray-600 mb-8">Follow the circle's rhythm to calm your mind</p>

      {/* Breathing Circle */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div
          className={`w-64 h-64 rounded-full bg-gradient-to-br ${currentPhase.color} flex items-center justify-center shadow-2xl transition-all duration-[4000ms] ease-in-out`}
          style={{
            transform: `scale(${scale})`,
            opacity: isActive ? 1 : 0.7
          }}
        >
          <div className="text-white text-center">
            <div className="text-4xl font-bold mb-2">{currentPhase.text}</div>
            {isActive && (
              <div className="text-6xl font-bold">{currentPhase.duration - count}</div>
            )}
          </div>
        </div>
        
        {isActive && (
          <div className="mt-6 text-gray-600">
            <p className="text-lg">Cycles completed: <span className="font-bold text-purple-600">{cycles}</span></p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isActive ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            data-testid="start-breathing-button"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Exercise
          </Button>
        ) : (
          <Button
            onClick={handleStop}
            size="lg"
            variant="destructive"
            data-testid="stop-breathing-button"
          >
            <Pause className="w-5 h-5 mr-2" />
            Stop Exercise
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left max-w-md mx-auto">
        <h3 className="font-semibold text-gray-800 mb-2">🧘 How to Practice:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Click "Start Exercise" to begin</li>
          <li>Breathe in for 4 seconds as the circle expands</li>
          <li>Hold your breath for 4 seconds</li>
          <li>Breathe out for 4 seconds as the circle contracts</li>
          <li>Repeat for several cycles to feel calm</li>
        </ol>
      </div>
    </div>
  );
};

export default BreathingExercise;