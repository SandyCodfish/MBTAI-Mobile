export interface User {
  id: string;
  email: string;
  mbtiType: string;
  interests: string[];
  openness: 'very-open' | 'somewhat-open' | 'prefer-quiet';
  customAnswers: {
    weekendActivity: string;
    conversationStyle: string;
    socialEnergy: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  isVisible: boolean;
  nearbyContext?: string;
}

export interface PotentialMatch {
  id: string;
  mbtiType: string;
  compatibilityScore: number;
  sharedInterests: string[];
  distance: number;
  nearbyContext?: string;
  openness: string;
}

export interface Icebreaker {
  id: string;
  text: string;
  category: string;
}