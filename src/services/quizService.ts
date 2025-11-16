import { supabase } from './supabase/client';
import type { Question } from '../types/quiz';

export const loadQuizQuestions = async (quizId: string): Promise<Question[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('global_order', { ascending: true });

    if (error) throw error;

    console.log('✅ Loaded questions:', data.length);
    return data as Question[];
  } catch (error) {
    console.error('Failed to load questions:', error);
    throw error;
  }
};

export const getQuestionsByStage = (questions: Question[], stageNumber: number): Question[] => {
  return questions.filter(q => q.stage_id === `stage-${stageNumber}`);
};
