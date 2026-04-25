import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Users, MessageCircle, Settings, LogOut, Eye, EyeOff } from 'lucide-react';
import { User, PotentialMatch } from '../types/user';
import NearbyMatches from './NearbyMatches';
import ProfileSettings from './ProfileSettings';
import { generateMockMatches } from '../utils/mockData';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  testNearby?: boolean;
  realNearbyCount?: number;
  realNearbyUsers?: any[];
  onMatchFound?: (match: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, testNearby, realNearbyCount = 0, realNearbyUsers = [], onMatchFound }) => {
  const [activeTab, setActiveTab] = useState<'nearby' | 'profile'>('nearby');
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [isVisible, setIsVisible] = useState(user.isVisible);

  // Remove the old fetchNearbyUsers effect since we're now getting data from App.tsx
  // useEffect(() => {
  //   const fetchNearbyUsers = async () => {
  //     try {
  //       // Get current location first
  //       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
  //         navigator.geolocation.getCurrentPosition(resolve, reject, {
  //           enableHighAccuracy: false,
  //           timeout: 10000,
  //           maximumAge: 60000
  //         });
  //       });

  //       const response = await fetch('http://localhost:3001/api/nearby-users', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           id: user.id,
  //           latitude: position.coords.latitude,
  //           longitude: position.coords.longitude,
  //         }),
  //       });

  //       if (response.ok) {
  //         const nearbyUsers = await response.json();
  //         setRealUsers(nearbyUsers);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching nearby users:', error);
  //     }
  //   };

  //   if (activeTab === 'nearby') {
  //     fetchNearbyUsers();
  //     const interval = setInterval(fetchNearbyUsers, 10000);
  //     return () => clearInterval(interval);
  //   }
  // }, [user.id, activeTab]);

  useEffect(() => {
    // Simulate finding nearby matches
    const mockMatches = generateMockMatches(user);
    setMatches(mockMatches);
  }, [user]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    // In a real app, this would update the backend
    const updatedUser = { ...user, isVisible: !isVisible };
    localStorage.setItem('mbti-user', JSON.stringify(updatedUser));
  };

  // Convert real users to PotentialMatch format with memoization to prevent flickering
  const realUserMatches: PotentialMatch[] = useMemo(() => {
    return realNearbyUsers.map(user => {
      console.log('Processing real user:', user);
      
      // Use user ID to generate consistent random values (same user = same values)
      const seed = user.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const random1 = (seed * 9301 + 49297) % 233280;
      const random2 = (random1 * 9301 + 49297) % 233280;
      
      // Calculate distance from current user (consistent for same user)
      const distance = Math.floor((random1 / 233280) * 100) + 10; // Consistent distance 10-110m
      
      // Generate compatibility score based on MBTI compatibility (consistent for same user)
      const compatibilityScore = Math.floor((random2 / 233280) * 40) + 60; // Consistent compatibility 60-100%
      
      // Mock shared interests based on MBTI type
      const sharedInterests = ['Technology', 'Travel', 'Music', 'Reading', 'Sports'];
      
      return {
        id: user.id,
        mbtiType: user.mbtiType || 'UNKNOWN',
        compatibilityScore,
        sharedInterests: sharedInterests.slice(0, 3), // Take first 3 interests
        distance,
        openness: 'very-open',
        nearbyContext: 'Nearby',
        // Add backend data for reference
        backendData: user
      };
    });
  }, [realNearbyUsers]); // Only recalculate when realNearbyUsers changes

  // Combine real users with mock matches
  const allMatches = useMemo(() => {
    return [...realUserMatches, ...matches];
  }, [realUserMatches, matches]);

  console.log('Real nearby users count:', realNearbyUsers.length);
  console.log('Real user matches:', realUserMatches);
  console.log('All matches (real + mock):', allMatches);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MBTAI</h1>
                <p className="text-sm text-gray-600">Welcome back, {user.email.split('@')[0]}!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Visible to others:</span>
                <button
                  onClick={toggleVisibility}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isVisible
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-1 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'nearby'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Nearby Vibes ({realNearbyCount})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Profile
          </button>
        </div>
        {/* Tab Content */}
        {activeTab === 'nearby' ? (
          <NearbyMatches matches={allMatches} user={user} onMatchFound={onMatchFound} />
        ) : (
          <ProfileSettings user={user} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;