import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SkillMapDoc } from '@/lib/skillMap/schema';
import type { SkillLevels } from '@/lib/onboarding/skillLevels';

export const skillMapKey = ['skillMap'] as const;

export type SkillMapResponse = SkillMapDoc & {
  updatedAt: string;
  isSeed: boolean;
  skillLevels: SkillLevels | null;
};

export async function fetchSkillMap(): Promise<SkillMapResponse> {
  const res = await fetch('/api/map', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load map: ${res.status}`);
  return res.json();
}

export function useSkillMap() {
  return useQuery({ queryKey: skillMapKey, queryFn: fetchSkillMap });
}

export function useSaveSkillMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: SkillMapDoc) => {
      const res = await fetch('/api/map', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (res.status === 422) {
        const err = await res.json();
        throw Object.assign(new Error('invalid_payload'), { issues: err.issues });
      }
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      return res.json() as Promise<SkillMapDoc & { updatedAt: string }>;
    },
    onSuccess: (data) => {
      qc.setQueryData(skillMapKey, (prev: SkillMapResponse | undefined) => ({
        ...data,
        isSeed: false,
        skillLevels: prev?.skillLevels ?? null,
      }));
    },
  });
}

export function useUpdateSkillLevels() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (skillLevels: SkillLevels) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillLevels }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      return skillLevels;
    },
    onSuccess: (skillLevels) => {
      qc.setQueryData(skillMapKey, (prev: SkillMapResponse | undefined) =>
        prev ? { ...prev, skillLevels } : prev
      );
    },
  });
}
