import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Heart, Users, MessageCircle } from 'lucide-react';
import { User } from '../types/user';

interface OnboardingFlowProps {
  onComplete: (user: User) => void;
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

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    mbtiType: '',
    interests: [] as string[],
    openness: '' as 'very-open' | 'somewhat-open' | 'prefer-quiet' | '',
    customAnswers: {
      weekendActivity: '',
      conversationStyle: '',
      socialEnergy: ''
    }
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = () => {
    const user: User = {
      id: Date.now().toString(),
      email: formData.email,
      mbtiType: formData.mbtiType,
      interests: formData.interests,
      openness: formData.openness,
      customAnswers: formData.customAnswers,
      isVisible: true
    };
    onComplete(user);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: return formData.email.includes('@');
      case 2: return formData.mbtiType !== '';
      case 3: return formData.interests.length >= 3;
      case 4: return formData.openness !== '';
      case 5: return Object.values(formData.customAnswers).every(answer => answer !== '');
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step + 1} of 6</span>
            <span className="text-sm text-gray-500">{Math.round(((step + 1) / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {step === 0 && (
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MBTAI</h1>
              <p className="text-gray-600 text-lg">Discover meaningful connections with personality-compatible people nearby</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-xl">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">MBTI AI Matching</h3>
                <p className="text-sm text-gray-600">Connect based on AI-powered personality compatibility</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">AI Assistance</h3>
                <p className="text-sm text-gray-600">Start conversations with AI-generated icebreakers</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <Heart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
                <p className="text-sm text-gray-600">Your location and identity stay protected</p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get started</h2>
            <p className="text-gray-600 mb-6">First, we'll need your email for your account</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your MBTI type?</h2>
            <p className="text-gray-600 mb-6">This helps our AI find compatible personalities nearby</p>
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
            <p className="text-sm text-gray-500 mt-4">
              Don't know your type? Take a <a href="https://www.16personalities.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">quick test</a> first
            </p>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you?</h2>
            <p className="text-gray-600 mb-6">Select at least 3 interests to help our AI find great conversation partners</p>
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
            <p className="text-sm text-gray-500 mt-4">
              Selected: {formData.interests.length} (minimum 3 required)
            </p>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How open are you to conversations?</h2>
            <p className="text-gray-600 mb-6">This helps our AI know how to approach you</p>
            <div className="space-y-3">
              {[
                { value: 'very-open', label: 'Very Open', desc: 'I love meeting new people and starting conversations!' },
                { value: 'somewhat-open', label: 'Somewhat Open', desc: 'I enjoy conversations but prefer a gentle approach' },
                { value: 'prefer-quiet', label: 'Prefer Quiet', desc: 'I like meeting people but prefer subtle interactions first' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, openness: option.value as any }))}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
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
        )}

        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">A few more questions</h2>
            <p className="text-gray-600 mb-6">These help our AI create better conversation starters</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's your ideal weekend activity?</label>
                <select
                  value={formData.customAnswers.weekendActivity}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customAnswers: { ...prev.customAnswers, weekendActivity: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="outdoor-adventure">Outdoor adventures</option>
                  <option value="cozy-indoor">Cozy indoor activities</option>
                  <option value="social-events">Social events and gatherings</option>
                  <option value="creative-projects">Creative projects</option>
                  <option value="learning-exploring">Learning and exploring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How do you prefer conversations?</label>
                <select
                  value={formData.customAnswers.conversationStyle}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customAnswers: { ...prev.customAnswers, conversationStyle: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="deep-meaningful">Deep and meaningful</option>
                  <option value="light-fun">Light and fun</option>
                  <option value="balanced-mix">A balanced mix</option>
                  <option value="topic-specific">Focused on specific topics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Where do you get social energy?</label>
                <select
                  value={formData.customAnswers.socialEnergy}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customAnswers: { ...prev.customAnswers, socialEnergy: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an option</option>
                  <option value="large-groups">Large groups and events</option>
                  <option value="small-intimate">Small, intimate gatherings</option>
                  <option value="one-on-one">One-on-one conversations</option>
                  <option value="online-connections">Online connections</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              step === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Complete Setup
              <Heart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;