import { api } from './client';
import type { User } from './auth';

export function getMe() {
  return api.get<User>('/users/me');
}

export function updateProfile(data: { displayName?: string | null }) {
  return api.patch<User>('/users/me', data);
}
