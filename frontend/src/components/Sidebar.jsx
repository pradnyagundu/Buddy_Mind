import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Heart, 
  BookOpen, 
  Gamepad2, 
  Music, 
  ChevronLeft, 
  ChevronRight,
  Brain,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Heart, label: 'Mood Tracker', path: '/mood' },
    { icon: BookOpen, label: 'Voice Journal', path: '/journal' },
    { icon: MessageCircle, label: 'AI Therapist', path: '/chat' },
    { icon: Gamepad2, label: 'Stress Games', path: '/games' },
    { icon: Music, label: 'Soundtracks', path: '/audio' },
  ];

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-50',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">Buddy Mind</h1>
              <p className="text-xs text-gray-500">Flow</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto"
          data-testid="sidebar-toggle-button"
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-2 mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <div
                    className={cn(
                      'flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100',
                      !isOpen && 'justify-center'
                    )}
                    data-testid={`nav-${item.path.slice(1) || 'dashboard'}`}
                  >
                    <Icon className={cn('w-5 h-5', !isOpen && 'w-6 h-6')} />
                    {isOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Your mental wellness journey starts here</p>
          <p className="text-xs text-gray-500 mt-1">Take a moment to breathe ✨</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;