export interface AiAnswerCard {
  title: string;
  type: string;
  summary: string;
}

export interface AskQuestionResponse {
  answers: AiAnswerCard[];
  sessionId?: string;
}

export interface ChatHistoryItem {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  items: ChatHistoryItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  sessionId?: string;
}
