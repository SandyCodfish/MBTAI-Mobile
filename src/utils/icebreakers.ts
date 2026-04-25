import { User, PotentialMatch, Icebreaker } from '../types/user';

const GENERAL_ICEBREAKERS = [
  "What's been the highlight of your week so far?",
  "I noticed we both love [shared interest] - any recent discoveries?",
  "This place has such a nice vibe, do you come here often?",
  "I'm always looking for new [shared interest] recommendations - got any favorites?",
  "Your personality type suggests you might appreciate this question: what's something you've learned recently that excited you?"
];

const MBTI_SPECIFIC_ICEBREAKERS: { [key: string]: string[] } = {
  'ENFP': [
    "I love how ENFPs see possibilities everywhere - what's got you excited lately?",
    "Your energy seems contagious - what project or idea are you passionate about right now?",
    "ENFPs often have the best stories - what's been your latest adventure?"
  ],
  'INFJ': [
    "INFJs often have such interesting perspectives - I'd love to hear your thoughts on...",
    "You seem like someone who thinks deeply about things - what's been on your mind lately?",
    "I'm curious about your take on [shared interest] - INFJs often have unique insights"
  ],
  'ENTP': [
    "I bet you have some interesting theories about [shared interest] - want to share?",
    "ENTPs always challenge my thinking - what's a topic you could debate for hours?",
    "Your mind probably works in fascinating ways - what's a random connection you've made recently?"
  ],
  'INTJ': [
    "INTJs often have well-thought-out opinions - I'm curious what you think about...",
    "You strike me as someone with interesting long-term projects - what are you working towards?",
    "I'd love to pick your brain about [shared interest] - you probably have some deep insights"
  ]
};

const CONTEXT_ICEBREAKERS: { [key: string]: string[] } = {
  'Coffee Shop': [
    "What's your go-to coffee order? I'm always trying to expand beyond my usual.",
    "This coffee shop has such great ambiance for [shared interest] - do you ever work on projects here?",
    "I'm terrible at choosing from all these options - any recommendations?"
  ],
  'Library': [
    "I love libraries for the focused energy - are you working on something interesting?",
    "The book selection here is amazing - any recent reads you'd recommend?",
    "There's something so inspiring about being surrounded by all this knowledge, don't you think?"
  ],
  'Park': [
    "Beautiful day to be outside! Do you come here often to [activity based on shared interest]?",
    "This park is perfect for people-watching and thinking - very [MBTI trait] of you!",
    "I love how parks bring out everyone's different energy - what draws you here?"
  ],
  'Bookstore': [
    "I could spend hours here - what section draws you in first?",
    "Independent bookstores have such character - have you discovered any gems here?",
    "With our shared love of [shared interest], I bet you have great book recommendations"
  ]
};

const INTEREST_ICEBREAKERS: { [key: string]: string[] } = {
  'Coffee Culture': [
    "Fellow coffee enthusiast! What's your brewing method of choice?",
    "I'm always looking for new coffee spots - any hidden gems you'd recommend?",
    "Coffee and [another shared interest] seem like a perfect combination - ever tried both together?"
  ],
  'Hiking & Nature': [
    "I see we both love the outdoors - any favorite trails around here?",
    "Nature seems to be where [MBTI type]s recharge - is that true for you too?",
    "What's the most beautiful natural spot you've discovered recently?"
  ],
  'Reading': [
    "A fellow reader! What's captivating you lately?",
    "I'm always curious how different personality types approach reading - fiction or non-fiction?",
    "Any books that have changed your perspective recently?"
  ],
  'Art & Museums': [
    "Art appreciation is so personal - what style or period speaks to you most?",
    "Museums are perfect for [MBTI type]s - do you prefer contemporary or classical?",
    "Any recent exhibitions that left an impression on you?"
  ]
};

export const generateIcebreakers = (user: User, match: PotentialMatch): Icebreaker[] => {
  const icebreakers: Icebreaker[] = [];

  // Add MBTI-specific icebreaker
  const mbtiIcebreakers = MBTI_SPECIFIC_ICEBREAKERS[match.mbtiType];
  if (mbtiIcebreakers) {
    const randomMBTI = mbtiIcebreakers[Math.floor(Math.random() * mbtiIcebreakers.length)];
    icebreakers.push({
      id: '1',
      text: randomMBTI,
      category: `MBTI: ${match.mbtiType}`
    });
  }

  // Add context-specific icebreaker
  if (match.nearbyContext) {
    const contextIcebreakers = CONTEXT_ICEBREAKERS[match.nearbyContext];
    if (contextIcebreakers) {
      const randomContext = contextIcebreakers[Math.floor(Math.random() * contextIcebreakers.length)];
      icebreakers.push({
        id: '2',
        text: randomContext.replace('[MBTI trait]', match.mbtiType.toLowerCase()).replace('[activity based on shared interest]', match.sharedInterests[0]?.toLowerCase() || 'relaxing'),
        category: `Location: ${match.nearbyContext}`
      });
    }
  }

  // Add shared interest icebreaker
  if (match.sharedInterests.length > 0) {
    const sharedInterest = match.sharedInterests[0];
    const interestIcebreakers = INTEREST_ICEBREAKERS[sharedInterest];
    if (interestIcebreakers) {
      const randomInterest = interestIcebreakers[Math.floor(Math.random() * interestIcebreakers.length)];
      icebreakers.push({
        id: '3',
        text: randomInterest
          .replace('[MBTI type]', match.mbtiType)
          .replace('[another shared interest]', match.sharedInterests[1] || 'good conversation'),
        category: `Shared Interest: ${sharedInterest}`
      });
    }
  }

  // Add a general icebreaker if we need more
  if (icebreakers.length < 3) {
    const generalIcebreaker = GENERAL_ICEBREAKERS[Math.floor(Math.random() * GENERAL_ICEBREAKERS.length)];
    icebreakers.push({
      id: '4',
      text: generalIcebreaker.replace('[shared interest]', match.sharedInterests[0]?.toLowerCase() || 'interesting topics'),
      category: 'General'
    });
  }

  return icebreakers.slice(0, 3); // Return top 3 icebreakers
};