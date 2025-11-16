import type { AIQuizResponse } from '../types/quiz';

const THEME_NAMES = [
  'History & Culture',
  'Science & Nature',
  'Sports & Entertainment',
  'Geography & Travel',
  'Arts & Literature',
];

export const generateMockQuiz = (
  theme: string,
  totalQuestions: number,
  totalStages: number,
  questionsPerStage: number,
  difficulty: string,
  language: string,
  duration: number
): AIQuizResponse => {
  console.log('🎭 Generating MOCK quiz (Gemini unavailable)');

  const questions = [
    {
      question_text: "Quelle est la capitale de la France ?",
      options: ["Londres", "Paris", "Berlin", "Madrid"],
      correct_answer: "Paris",
      explanation: "Paris est la capitale de la France depuis 987.",
      fun_fact: "Paris compte plus de 400 parcs et jardins !",
    },
    {
      question_text: "Combien de joueurs composent une équipe de football ?",
      options: ["9", "10", "11", "12"],
      correct_answer: "11",
      explanation: "Une équipe de football est composée de 11 joueurs sur le terrain.",
      fun_fact: "Le football est le sport le plus populaire au monde !",
    },
    {
      question_text: "En quelle année l'homme a-t-il marché sur la Lune ?",
      options: ["1965", "1967", "1969", "1971"],
      correct_answer: "1969",
      explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969.",
      fun_fact: "Les empreintes de pas sur la Lune peuvent durer des millions d'années !",
    },
    {
      question_text: "Quel est le plus grand océan du monde ?",
      options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
      correct_answer: "Pacifique",
      explanation: "L'océan Pacifique couvre environ 165 millions de km².",
      fun_fact: "Le Pacifique contient plus de 25 000 îles !",
    },
    {
      question_text: "Qui a peint la Joconde ?",
      options: ["Picasso", "Van Gogh", "Léonard de Vinci", "Michel-Ange"],
      correct_answer: "Léonard de Vinci",
      explanation: "Léonard de Vinci a peint la Joconde entre 1503 et 1506.",
      fun_fact: "La Joconde n'a pas de sourcils !",
    },
  ];

  const stages = [];
  let globalQuestionIndex = 0;

  for (let stageNum = 0; stageNum < totalStages; stageNum++) {
    const stageQuestions = [];
    const stageName = THEME_NAMES[stageNum % THEME_NAMES.length];
    
    for (let q = 0; q < questionsPerStage && globalQuestionIndex < totalQuestions; q++) {
      const baseQuestion = questions[globalQuestionIndex % questions.length];
      
      stageQuestions.push({
        ...baseQuestion,
        question_type: 'multiple_choice',
        points: 100,
        time_limit: 20,
        difficulty: difficulty,
      });
      
      globalQuestionIndex++;
    }

    stages.push({
      stageNumber: stageNum + 1,
      theme: stageName,
      questions: stageQuestions,
    });
  }

  return {
    title: `Quiz ${theme}`,
    description: `Un quiz ${difficulty} avec ${totalQuestions} questions`,
    estimatedDuration: duration,
    stages: stages,
  };
};
