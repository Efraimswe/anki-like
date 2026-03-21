import { api } from './client';

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt?: string;
}

export function signUp(email: string, password: string) {
  return api.post<{ user: User }>('/auth/sign-up', { email, password });
}

export function signIn(email: string, password: string) {
  return api.post<{ user: User }>('/auth/sign-in', { email, password });
}

export function signOut() {
  return api.post<{ message: string }>('/auth/sign-out');
}

export function refresh() {
  return api.post<{ message: string }>('/auth/refresh');
}

export function getMe() {
  return api.get<User>('/users/me');
}
