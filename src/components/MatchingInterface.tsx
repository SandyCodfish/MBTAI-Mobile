import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, Heart } from 'lucide-react';
import { API_URL } from '../config';

interface MatchingInterfaceProps {
  currentUser: any;
  match: any;
  onCompleteMeeting: () => void;
  onReturnHome: () => void;
}

const MatchingInterface: React.FC<MatchingInterfaceProps> = ({
  currentUser,
  match,
  onCompleteMeeting,
  onReturnHome
}) => {
  const [distance, setDistance] = useState(match.distance);
  const [canMeet, setCanMeet] = useState(false);
  const [meetingCompleted, setMeetingCompleted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  // Refs to prevent concurrent requests
  const isUpdatingDistanceRef = useRef(false);
  const isCompletingMeetingRef = useRef(false);

  // Update distance every 8 seconds with better debouncing
  useEffect(() => {
    const updateDistance = async () => {
      if (isUpdatingDistanceRef.current) return;
      isUpdatingDistanceRef.current = true;
      
      try {
        const response = await fetch(`${API_URL}/api/current-match/${currentUser.id}`);
        const data = await response.json();
        
        if (data.hasMatch) {
          setDistance(data.match.distance);
          setCanMeet(data.match.distance <= 10);
          setUpdateError(null);
        } else {
          // Match no longer exists, go back to dashboard
          onReturnHome();
        }
      } catch (error) {
        console.error('Error updating distance:', error);
        setUpdateError('Failed to update distance');
      } finally {
        // Add delay before allowing next update
        setTimeout(() => {
          isUpdatingDistanceRef.current = false;
        }, 2000);
      }
    };

    updateDistance();
    const interval = setInterval(updateDistance, 8000); // Increased to 8 seconds
    return () => clearInterval(interval);
  }, [currentUser.id, onReturnHome]);

  const handleCompleteMeeting = async () => {
    if (!canMeet || isCompletingMeetingRef.current) return;
    
    isCompletingMeetingRef.current = true;
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/complete-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Meeting completed successfully:', result);
        setMeetingCompleted(true);
        onCompleteMeeting();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to complete meeting');
      }
    } catch (error) {
      console.error('Error completing meeting:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to complete meeting');
    } finally {
      setIsUpdating(false);
      // Add delay before allowing next completion attempt
      setTimeout(() => {
        isCompletingMeetingRef.current = false;
      }, 3000);
    }
  };

  if (meetingCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting Completed!</h2>
          <p className="text-gray-600 mb-6">
            Great job! You've successfully met with your match. Good luck with your new connection!
          </p>
          <button
            onClick={onReturnHome}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
          >
            Continue Meeting
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">It's a Match!</h1>
                <p className="text-sm text-gray-600">You and {match.otherUser.mbtiType} are connecting</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{distance}m away</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Match Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {match.otherUser.mbtiType}
            </h2>
            <p className="text-gray-600">Your match is nearby!</p>
          </div>

          {/* Distance Indicator */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{distance}m</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  distance <= 10 
                    ? 'bg-green-500' 
                    : distance <= 50 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, 100 - (distance / 100) * 100))}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {distance <= 10 
                ? "You're close enough to meet!" 
                : distance <= 50 
                ? "Getting closer..." 
                : "Keep moving towards each other"
              }
            </p>
          </div>

          {/* Error Message */}
          {updateError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-600 text-sm">{updateError}</p>
            </div>
          )}

          {/* Meeting Button */}
          <div className="text-center">
            {canMeet ? (
              <button
                onClick={handleCompleteMeeting}
                disabled={isUpdating || isCompletingMeetingRef.current}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Completing...' : 'Met!'}
              </button>
            ) : (
              <div className="bg-gray-100 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  Get within 10 meters of each other to complete your meeting
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>Current distance: {distance}m</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works:</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">1</span>
              </div>
              <p>Move towards each other until you're within 10 meters</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">2</span>
              </div>
              <p>Both of you need to press "Met!" to complete the meeting</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 font-semibold text-xs">3</span>
              </div>
              <p>After meeting, you can continue using the app to find more connections</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchingInterface; 