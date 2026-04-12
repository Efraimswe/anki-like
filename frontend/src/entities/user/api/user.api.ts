import { api } from '@/shared/api/base';
import type { User } from '../model/types';

export function getMe() {
  return api.get<User>('/users/me');
}

export function updateProfile(data: { displayName?: string | null }) {
  return api.patch<User>('/users/me', data);
}
