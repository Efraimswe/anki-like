import { api } from '@/shared/api/base';
import type { User } from '@/entities/user';
import type { Session } from '../model/types';

export function signUp(email: string, password: string) {
  return api.post<{ user: User }>('/auth/sign-up', { email, password });
}

export function signIn(email: string, password: string) {
  return api.post<{ user: User }>('/auth/sign-in', { email, password });
}

export function signOut() {
  return api.post<{ message: string }>('/auth/sign-out');
}

export function refreshSession() {
  return api.post<{ message: string }>('/auth/refresh');
}

export function getSessions() {
  return api.get<{ sessions: Session[] }>('/sessions');
}

export function revokeSession(id: string) {
  return api.delete<{ message: string }>(`/sessions/${id}`);
}
