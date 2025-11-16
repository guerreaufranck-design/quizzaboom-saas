export type ThemeCategory = 
  | 'general'
  | 'sport'
  | 'history'
  | 'geography'
  | 'science'
  | 'entertainment'
  | 'arts'
  | 'food'
  | 'mix';

export type ThemeMode = 'standard' | 'funny' | 'kids';

export interface Theme {
  id: string;
  category: ThemeCategory;
  label: string;
  description: string;
  emoji: string;
  subThemes?: string[];
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
