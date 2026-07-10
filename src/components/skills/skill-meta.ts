import { Mic, BookOpen, Headphones, PenLine, Library, GraduationCap, type LucideIcon } from 'lucide-react';
import type { SkillCode } from '@/lib/skills';

export const SKILL_META: Record<SkillCode, { Icon: LucideIcon; accent: string; nodeClass: string }> = {
  speaking: { Icon: Mic, accent: 'var(--duo-green)', nodeClass: 'duo-node--green' },
  reading: { Icon: BookOpen, accent: 'var(--duo-blue)', nodeClass: 'duo-node--blue' },
  listening: { Icon: Headphones, accent: 'var(--duo-purple)', nodeClass: 'duo-node--purple' },
  writing: { Icon: PenLine, accent: 'var(--duo-orange)', nodeClass: 'duo-node--orange' },
  vocabulary: { Icon: Library, accent: 'var(--duo-gold)', nodeClass: 'duo-node--gold' },
  grammar: { Icon: GraduationCap, accent: 'var(--duo-red)', nodeClass: 'duo-node--purple' },
};
