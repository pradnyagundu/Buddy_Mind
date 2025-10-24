import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BreathingExercise from '../components/games/BreathingExercise';
import MemoryGame from '../components/games/MemoryGame';
import PuzzleGame from '../components/games/PuzzleGame';
import ColoringTherapy from '../components/games/ColoringTherapy';
import { Wind, Brain, Puzzle, Palette } from 'lucide-react';

const Games = () => {
  const [activeGame, setActiveGame] = useState('breathing');

  const games = [
    {
      id: 'breathing',
      name: 'Breathing Exercise',
      description: 'Calm your mind with guided breathing',
      icon: Wind,
      color: 'from-blue-400 to-cyan-400',
      component: BreathingExercise
    },
    {
      id: 'memory',
      name: 'Memory Game',
      description: 'Exercise your brain with card matching',
      icon: Brain,
      color: 'from-purple-400 to-pink-400',
      component: MemoryGame
    },
    {
      id: 'puzzle',
      name: 'Word Search',
      description: 'Find calming words in the grid',
      icon: Puzzle,
      color: 'from-green-400 to-teal-400',
      component: PuzzleGame
    },
    {
      id: 'coloring',
      name: 'Coloring Therapy',
      description: 'Express yourself through colors',
      icon: Palette,
      color: 'from-orange-400 to-red-400',
      component: ColoringTherapy
    }
  ];

  return (
    <div className="p-8 animate-fadeIn" data-testid="games-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Stress-Relief Games</h1>
          <p className="text-gray-600">Take a break and relax with these mindful activities</p>
        </div>

        {/* Game Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card
                key={game.id}
                className={`cursor-pointer card-hover ${
                  activeGame === game.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                }`}
                onClick={() => setActiveGame(game.id)}
                data-testid={`game-card-${game.id}`}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${game.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{game.name}</CardTitle>
                  <CardDescription className="text-sm">{game.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Active Game */}
        <Card className="border-2">
          <CardContent className="p-6">
            {games.map((game) => {
              const Component = game.component;
              return activeGame === game.id ? <Component key={game.id} /> : null;
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Games;