export interface SAnswer {
  id: number;
  question_id: number;
  answer_text: string;
}

export interface SQuestion {
  id: number;
  survey_id: number;
  question_text: string;
  answers: SAnswer[];
}