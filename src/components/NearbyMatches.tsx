import React, { useState } from 'react';
import { MessageCircle, Heart, Smile, Coffee, MapPin, Users, Sparkles } from 'lucide-react';
import { User, PotentialMatch } from '../types/user';
import { generateIcebreakers } from '../utils/icebreakers';
import { API_URL } from '../config';

interface NearbyMatchesProps {
  matches: PotentialMatch[];
  user: User;
  onMatchFound?: (match: any) => void;
}

const NearbyMatches: React.FC<NearbyMatchesProps> = ({ matches, user, onMatchFound }) => {
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [sentInteractions, setSentInteractions] = useState<Set<string>>(new Set());
  const [isSendingInteraction, setIsSendingInteraction] = useState<string | null>(null);

  const handleInteraction = async (matchId: string, type: 'wave' | 'smile' | 'coffee') => {
    if (isSendingInteraction) return;
    
    setIsSendingInteraction(`${matchId}-${type}`);
    
    try {
      const response = await fetch(`${API_URL}/api/send-interaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: user.id,
          toId: matchId,
          interactionType: type
        }),
      });
      
      const data = await response.json();
      
      if (data.isMatch && onMatchFound) {
        // Get the match details
        const matchResponse = await fetch(`${API_URL}/api/current-match/${user.id}`);
        const matchData = await matchResponse.json();
        if (matchData.hasMatch) {
          console.log('Match found via interaction:', matchData.match);
          onMatchFound(matchData.match);
        }
      }
      
      setSentInteractions(prev => new Set([...prev, `${matchId}-${type}`]));
    } catch (error) {
      console.error('Error sending interaction:', error);
    } finally {
      setIsSendingInteraction(null);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    return 'from-purple-500 to-pink-500';
  };

  const getDistanceText = (distance: number) => {
    if (distance < 50) return 'Very nearby';
    if (distance < 100) return 'Close by';
    if (distance < 200) return 'Walking distance';
    return 'In the area';
  };

  if (matches.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No compatible vibes nearby</h3>
        <p className="text-gray-600 mb-4">Try visiting popular spots like cafes, parks, or libraries to find personality-compatible people!</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
          <MapPin className="w-4 h-4" />
          Your visibility is {user.isVisible ? 'ON' : 'OFF'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{matches.length}</p>
              <p className="text-sm text-gray-600">Compatible nearby</p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{Math.round(matches.reduce((acc, m) => acc + m.compatibilityScore, 0) / matches.length)}%</p>
              <p className="text-sm text-gray-600">Avg compatibility</p>
            </div>
          </div>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.mbtiType}</p>
              <p className="text-sm text-gray-600">Your type</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => {
          // Special styling for TEST slot
          const isTestSlot = match.mbtiType === 'TEST';
          let testBg = '';
          if (isTestSlot) {
            // Use testSlotColor if present, fallback to red
            testBg = (match as any).testSlotColor === 'green'
              ? '!bg-green-200 !border-green-300'
              : '!bg-red-200 !border-red-300';
          }
          return (
            <div
              key={match.id}
              className={`${isTestSlot ? testBg : 'bg-white/80'} backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all border-2 ${
                (match as any).backendData ? 'border-green-300 shadow-green-100' : 'border-gray-200'
              }`}
            >
              {/* Compatibility Score */}
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${getCompatibilityColor(match.compatibilityScore)}`}>
                  {match.compatibilityScore}% match
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getDistanceText(match.distance)}
                </div>
              </div>

              {/* MBTI & Context */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-900">{match.mbtiType}</span>
                  {match.nearbyContext && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {match.nearbyContext}
                    </span>
                  )}
                  {/* Live indicator for real users */}
                  {(match as any).backendData && (
                    <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full font-medium animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Openness: <span className="capitalize">{match.openness.replace('-', ' ')}</span>
                </p>
              </div>

              {/* Shared Interests */}
              {match.sharedInterests.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Shared interests:</p>
                  <div className="flex flex-wrap gap-1">
                    {match.sharedInterests.slice(0, 3).map((interest) => (
                      <span key={interest} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                    {match.sharedInterests.length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{match.sharedInterests.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Interaction Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { type: 'wave', icon: MessageCircle, label: 'Wave', color: 'blue' },
                  { type: 'smile', icon: Smile, label: 'Smile', color: 'yellow' },
                  { type: 'coffee', icon: Coffee, label: 'Coffee?', color: 'green' }
                ].map(({ type, icon: Icon, label, color }) => {
                  const interactionKey = `${match.id}-${type}`;
                  const isSent = sentInteractions.has(interactionKey);
                  
                  const isSending = isSendingInteraction === `${match.id}-${type}`;
                  
                  return (
                    <button
                      key={type}
                      onClick={() => handleInteraction(match.id, type as any)}
                      disabled={isSent || isSending}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                        isSent
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : isSending
                          ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                          : `hover:bg-${color}-50 text-gray-700 hover:text-${color}-600 border border-gray-200 hover:border-${color}-200`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {isSent ? 'Sent!' : isSending ? 'Sending...' : label}
                    </button>
                  );
                })}
              </div>

              {/* AI Icebreakers Button */}
              <button
                onClick={() => setSelectedMatch(match)}
                className="w-full mt-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
              >
                View AI icebreakers
              </button>
            </div>
          );
        })}
      </div>

      {/* AI Icebreakers Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">AI Conversation Starters</h3>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900">{selectedMatch.mbtiType}</span>
                <span className={`px-2 py-1 rounded-full text-white text-xs bg-gradient-to-r ${getCompatibilityColor(selectedMatch.compatibilityScore)}`}>
                  {selectedMatch.compatibilityScore}% match
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Based on your shared interests and AI-powered personality compatibility
              </p>
            </div>

            <div className="space-y-3">
              {generateIcebreakers(user, selectedMatch).map((icebreaker, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">{icebreaker.text}</p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    Category: {icebreaker.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>AI Tip:</strong> Start with a gentle approach that matches their openness level. 
                Remember, they're "{selectedMatch.openness.replace('-', ' ')}" to conversations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyMatches;