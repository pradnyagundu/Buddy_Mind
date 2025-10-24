import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Trophy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const emojis = ['🌿', '🌸', '🌺', '🌻', '✨', '🌈', '🦋', '🌼'];

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(false);
    setStartTime(null);
  };

  const handleCardClick = (index) => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].emoji)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, cards[first].emoji]);
        setFlipped([]);
        
        // Check if game is complete
        if (matched.length + 1 === emojis.length) {
          setTimeout(() => handleGameComplete(), 500);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const handleGameComplete = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(100 - moves * 5, 10);
    
    try {
      await axios.post(`${API}/games/scores`, {
        game_type: 'memory',
        score: score,
        duration: duration,
        completed: true
      });
      toast.success(`🎉 Congratulations! You completed it in ${moves} moves and ${duration} seconds!`);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  return (
    <div data-testid="memory-game">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Memory Card Game</h2>
        <p className="text-gray-600 mb-4">Match all the pairs to complete the game</p>
        
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Moves</p>
            <p className="text-2xl font-bold text-purple-600">{moves}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Matched</p>
            <p className="text-2xl font-bold text-green-600">{matched.length}/{emojis.length}</p>
          </div>
        </div>

        <Button
          onClick={initializeGame}
          variant="outline"
          size="sm"
          data-testid="reset-memory-game-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto">
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(card.emoji);
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`aspect-square rounded-xl text-5xl flex items-center justify-center transition-all duration-300 transform ${
                isFlipped
                  ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white scale-105 shadow-lg'
                  : 'bg-gradient-to-br from-gray-200 to-gray-300 hover:scale-105 hover:shadow-md'
              }`}
              disabled={isFlipped && !flipped.includes(index)}
              data-testid={`memory-card-${index}`}
            >
              {isFlipped ? card.emoji : '?'}
            </button>
          );
        })}
      </div>

      {matched.length === emojis.length && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg text-center animate-fadeIn">
          <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-800">Awesome Job!</h3>
          <p className="text-gray-600">You completed the game in {moves} moves!</p>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;