import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PuzzleGame = () => {
  const [grid, setGrid] = useState([]);
  const [found, setFound] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const words = ['PEACE', 'CALM', 'RELAX', 'HAPPY', 'ZEN'];
  const gridSize = 10;

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newGrid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill('').map(() => 
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      )
    );

    // Place words in grid
    words.forEach(word => {
      const placed = placeWord(newGrid, word);
      if (!placed) {
        console.log(`Could not place word: ${word}`);
      }
    });

    setGrid(newGrid);
    setFound([]);
    setSelectedCells([]);
    setGameStarted(false);
    setStartTime(null);
  };

  const placeWord = (grid, word) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal
    ];

    for (let attempt = 0; attempt < 50; attempt++) {
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);

      if (canPlaceWord(grid, word, row, col, dir)) {
        placeWordInGrid(grid, word, row, col, dir);
        return true;
      }
    }
    return false;
  };

  const canPlaceWord = (grid, word, row, col, dir) => {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + dir[0] * i;
      const newCol = col + dir[1] * i;
      
      if (newRow >= gridSize || newCol >= gridSize) {
        return false;
      }
    }
    return true;
  };

  const placeWordInGrid = (grid, word, row, col, dir) => {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + dir[0] * i;
      const newCol = col + dir[1] * i;
      grid[newRow][newCol] = word[i];
    }
  };

  const handleCellClick = (row, col) => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    const cellId = `${row}-${col}`;
    const newSelected = [...selectedCells, cellId];
    setSelectedCells(newSelected);

    // Check if selected cells form a word
    const selectedWord = newSelected.map(id => {
      const [r, c] = id.split('-').map(Number);
      return grid[r][c];
    }).join('');

    if (words.includes(selectedWord) && !found.includes(selectedWord)) {
      setFound([...found, selectedWord]);
      toast.success(`Found: ${selectedWord}! 🎉`);
      setSelectedCells([]);
      
      if (found.length + 1 === words.length) {
        handleGameComplete();
      }
    } else if (newSelected.length > 6) {
      setSelectedCells([]);
    }
  };

  const handleGameComplete = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(100 - duration, 10);
    
    try {
      await axios.post(`${API}/games/scores`, {
        game_type: 'puzzle',
        score: score,
        duration: duration,
        completed: true
      });
      toast.success(`🎉 All words found in ${duration} seconds!`);
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  return (
    <div data-testid="puzzle-game">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Word Search</h2>
        <p className="text-gray-600 mb-4">Find all the calming words in the grid</p>
        
        <div className="mb-4">
          <div className="flex justify-center flex-wrap gap-2 mb-3">
            {words.map(word => (
              <span
                key={word}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  found.includes(word)
                    ? 'bg-green-500 text-white line-through'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {word}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-500">
            Found: <span className="font-bold text-green-600">{found.length}/{words.length}</span>
          </p>
        </div>

        <Button
          onClick={initializeGame}
          variant="outline"
          size="sm"
          data-testid="reset-puzzle-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          New Puzzle
        </Button>
      </div>

      {/* Grid */}
      <div className="max-w-2xl mx-auto">
        <div className="inline-block border-2 border-gray-300 rounded-lg overflow-hidden">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const isSelected = selectedCells.includes(cellId);
                
                return (
                  <button
                    key={colIndex}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 border border-gray-200 font-bold text-sm sm:text-base transition-colors ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid={`puzzle-cell-${rowIndex}-${colIndex}`}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {found.length === words.length && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg text-center animate-fadeIn">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
          <h3 className="text-xl font-bold text-gray-800">Perfect!</h3>
          <p className="text-gray-600">You found all the words!</p>
        </div>
      )}
    </div>
  );
};

export default PuzzleGame;