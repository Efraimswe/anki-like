'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { useToast } from '@/components/ui/Toast';
import { skillKeys, skillsOptions } from '@/lib/queries/skills';
import { SKILLS, type SkillCode } from '@/lib/skills';
import type { SkillProgressUpdate, SkillsResponse } from '@/types';

export function useSkills() {
  return useQuery(skillsOptions);
}

interface SkillMutationInput {
  skill: SkillCode;
  level: number;
  action: 'complete' | 'uncomplete';
}

interface SkillMutationContext {
  previous: SkillsResponse | undefined;
}

export function useSkillMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<SkillProgressUpdate, Error, SkillMutationInput, SkillMutationContext>({
    mutationFn: (v) =>
      fetchApi<SkillProgressUpdate>('/api/skills/progress', {
        method: 'POST',
        body: JSON.stringify(v),
      }),
    onMutate: async ({ skill, level, action }) => {
      await queryClient.cancelQueries({ queryKey: skillKeys.all });
      const previous = queryClient.getQueryData<SkillsResponse>(skillKeys.all);
      queryClient.setQueryData<SkillsResponse>(skillKeys.all, (prev) =>
        prev
          ? { progress: { ...prev.progress, [skill]: action === 'complete' ? level : level - 1 } }
          : prev,
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(skillKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t save — try again' });
    },
    onSuccess: (_data, { skill, level, action }) => {
      const name = SKILLS[skill].name;
      toast({
        type: 'success',
        title:
          action === 'complete' ? `${name} · Level ${level} complete` : `${name} · Level ${level} reopened`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}
