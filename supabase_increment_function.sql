CREATE OR REPLACE FUNCTION increment_player_score(
  p_player_id UUID,
  p_points INTEGER,
  p_is_correct BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE session_players
  SET 
    total_score = total_score + p_points,
    questions_answered = questions_answered + 1,
    correct_answers = CASE WHEN p_is_correct THEN correct_answers + 1 ELSE correct_answers END,
    last_activity = NOW()
  WHERE id = p_player_id;
END;
$$;
