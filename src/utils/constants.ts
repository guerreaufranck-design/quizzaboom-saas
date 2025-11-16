// Pricing Plans
export const B2B_PLANS = {
  STARTER: {
    name: 'Starter',
    price: 69,
    quizLimit: 5,
    maxParticipants: 250,
    features: ['5 quizzes/month', 'Up to 250 players', '30-day free trial']
  },
  PRO: {
    name: 'Pro',
    price: 99,
    quizLimit: null, // unlimited
    maxParticipants: 250,
    seats: 2,
    whiteLabel: true,
    features: ['Unlimited quizzes', '2 team seats', 'White label', 'Up to 250 players', '30-day free trial']
  }
} as const;

export const B2C_PLANS = {
  TIER_1: { name: 'Friends', price: 1.99, maxPlayers: 5 },
  TIER_2: { name: 'Small Group', price: 4.99, maxPlayers: 15 },
  TIER_3: { name: 'Party', price: 9.99, maxPlayers: 50 },
  TIER_4: { name: 'Event', price: 19.99, maxPlayers: 250 }
} as const;

// Strategic Game Constants
export const GAME_PHASES = {
  ANNOUNCEMENT: { name: 'Announcement', duration: 12 },
  JOKERS: { name: 'Jokers', duration: 12 },
  QUESTION: { name: 'Question', duration: 30 },
  RESULTS: { name: 'Results', duration: 5 }
} as const;

export const JOKER_TYPES = {
  PROTECTION: { name: 'Protection', icon: '🛡️', uses: 2 },
  BLOCK: { name: 'Block', icon: '🚫', uses: 10 },
  STEAL: { name: 'Steal', icon: '💰', uses: 10 },
  DOUBLE_POINTS: { name: 'Double Points', icon: '⭐', uses: 5 }
} as const;

// App Routes
export const ROUTES = {
  HOME: '/',
  B2C_LANDING: '/host-your-quiz',
  CREATE_QUIZ: '/create',
  JOIN_QUIZ: '/join',
  LOBBY: '/lobby',
  PLAY: '/play',
  HOST_DASHBOARD: '/host',
  TV_DISPLAY: '/tv',
  RESULTS: '/results',
  ORG_DASHBOARD: '/dashboard',
  CHECKOUT: '/checkout',
  AUTH: '/auth'
} as const;
