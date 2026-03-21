import { api } from './client';

export interface Session {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function getSessions() {
  return api.get<{ sessions: Session[] }>('/sessions');
}

export function revokeSession(id: string) {
  return api.delete<{ message: string }>(`/sessions/${id}`);
}
