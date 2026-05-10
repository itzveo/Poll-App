export interface SAnswer {
  id: number;
  answer_text: string;
  vote_count?: number; 
}

export interface SQuestion {
  id: number;
  question_text: string;
  multi: boolean;
  answers: SAnswer[];
}