import React, { useState } from 'react';
import { User, Shield, Edit3, Save } from 'lucide-react';
import { User as UserType } from '../types/user';
import { getUserStorageKey } from '../storage';

interface ProfileSettingsProps {
  user: UserType;
}

const MBTI_TYPES = [
  'ENFP', 'ENFJ', 'ENTP', 'ENTJ',
  'ESFP', 'ESFJ', 'ESTP', 'ESTJ',
  'INFP', 'INFJ', 'INTP', 'INTJ',
  'ISFP', 'ISFJ', 'ISTP', 'ISTJ'
];

const INTERESTS = [
  'Coffee Culture', 'Hiking & Nature', 'Board Games', 'Reading', 'Art & Museums',
  'Live Music', 'Cooking', 'Photography', 'Fitness', 'Travel', 'Technology',
  'Movies & Series', 'Volunteering', 'Yoga & Meditation', 'Dancing', 'Writing'
];

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  const handleSave = () => {
    localStorage.setItem(getUserStorageKey(window.location.search), JSON.stringify(formData));
    setIsEditing(false);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              isEditing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Your Privacy is Protected</h3>
              <p className="text-sm text-green-700">
                Your exact location is never shared. Other users only see general proximity and compatibility information.
                You control your visibility and can turn it off anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MBTI Type */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality Type</h3>
        {isEditing ? (
          <div className="grid grid-cols-4 gap-3">
            {MBTI_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setFormData(prev => ({ ...prev, mbtiType: type }))}
                className={`p-3 rounded-xl font-semibold transition-all ${
                  formData.mbtiType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-900">{user.mbtiType}</div>
            <div className="text-gray-600">
              <p className="font-medium">Myers-Briggs Type Indicator</p>
              <p className="text-sm">Used for personality-based matching</p>
            </div>
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  formData.interests.includes(interest)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.interests.map(interest => (
              <span key={interest} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Conversation Preferences */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation Preferences</h3>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Openness to conversations</label>
              <div className="space-y-2">
                {[
                  { value: 'very-open', label: 'Very Open', desc: 'I love meeting new people and starting conversations!' },
                  { value: 'somewhat-open', label: 'Somewhat Open', desc: 'I enjoy conversations but prefer a gentle approach' },
                  { value: 'prefer-quiet', label: 'Prefer Quiet', desc: 'I like meeting people but prefer subtle interactions first' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, openness: option.value as any }))}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      formData.openness === option.value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className={`text-sm ${formData.openness === option.value ? 'text-blue-100' : 'text-gray-500'}`}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Openness Level</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{user.openness.replace('-', ' ')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Custom Answers */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Weekend Activity</p>
            <p className="text-gray-900 capitalize">{user.customAnswers.weekendActivity.replace('-', ' ')}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Conversation Style</p>
            <p className="text-gray-900 capitalize">{user.customAnswers.conversationStyle.replace('-', ' ')}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-1">Social Energy</p>
            <p className="text-gray-900 capitalize">{user.customAnswers.socialEnergy.replace('-', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;