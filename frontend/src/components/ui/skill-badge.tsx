import { cn } from '@/lib/utils';
import type { SkillLevel, GapSeverity } from '@/types';

interface SkillBadgeProps {
  level: SkillLevel;
  className?: string;
}

const levelConfig: Record<SkillLevel, { label: string; class: string }> = {
  beginner: { label: 'Beginner', class: 'skill-badge-beginner' },
  intermediate: { label: 'Intermediate', class: 'skill-badge-intermediate' },
  advanced: { label: 'Advanced', class: 'skill-badge-advanced' },
  expert: { label: 'Expert', class: 'skill-badge-expert' },
};

export function SkillBadge({ level, className }: SkillBadgeProps) {
  const config = levelConfig[level] || { label: 'Unknown', class: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.class,
      className
    )}>
      {config.label}
    </span>
  );
}

interface GapBadgeProps {
  severity: GapSeverity;
  className?: string;
}

const severityConfig: Record<GapSeverity, { label: string; class: string }> = {
  low: { label: 'Low Gap', class: 'gap-low' },
  medium: { label: 'Medium Gap', class: 'gap-medium' },
  high: { label: 'High Gap', class: 'gap-high' },
};

export function GapBadge({ severity, className }: GapBadgeProps) {
  const config = severityConfig[severity] || { label: 'Unknown', class: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.class,
      className
    )}>
      {config.label}
    </span>
  );
}
