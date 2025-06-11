export interface Question {
  question: string;
  answer: string;
}

export interface KnowledgeBase {
  answers: Question[];
}

export interface SourceResponse {
  task: string;
  data: string[];
}

export interface TimestampResponse {
  code: number;
  message: {
    signature: string;
    timestamp: number;
    challenges: string[];
  };
}

export interface ReportPayload {
  apikey: string;
  timestamp: number;
  signature: string;
  answer: string;
}
