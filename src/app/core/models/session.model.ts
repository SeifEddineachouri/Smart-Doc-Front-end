export interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastQuestion?: string | null;
  status?: 'active' | 'archived';
}
