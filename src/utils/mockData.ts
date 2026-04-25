import { User, PotentialMatch } from '../types/user';

const SAMPLE_MBTI_TYPES = ['ENFP', 'INFJ', 'ENTP', 'ISFJ', 'ENFJ', 'INTJ', 'ESFP', 'ISTP'];
const SAMPLE_CONTEXTS = ['Coffee Shop', 'Library', 'Park', 'Bookstore', 'Gym', 'Art Gallery', 'Coworking Space'];
const SAMPLE_INTERESTS = [
  'Coffee Culture', 'Hiking & Nature', 'Board Games', 'Reading', 'Art & Museums',
  'Live Music', 'Cooking', 'Photography', 'Fitness', 'Travel', 'Technology',
  'Movies & Series', 'Volunteering', 'Yoga & Meditation', 'Dancing', 'Writing'
];

const MBTI_COMPATIBILITY: { [key: string]: { [key: string]: number } } = {
  'ENFP': { 'INFJ': 95, 'INTJ': 90, 'ENFJ': 85, 'ENTP': 80, 'ISFJ': 75 },
  'INFJ': { 'ENFP': 95, 'ENTP': 90, 'ENFJ': 85, 'INTJ': 80, 'ISFP': 75 },
  'ENTP': { 'INFJ': 90, 'INTJ': 85, 'ENFP': 80, 'ENFJ': 75, 'ISFJ': 70 },
  'INTJ': { 'ENFP': 90, 'ENTP': 85, 'INFJ': 80, 'ENFJ': 75, 'ISFP': 70 },
  'ENFJ': { 'INFP': 90, 'ISFP': 85, 'ENFP': 80, 'INFJ': 75, 'ENTP': 70 },
  'ISFJ': { 'ENFP': 75, 'ESFP': 80, 'ENFJ': 85, 'ISFP': 75, 'ESTP': 70 },
  'ESFP': { 'ISFJ': 80, 'ENFJ': 75, 'ESFJ': 70, 'ISFP': 85, 'ESTP': 75 },
  'ISTP': { 'ENFJ': 70, 'ESFJ': 75, 'ISFP': 80, 'ESTP': 85, 'ENFP': 65 }
};

const getOpennessFromMBTI = (mbti: string): 'very-open' | 'somewhat-open' | 'prefer-quiet' => {
  if (mbti.startsWith('E')) {
    return Math.random() > 0.3 ? 'very-open' : 'somewhat-open';
  } else {
    return Math.random() > 0.5 ? 'somewhat-open' : 'prefer-quiet';
  }
};

const calculateCompatibility = (user: User, matchMBTI: string, sharedInterests: string[]): number => {
  // Base compatibility from MBTI
  const baseScore = MBTI_COMPATIBILITY[user.mbtiType]?.[matchMBTI] || 50;
  
  // Bonus points for shared interests (up to 20 points)
  const interestBonus = Math.min(sharedInterests.length * 5, 20);
  
  // Random variation (±10 points)
  const variation = (Math.random() - 0.5) * 20;
  
  return Math.max(20, Math.min(100, baseScore + interestBonus + variation));
};

const generateSharedInterests = (userInterests: string[]): string[] => {
  const numShared = Math.floor(Math.random() * 4) + 1; // 1-4 shared interests
  const shuffled = [...userInterests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numShared);
};

export const generateMockMatches = (user: User): PotentialMatch[] => {
  const numMatches = Math.floor(Math.random() * 6) + 2; // 2-7 matches
  const matches: PotentialMatch[] = [];

  for (let i = 0; i < numMatches; i++) {
    const matchMBTI = SAMPLE_MBTI_TYPES[Math.floor(Math.random() * SAMPLE_MBTI_TYPES.length)];
    const sharedInterests = generateSharedInterests(user.interests);
    const compatibilityScore = Math.round(calculateCompatibility(user, matchMBTI, sharedInterests));
    const distance = Math.floor(Math.random() * 200) + 20; // 20-220 meters
    const nearbyContext = SAMPLE_CONTEXTS[Math.floor(Math.random() * SAMPLE_CONTEXTS.length)];
    const openness = getOpennessFromMBTI(matchMBTI);

    matches.push({
      id: `match-${i + 1}`,
      mbtiType: matchMBTI,
      compatibilityScore,
      sharedInterests,
      distance,
      nearbyContext,
      openness: openness.replace('-', ' ')
    });
  }

  // Sort by compatibility score (highest first)
  return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};