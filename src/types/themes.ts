export type ThemeCategory =
  | 'general'
  | 'sport'
  | 'history'
  | 'geography'
  | 'science'
  | 'entertainment'
  | 'arts'
  | 'food'
  | 'myths'
  | 'everyday_objects'
  | 'etymology'
  | 'absurd_laws'
  | 'human_bizarre'
  | 'mix'
  | 'custom';

export type ThemeMode = 'standard' | 'funny' | 'kids';

export interface Theme {
  id: string;
  category: ThemeCategory;
  label: string;
  description: string;
  emoji: string;
  subThemes?: string[];
  isCustom?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'general',
    category: 'general',
    label: 'General Knowledge',
    description: 'Mix of various topics',
    emoji: '🎯',
    subThemes: ['Current Events', 'Famous People', 'Common Knowledge', 'Trivia'],
  },
  {
    id: 'myths',
    category: 'myths',
    label: 'Myths & Urban Legends',
    description: 'False beliefs and popular misconceptions',
    emoji: '🦄',
    subThemes: ['Urban Legends', 'Debunked Myths', 'Popular Misconceptions', 'False Beliefs'],
  },
  {
    id: 'everyday_objects',
    category: 'everyday_objects',
    label: 'History of Everyday Objects',
    description: 'Origins and evolution of common items',
    emoji: '🔧',
    subThemes: ['Invention Stories', 'Object Evolution', 'Daily Life History', 'Original Purposes'],
  },
  {
    id: 'etymology',
    category: 'etymology',
    label: 'Etymology & Word Origins',
    description: 'Where words and expressions come from',
    emoji: '📖',
    subThemes: ['Word Origins', 'Expressions History', 'Language Evolution', 'Strange Etymology'],
  },
  {
    id: 'absurd_laws',
    category: 'absurd_laws',
    label: 'Absurd Laws',
    description: 'Real but ridiculous laws around the world',
    emoji: '⚖️',
    subThemes: ['Weird Regulations', 'Outdated Laws', 'Strange Prohibitions', 'Legal Curiosities'],
  },
  {
    id: 'human_bizarre',
    category: 'human_bizarre',
    label: 'Bizarre Human Facts (True/False)',
    description: 'Strange but true facts about humans',
    emoji: '🧠',
    subThemes: ['Body Facts', 'Psychology', 'Human Abilities', 'Medical Oddities'],
  },
  {
    id: 'sport',
    category: 'sport',
    label: 'Sports',
    description: 'Football, basketball, Olympics...',
    emoji: '⚽',
    subThemes: ['Football', 'Basketball', 'Tennis', 'Olympics', 'Athletes'],
  },
  {
    id: 'history',
    category: 'history',
    label: 'History',
    description: 'World history and events',
    emoji: '📜',
    subThemes: ['Ancient History', 'World Wars', 'Middle Ages', 'Modern History', 'Civilizations'],
  },
  {
    id: 'geography',
    category: 'geography',
    label: 'Geography',
    description: 'Countries, capitals, landmarks',
    emoji: '🌍',
    subThemes: ['Countries', 'Capitals', 'Landmarks', 'Mountains', 'Rivers'],
  },
  {
    id: 'science',
    category: 'science',
    label: 'Science',
    description: 'Physics, chemistry, biology',
    emoji: '🔬',
    subThemes: ['Physics', 'Chemistry', 'Biology', 'Space', 'Technology'],
  },
  {
    id: 'entertainment',
    category: 'entertainment',
    label: 'Entertainment',
    description: 'Movies, music, TV shows',
    emoji: '🎬',
    subThemes: ['Movies', 'Music', 'TV Shows', 'Celebrities', 'Video Games'],
  },
  {
    id: 'arts',
    category: 'arts',
    label: 'Arts & Culture',
    description: 'Painting, literature, architecture',
    emoji: '🎨',
    subThemes: ['Painting', 'Literature', 'Architecture', 'Sculpture', 'Photography'],
  },
  {
    id: 'food',
    category: 'food',
    label: 'Food & Drinks',
    description: 'Cuisine, recipes, restaurants',
    emoji: '🍕',
    subThemes: ['World Cuisine', 'Desserts', 'Wine & Spirits', 'Recipes', 'Restaurants'],
  },
  {
    id: 'mix',
    category: 'mix',
    label: 'Mixed Topics',
    description: 'Variety of all categories',
    emoji: '🎲',
    subThemes: ['Random Mix', 'Surprise Me!'],
  },
  {
    id: 'custom',
    category: 'custom',
    label: 'Custom Theme',
    description: 'Enter your own topic',
    emoji: '✏️',
    isCustom: true,
  },
];

export const THEME_MODES = {
  standard: {
    id: 'standard',
    label: 'Standard',
    emoji: '📚',
    description: 'Classic quiz format',
  },
  funny: {
    id: 'funny',
    label: 'Funny Mode',
    emoji: '😂',
    description: 'Humorous questions and answers',
  },
  kids: {
    id: 'kids',
    label: 'Kids Mode',
    emoji: '👶',
    description: 'Adapted for children (ages 6-12)',
  },
};
