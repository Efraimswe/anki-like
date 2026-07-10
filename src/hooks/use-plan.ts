'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/auth-client';
import { useToast } from '@/components/ui/Toast';
import { planKeys, planGoalsOptions } from '@/lib/queries/plan';
import { skillKeys } from '@/lib/queries/skills';
import type { SkillCode } from '@/lib/skills';
import type {
  CreateBigGoalResult,
  CreateMediumGoalResult,
  PlanGoalsResponse,
  PlanMediumGoal,
} from '@/types';

export function usePlanGoals() {
  return useQuery(planGoalsOptions);
}

interface MutationContext {
  previous: PlanGoalsResponse | undefined;
}

// Immutable helpers over the cached PlanGoalsResponse ---------------------

function setBigGoalCompleted(data: PlanGoalsResponse, id: string, completed: boolean): PlanGoalsResponse {
  return { goals: data.goals.map((g) => (g.id === id ? { ...g, completed } : g)) };
}

function removeBigGoal(data: PlanGoalsResponse, id: string): PlanGoalsResponse {
  return { goals: data.goals.filter((g) => g.id !== id) };
}

function setMediumGoalCompleted(data: PlanGoalsResponse, id: string, completed: boolean): PlanGoalsResponse {
  return {
    goals: data.goals.map((g) => ({
      ...g,
      mediumGoals: g.mediumGoals.map((m) => (m.id === id ? { ...m, completed } : m)),
    })),
  };
}

function setBigGoalTitle(data: PlanGoalsResponse, id: string, title: string): PlanGoalsResponse {
  return { goals: data.goals.map((g) => (g.id === id ? { ...g, title } : g)) };
}

function setMediumGoalTitle(data: PlanGoalsResponse, id: string, title: string): PlanGoalsResponse {
  return {
    goals: data.goals.map((g) => ({
      ...g,
      mediumGoals: g.mediumGoals.map((m) => (m.id === id ? { ...m, title } : m)),
    })),
  };
}

function removeMediumGoal(data: PlanGoalsResponse, id: string): PlanGoalsResponse {
  return {
    goals: data.goals.map((g) => ({
      ...g,
      mediumGoals: g.mediumGoals.filter((m) => m.id !== id),
    })),
  };
}

function addMediumGoal(data: PlanGoalsResponse, bigGoalId: string, medium: PlanMediumGoal): PlanGoalsResponse {
  return {
    goals: data.goals.map((g) =>
      g.id === bigGoalId ? { ...g, mediumGoals: [...g.mediumGoals, medium] } : g,
    ),
  };
}

// Aim: create a big goal from /skills ---------------------------------------

export function useCreateBigGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<CreateBigGoalResult, Error, SkillCode>({
    mutationFn: (skill) =>
      fetchApi<CreateBigGoalResult>('/api/plan/goals', {
        method: 'POST',
        body: JSON.stringify({ skill }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      toast(
        data.duplicate
          ? { type: 'info', title: 'Already in your plan' }
          : { type: 'success', title: 'Added to your plan' },
      );
    },
    onError: () => {
      toast({ type: 'error', title: 'Couldn’t add — try again' });
    },
  });
}

// Toggle big goal completion (optimistic) -----------------------------------

export function useToggleBigGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string; completed: boolean }, Error, { id: string; completed: boolean }, MutationContext>({
    mutationFn: ({ id, completed }) =>
      fetchApi(`/api/plan/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? setBigGoalCompleted(prev, id, completed) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t save — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      // toggling a big goal advances/rolls back the linked skill level
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}

// Update big goal title (optimistic) -----------------------------------------

export function useUpdateBigGoalTitle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string; title: string }, Error, { id: string; title: string }, MutationContext>({
    mutationFn: ({ id, title }) =>
      fetchApi(`/api/plan/goals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? setBigGoalTitle(prev, id, title) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t save — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

// Delete big goal (optimistic — call after the delete animation finishes) --

export function useDeleteBigGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string }, Error, string, MutationContext>({
    mutationFn: (id) => fetchApi(`/api/plan/goals/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? removeBigGoal(prev, id) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t delete — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

// Create a medium goal (optimistic, temp id) --------------------------------

export function useCreateMediumGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    CreateMediumGoalResult,
    Error,
    { bigGoalId: string; title: string },
    MutationContext & { tempId: string }
  >({
    mutationFn: ({ bigGoalId, title }) =>
      fetchApi<CreateMediumGoalResult>(`/api/plan/goals/${bigGoalId}/medium`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onMutate: async ({ bigGoalId, title }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      const tempId = crypto.randomUUID();
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev
          ? addMediumGoal(prev, bigGoalId, {
              id: tempId,
              title,
              completed: false,
              createdAt: new Date().toISOString(),
            })
          : prev,
      );
      return { previous, tempId };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t add — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

// Toggle medium goal completion (optimistic) --------------------------------

export function useToggleMediumGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string; completed: boolean }, Error, { id: string; completed: boolean }, MutationContext>({
    mutationFn: ({ id, completed }) =>
      fetchApi(`/api/plan/medium/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? setMediumGoalCompleted(prev, id, completed) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t save — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

// Update medium goal title (optimistic) ---------------------------------------

export function useUpdateMediumGoalTitle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string; title: string }, Error, { id: string; title: string }, MutationContext>({
    mutationFn: ({ id, title }) =>
      fetchApi(`/api/plan/medium/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? setMediumGoalTitle(prev, id, title) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t save — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

// Delete medium goal (optimistic — call after the delete animation finishes)

export function useDeleteMediumGoal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<{ id: string }, Error, string, MutationContext>({
    mutationFn: (id) => fetchApi(`/api/plan/medium/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: planKeys.all });
      const previous = queryClient.getQueryData<PlanGoalsResponse>(planKeys.all);
      queryClient.setQueryData<PlanGoalsResponse>(planKeys.all, (prev) =>
        prev ? removeMediumGoal(prev, id) : prev,
      );
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) queryClient.setQueryData(planKeys.all, context.previous);
      toast({ type: 'error', title: 'Couldn’t delete — try again' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}
