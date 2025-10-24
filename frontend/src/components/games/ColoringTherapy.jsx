import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Palette, Eraser, Download, RefreshCw } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ColoringTherapy = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#8B5CF6');
  const [brushSize, setBrushSize] = useState(10);
  const [startTime, setStartTime] = useState(null);

  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6',
    '#F97316', '#84CC16', '#06B6D4', '#A855F7'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 400;
      
      // Draw initial template
      drawTemplate(ctx);
      setStartTime(Date.now());
    }
  }, []);

  const drawTemplate = (ctx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    
    // Draw some shapes as template
    // Circle
    ctx.beginPath();
    ctx.arc(150, 100, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    // Heart shape
    ctx.beginPath();
    ctx.moveTo(300, 150);
    ctx.bezierCurveTo(300, 130, 270, 110, 250, 110);
    ctx.bezierCurveTo(230, 110, 200, 130, 200, 150);
    ctx.bezierCurveTo(200, 170, 230, 190, 300, 230);
    ctx.bezierCurveTo(370, 190, 400, 170, 400, 150);
    ctx.bezierCurveTo(400, 130, 370, 110, 350, 110);
    ctx.bezierCurveTo(330, 110, 300, 130, 300, 150);
    ctx.stroke();
    
    // Star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = 500 + Math.cos(angle) * 50;
      const y = 100 + Math.sin(angle) * 50;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      
      const innerAngle = angle + Math.PI / 5;
      const innerX = 500 + Math.cos(innerAngle) * 25;
      const innerY = 100 + Math.sin(innerAngle) * 25;
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Flower
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      ctx.ellipse(150, 300, 30, 15, (Math.PI / 4) * i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(150, 300, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Wave pattern
    ctx.beginPath();
    for (let x = 380; x < 580; x += 20) {
      const y = 300 + Math.sin((x - 380) / 20) * 20;
      if (x === 380) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawTemplate(ctx);
    toast.success('Canvas cleared!');
  };

  const downloadDrawing = async () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'my-coloring-therapy.png';
    link.href = url;
    link.click();
    
    const duration = Math.floor((Date.now() - startTime) / 1000);
    
    try {
      await axios.post(`${API}/games/scores`, {
        game_type: 'coloring',
        score: 100,
        duration: duration,
        completed: true
      });
      toast.success('Your artwork has been downloaded! 🎨');
    } catch (error) {
      console.error('Error saving score:', error);
      toast.success('Your artwork has been downloaded!');
    }
  };

  return (
    <div data-testid="coloring-therapy">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Coloring Therapy</h2>
        <p className="text-gray-600 mb-4">Express yourself with colors and let your creativity flow</p>
      </div>

      {/* Color Palette */}
      <div className="mb-4 flex justify-center items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-600 mr-2">Colors:</span>
        {colors.map(color => (
          <button
            key={color}
            onClick={() => setCurrentColor(color)}
            className={`w-10 h-10 rounded-full transition-all ${
              currentColor === color ? 'ring-4 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-110'
            }`}
            style={{ backgroundColor: color }}
            data-testid={`color-${color}`}
          />
        ))}
        <button
          onClick={() => setCurrentColor('#FFFFFF')}
          className={`w-10 h-10 rounded-full border-2 border-gray-300 bg-white transition-all ${
            currentColor === '#FFFFFF' ? 'ring-4 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-110'
          }`}
          data-testid="color-eraser"
        >
          <Eraser className="w-5 h-5 mx-auto text-gray-600" />
        </button>
      </div>

      {/* Brush Size */}
      <div className="mb-4 flex justify-center items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Brush Size:</span>
        <input
          type="range"
          min="2"
          max="30"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-32"
          data-testid="brush-size-slider"
        />
        <span className="text-sm font-medium text-purple-600">{brushSize}px</span>
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="border-4 border-gray-300 rounded-lg shadow-lg cursor-crosshair bg-white"
          data-testid="coloring-canvas"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={clearCanvas}
          variant="outline"
          data-testid="clear-canvas-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          onClick={downloadDrawing}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          data-testid="download-drawing-button"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Artwork
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg text-left max-w-xl mx-auto">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-purple-600" />
          Art Therapy Tips:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Choose colors that represent your current mood</li>
          <li>• Let your hand move freely without overthinking</li>
          <li>• Focus on the process, not the result</li>
          <li>• Take your time and enjoy the moment</li>
        </ul>
      </div>
    </div>
  );
};

export default ColoringTherapy;