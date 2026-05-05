export interface UploadedDocument {
  id: number;
  name: string;
  size: string;
  mimeType: string;
  sessionId?: string;
}

export interface AskQuestionRequest {
  question: string;
  documents: UploadedDocument[];
}
